/**
 * Шаг Flow «Рассылка о новинке».
 *
 * Запускается кнопкой «Разослать клиентам» в карточке товара:
 *  - товар ещё не рассылали — письмо «Новинка» со всеми цветами;
 *  - товар уже рассылали, но появились новые варианты — письмо «Новый цвет»;
 *  - новых цветов нет — отказ, если не включено «Разослать повторно».
 *
 * Письма уходят каждому клиенту отдельно (своё имя, своя скидка, своя ссылка отписки)
 * в фоне, с паузой между письмами. Итог — в коллекции «Рассылки» и в уведомлениях CMS.
 */

import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
import { LOG_COLLECTION, newsletterConfig, OPERATION_ID, unsubscribeUrl } from './shared.js'
import { renderNewProductEmail } from './template.js'

const EMAIL_RE = /^[^\s@]+@[^\s@][^\s.@]*(?:\.[^\s.@]+)+$/
const MAX_NOTE = 600

const PRODUCT_FIELDS = [
  'id',
  'title',
  'slug',
  'price',
  'description',
  'announced_at',
  'category.title',
  'product_variants.id',
  'product_variants.is_default',
  'product_variants.announced_at',
  'product_variants.color.name',
  'product_variants.color.hex',
  'product_variants.images.directus_files_id',
  'product_variants.images.sort',
]

/** Товары, по которым письма уходят прямо сейчас — от двойного нажатия. */
const running = new Set()

export default {
  id: OPERATION_ID,
  handler: async (_options, context) => {
    const { accountability, data } = context

    if (!accountability?.user || !(accountability.admin || accountability.app))
      throw new Error('Рассылку запускают только сотрудники из CMS')

    const body = data?.$trigger?.body ?? {}
    if (body.collection !== 'products')
      throw new Error('Рассылка запускается из карточки товара')

    const keys = (Array.isArray(body.keys) ? body.keys : [body.keys]).filter(key => key !== undefined && key !== null && key !== '')
    if (!keys.length)
      throw new Error('Не выбран товар')

    const testEmail = String(body.test_email ?? '').trim().toLowerCase()
    if (testEmail && !EMAIL_RE.test(testEmail))
      throw new Error(`Тестовый адрес «${testEmail}» выглядит неправильно`)

    const request = {
      testEmail,
      note: String(body.note ?? '').trim().slice(0, MAX_NOTE),
      resend: body.resend === true || body.resend === 'true',
    }

    const results = []
    for (const key of keys) {
      try {
        results.push(await startCampaign(key, request, context))
      }
      catch (error) {
        await notify(context.database, accountability.user, {
          subject: 'Рассылка не запущена',
          message: error.message,
        })
        throw error
      }
    }

    return results
  },
}

async function startCampaign(productId, { testEmail, note, resend }, context) {
  const { services, database, getSchema, env, logger, accountability } = context
  const config = newsletterConfig(env)
  const schema = await getSchema()

  if (!env.SECRET)
    throw new Error('В Directus не задан SECRET — ссылки отписки не подписать')

  const products = new services.ItemsService('products', { schema, knex: database })
  const product = await products.readOne(productId, { fields: PRODUCT_FIELDS })
  if (!product)
    throw new Error(`Товар ${productId} не найден`)

  if (running.has(product.id))
    throw new Error(`По товару «${product.title}» письма уже отправляются — дождитесь окончания`)

  const variants = sortVariants(product.product_variants ?? [])
  const unannounced = variants.filter(v => !v.announced_at)

  let kind = 'product'
  if (product.announced_at && !resend) {
    if (unannounced.length)
      kind = 'variant'
    else if (!testEmail)
      throw new Error(`По товару «${product.title}» письмо уже уходило ${formatDate(product.announced_at)}, новых цветов с тех пор нет. Чтобы отправить ещё раз, включите «Разослать повторно».`)
  }

  const newIds = new Set(kind === 'variant' ? unannounced.map(v => v.id) : [])
  const recipients = testEmail
    ? [await findTestRecipient(database, testEmail)]
    : await findCustomers(database)

  if (!recipients.length)
    throw new Error('Некому отправлять: нет активных клиентов с почтой')

  const emailVariants = variants.map(v => ({
    colorName: v.color?.name,
    colorHex: v.color?.hex,
    imageId: [...(v.images ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))[0]?.directus_files_id,
    isNew: newIds.has(v.id),
  }))

  // У тестового адреса без профиля клиента ссылка отписки ведёт на заглушку.
  const unsubscribeFor = recipient => recipient.id
    ? unsubscribeUrl(config, env.SECRET, recipient.id)
    : `${config.publicUrl}/newsletter/unsubscribe?test=1`

  const render = recipient => renderNewProductEmail({
    kind,
    product,
    variants: emailVariants,
    note,
    siteUrl: config.siteUrl,
    assetsUrl: config.publicUrl,
    logoUrl: config.logoUrl,
    firstName: recipient.first_name?.trim() || undefined,
    discountPercent: recipient.discount_percent ?? 0,
    unsubscribeUrl: unsubscribeFor(recipient),
  })

  const subject = `${testEmail ? '[ТЕСТ] ' : ''}${render({}).subject}`
  const now = new Date()

  // Отмечаем сразу, а не после отправки: повторное нажатие не должно продублировать письма.
  if (!testEmail) {
    await database.transaction(async (trx) => {
      if (kind === 'product')
        await trx('products').where('id', product.id).update({ announced_at: now })

      const variantIds = kind === 'variant' ? [...newIds] : unannounced.map(v => v.id)
      if (variantIds.length)
        await trx('product_variants').whereIn('id', variantIds).update({ announced_at: now })
    })
  }

  const [logRow] = await database(LOG_COLLECTION).insert({
    date_created: now,
    created_by: accountability.user,
    product: product.id,
    kind,
    subject,
    is_test: Boolean(testEmail),
    recipients: recipients.length,
    sent: 0,
    failed: 0,
    status: 'sending',
  }).returning('id')
  const logId = typeof logRow === 'object' ? logRow.id : logRow

  running.add(product.id)

  const job = deliver({ recipients, render, unsubscribeFor, subject, config, services, schema, database, logger })
    .then(async ({ sent, failed }) => {
      await database(LOG_COLLECTION).where('id', logId).update({
        sent,
        failed: failed.length,
        errors: failed.join('\n') || null,
        status: failed.length && !sent ? 'error' : 'done',
        finished_at: new Date(),
      })

      await notify(database, accountability.user, {
        subject: `${testEmail ? 'Тест' : 'Рассылка'} «${product.title}»: отправлено ${sent} из ${recipients.length}`,
        message: failed.length ? `Не ушло:\n${failed.join('\n')}` : 'Все письма отправлены.',
        item: logId,
      })
    })
    .catch(async (error) => {
      logger.error(error, `[newsletter] рассылка ${logId} упала`)
      await database(LOG_COLLECTION).where('id', logId).update({ status: 'error', errors: String(error?.message ?? error), finished_at: new Date() })
    })
    .finally(() => running.delete(product.id))

  // В тестах (NEWSLETTER_WAIT=1) дожидаемся конца, в CMS — отвечаем сразу.
  if (process.env.NEWSLETTER_WAIT === '1')
    await job

  return {
    product: product.title,
    kind: kind === 'variant' ? 'новый цвет' : 'новинка',
    subject,
    recipients: recipients.length,
    test: Boolean(testEmail),
    log: logId,
  }
}

async function deliver({ recipients, render, unsubscribeFor, subject, config, services, schema, database, logger }) {
  const mail = new services.MailService({ schema, knex: database })
  const failed = []
  let sent = 0

  for (const [index, recipient] of recipients.entries()) {
    const email = render(recipient)
    const unsubscribe = unsubscribeFor(recipient)

    try {
      await mail.send({
        to: recipient.email,
        from: config.from,
        subject,
        html: email.html,
        text: email.text,
        headers: {
          'List-Unsubscribe': `<${unsubscribe}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      sent++
    }
    catch (error) {
      failed.push(`${recipient.email}: ${error?.response ?? error?.message ?? error}`)
      logger.warn(`[newsletter] не ушло письмо на ${recipient.email}: ${error?.message ?? error}`)
    }

    if (index < recipients.length - 1)
      await sleep(config.gapMs)
  }

  return { sent, failed }
}

/** Клиенты — пользователи с профилем клиента, активные, с почтой и не отписавшиеся. */
async function findCustomers(database) {
  const rows = await database('directus_users as u')
    .join('customer_profiles as p', 'p.user', 'u.id')
    .where('u.status', 'active')
    .whereNotNull('u.email')
    .where(q => q.where('p.newsletter_unsubscribed', false).orWhereNull('p.newsletter_unsubscribed'))
    .select('u.id', 'u.email', 'u.first_name', 'p.discount_percent')
    .orderBy('u.email')

  const seen = new Set()
  return rows.filter((row) => {
    const email = String(row.email).trim().toLowerCase()
    if (!email || seen.has(email))
      return false
    seen.add(email)
    return true
  })
}

/** Тестовое письмо: если адрес принадлежит клиенту — с его именем и скидкой. */
async function findTestRecipient(database, email) {
  const row = await database('directus_users as u')
    .leftJoin('customer_profiles as p', 'p.user', 'u.id')
    .whereRaw('lower(u.email) = ?', [email])
    .first('u.id', 'u.email', 'u.first_name', 'p.discount_percent', 'p.id as profile_id')

  if (!row)
    return { id: null, email, first_name: null, discount_percent: 0 }

  return { ...row, id: row.profile_id ? row.id : null }
}

async function notify(database, user, { subject, message, item }) {
  if (!user)
    return

  // Напрямую в таблицу: NotificationsService ещё и продублировал бы это письмом.
  await database('directus_notifications').insert({
    timestamp: new Date(),
    status: 'inbox',
    recipient: user,
    sender: null,
    subject: subject.slice(0, 255),
    message,
    collection: item ? LOG_COLLECTION : null,
    item: item ? String(item) : null,
  }).catch(() => {})
}

function sortVariants(variants) {
  return [...variants].sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) || Number(a.id) - Number(b.id))
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Almaty' })
}
