/**
 * CRM: правила, которые нельзя доверить браузеру. Права Directus отсекают чужое (менеджер видит свои сделки,
 * цех — только заказы в работе без денег), а здесь — то, что зависит от состояния сделки:
 *
 *  - готовность заказа подтверждает только цех: «Отгрузка» и «Закрыта» без готового производства нельзя
 *    (кроме сделок «без нанесения»); сделка без нанесения в цех не идёт;
 *  - переход в «Производство» ставит заказ в очередь цеха; «Готов» в цеху переводит сделку в «Отгрузку»
 *    и шлёт уведомление менеджеру (с пометкой, если сделали меньше, чем заказано);
 *  - отказ записывает, с какой стадии, когда и кто;
 *  - менеджер не может взять клиента или сделку другого менеджера, не дублирует клиента по телефону/Instagram;
 *  - история сделки пишется сама: стадии, макет, ответственный, оплаты, цех.
 *
 * Производные поля пишем в action через knex — у сотрудника на них нет прав, и это правильно.
 */

const ROLE_MANAGER = '25691c6a-7bae-425a-842d-eb6bc17de5cc' // «CRM: менеджер»
const ROLE_PRODUCTION = '3e640e9e-04d1-47ca-80d6-ae7098a048d3' // «CRM: производство»

const STAGE_NAME = {
  new: 'Новая',
  calc: 'Расчёт и КП',
  mock: 'Макет',
  pay: 'Предоплата',
  prod: 'Производство',
  ready: 'Отгрузка',
  done: 'Закрыта',
  lost: 'Отказ',
}
const MOCKUP_NAME = { none: 'нет макета', wait: 'макет на согласовании', ok: 'макет утверждён' }

let InvalidPayloadError = null

async function errors() {
  if (!InvalidPayloadError) {
    const e = await import('@directus/errors').catch(() => ({}))
    InvalidPayloadError = e.InvalidPayloadError ?? null
  }
}

async function invalid(message) {
  await errors()
  return InvalidPayloadError
    ? new InvalidPayloadError({ reason: message })
    : Object.assign(new Error(message), { status: 400, code: 'INVALID_PAYLOAD' })
}

async function forbidden(message) {
  await errors()
  // у ForbiddenError Directus текст фиксированный — для понятного сообщения отдаём 400 с причиной
  return InvalidPayloadError
    ? new InvalidPayloadError({ reason: message })
    : Object.assign(new Error(message), { status: 403, code: 'FORBIDDEN' })
}

/** Роль сотрудника: head (администратор), mgr, prod; null — системный вызов (расширения, миграции). */
function roleOf(accountability) {
  if (!accountability?.user)
    return null
  if (accountability.admin)
    return 'head'
  const roles = accountability.roles ?? (accountability.role ? [accountability.role] : [])
  if (roles.includes(ROLE_MANAGER))
    return 'mgr'
  if (roles.includes(ROLE_PRODUCTION))
    return 'prod'
  return 'other'
}

const digits = s => String(s ?? '').replace(/\D/g, '')
const phoneKeys = s => String(s ?? '').split(/[,;]/).map(x => digits(x).slice(-10)).filter(x => x.length === 10)
const igKeys = s => String(s ?? '').toLowerCase().split(/[,;\s]+/).map(x => x.replace(/^@/, '')).filter(x => x.length > 1)
const money = n => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₸`

export default ({ filter, action }, { database: rootDb, logger }) => {
  /** Старое состояние сделок между filter и action одного сохранения. */
  const before = new Map()

  const userName = async (db, id) => {
    if (!id)
      return 'Система'
    const u = await db('directus_users').where({ id }).first('first_name', 'last_name')
    return [u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'Сотрудник'
  }

  async function log(db, deal, text, user) {
    await db('crm_deal_log').insert({ deal, text, user_created: user ?? null })
  }

  async function notify(db, { recipient, deal = null, lead = null, kind = 'system', text, warn = false }) {
    if (recipient)
      await db('crm_notifications').insert({ recipient, deal, lead, kind, text, warn })
  }

  /** Менеджер работает только со своими (или ничьими) клиентами. */
  async function assertClientFree(db, clientId, user) {
    if (!clientId)
      return
    const c = await db('customer_profiles').where({ id: clientId }).first('manager', 'company_name')
    if (c?.manager && c.manager !== user)
      throw await forbidden(`Клиент «${c.company_name ?? clientId}» закреплён за другим менеджером. Передать клиента может руководитель`)
  }

  async function assertOwnDeal(db, dealId, user, role) {
    if (role === 'head' || role === null)
      return
    const d = await db('crm_deals').where({ id: dealId }).first('manager', 'stage')
    if (!d)
      throw await invalid('Сделка не найдена')
    if (role === 'mgr' && d.manager !== user)
      throw await forbidden('Это сделка другого менеджера')
    if (role === 'prod' && !['pay', 'prod'].includes(d.stage))
      throw await forbidden('Заказ не в работе цеха')
  }

  // ── клиенты: менеджер не дублирует чужого клиента ──────────────────────
  async function checkClientClash(payload, keys, accountability, db) {
    if (roleOf(accountability) !== 'mgr')
      return
    const phones = phoneKeys(payload.phone)
    const igs = igKeys(payload.instagram)
    if (!phones.length && !igs.length)
      return
    const others = await db('customer_profiles')
      .whereNotNull('manager')
      .whereNot('manager', accountability.user)
      .modify(q => keys?.length && q.whereNotIn('id', keys))
      .select('id', 'phone', 'instagram')
    const clash = others.find(o => phoneKeys(o.phone).some(k => phones.includes(k)) || igKeys(o.instagram).some(k => igs.includes(k)))
    if (clash)
      throw await forbidden('Этот телефон или аккаунт уже у клиента другого менеджера. Передать клиента может руководитель')
  }

  filter('customer_profiles.items.create', async (payload, _meta, { accountability, database }) => {
    await checkClientClash(payload, [], accountability, database ?? rootDb)
    return payload
  })
  filter('customer_profiles.items.update', async (payload, meta, { accountability, database }) => {
    await checkClientClash(payload, meta.keys, accountability, database ?? rootDb)
    return payload
  })

  // ── сделки ─────────────────────────────────────────────────────────────
  filter('crm_deals.items.create', async (payload, _meta, { accountability, database }) => {
    const db = database ?? rootDb
    const role = roleOf(accountability)
    if (role === 'mgr')
      await assertClientFree(db, payload.client, accountability.user)
    if (payload.no_print && payload.stage === 'prod')
      throw await invalid('Заказ без нанесения не идёт в производство')
    if (['ready', 'done'].includes(payload.stage) && !payload.no_print && role !== null)
      throw await invalid('Готовность заказа подтверждает производство')
    return payload
  })

  action('crm_deals.items.create', async ({ key, payload }, { database, accountability }) => {
    const db = database ?? rootDb
    const user = accountability?.user ?? null
    const deal = await db('crm_deals').where({ id: key }).first()
    const patch = {}
    if (deal.stage === 'prod' && !deal.pr_state)
      patch.pr_state = 'queue'
    if (deal.stage === 'lost')
      Object.assign(patch, { lost_from: 'new', lost_at: new Date(), lost_by: user })
    if (Object.keys(patch).length)
      await db('crm_deals').where({ id: key }).update(patch)
    await log(db, key, `Сделка создана${payload.stage && payload.stage !== 'new' ? ` на стадии «${STAGE_NAME[payload.stage]}»` : ''}`, user)
    // ничейный клиент закрепляется за менеджером сделки
    if (deal.client && deal.manager)
      await db('customer_profiles').where({ id: deal.client }).whereNull('manager').update({ manager: deal.manager })
  })

  filter('crm_deals.items.update', async (payload, meta, { accountability, database }) => {
    const db = database ?? rootDb
    const role = roleOf(accountability)
    const olds = await db('crm_deals').whereIn('id', meta.keys ?? [])
    for (const old of olds) {
      before.set(old.id, old)
      if (role === null)
        continue
      const stage = payload.stage ?? old.stage
      const noPrint = payload.no_print ?? old.no_print

      if (role === 'mgr' && payload.client !== undefined && payload.client !== old.client)
        await assertClientFree(db, payload.client, accountability.user)
      if (payload.no_print && !old.no_print && (old.pr_state || old.stage === 'prod'))
        throw await invalid('Заказ уже был в цеху: «Без нанесения» поставить нельзя')
      if (noPrint && stage === 'prod')
        throw await invalid('Заказ без нанесения не идёт в производство')
      if (payload.stage && payload.stage !== old.stage && ['ready', 'done'].includes(payload.stage)
        && !noPrint && old.pr_state !== 'done' && role !== 'prod') {
        throw await invalid('Готовность заказа подтверждает производство')
      }
      if (role === 'prod' && payload.pr_state === 'done' && old.pr_state !== 'work' && old.pr_state !== 'done')
        throw await invalid('Сначала возьмите заказ в работу')
    }
    return payload
  })

  action('crm_deals.items.update', async ({ keys, payload }, { database, accountability }) => {
    const db = database ?? rootDb
    const user = accountability?.user ?? null
    for (const id of keys) {
      const old = before.get(Number(id)) ?? before.get(id)
      before.delete(Number(id))
      const deal = await db('crm_deals').where({ id }).first()
      if (!deal || !old)
        continue
      const patch = {}
      const notes = []

      if (payload.stage && payload.stage !== old.stage) {
        notes.push(`Стадия: ${STAGE_NAME[old.stage]} → ${STAGE_NAME[deal.stage]}`)
        if (deal.stage === 'prod' && (!deal.pr_state || deal.pr_state === 'done'))
          patch.pr_state = 'queue'
        if (deal.stage === 'lost')
          Object.assign(patch, { lost_from: old.stage, lost_at: new Date(), lost_by: user })
      }
      if (payload.mockup && payload.mockup !== old.mockup)
        notes.push(`Макет: ${MOCKUP_NAME[deal.mockup]}`)
      if (payload.manager !== undefined && payload.manager !== old.manager)
        notes.push(`Ответственный: ${await userName(db, deal.manager)}`)
      if (payload.deadline !== undefined && String(payload.deadline ?? '') !== String(old.deadline ?? ''))
        notes.push(deal.deadline ? `Срок: ${new Date(deal.deadline).toLocaleDateString('ru-RU')}` : 'Срок снят')

      // цех
      if (payload.pr_state && payload.pr_state !== old.pr_state) {
        if (deal.pr_state === 'work') {
          Object.assign(patch, { pr_started_at: new Date(), pr_by: user })
          notes.push(`${await userName(db, user)} взял(а) заказ в работу`)
        }
        if (deal.pr_state === 'done') {
          Object.assign(patch, { pr_finished_at: new Date(), pr_by: user, stage: 'ready' })
          const items = await db('crm_deal_items').where({ deal: id }).orderBy(['sort', 'id']).select('quantity')
          const ordered = items.reduce((a, i) => a + Number(i.quantity || 0), 0)
          const made = Array.isArray(deal.pr_quantities) || typeof deal.pr_quantities === 'string'
            ? (typeof deal.pr_quantities === 'string' ? JSON.parse(deal.pr_quantities) : deal.pr_quantities).reduce((a, q) => a + Number(q || 0), 0)
            : ordered
          const client = deal.client ? await db('customer_profiles').where({ id: deal.client }).first('company_name') : null
          const text = `№${deal.number} ${client?.company_name ?? ''} готов: ${made} из ${ordered} шт${deal.pr_note ? `. ${deal.pr_note}` : ''}`.replace(/\s+/g, ' ')
          notes.push(`Готово в цеху: ${made} из ${ordered} шт`)
          await notify(db, { recipient: deal.manager, deal: deal.id, kind: 'ready', text, warn: made < ordered })
        }
      }

      if (Object.keys(patch).length)
        await db('crm_deals').where({ id }).update(patch)
      for (const text of notes)
        await log(db, id, text, user)

      if (deal.client && deal.manager)
        await db('customer_profiles').where({ id: deal.client }).whereNull('manager').update({ manager: deal.manager })
    }
  })

  // ── позиции, оплаты, история: только по своей сделке ───────────────────
  for (const collection of ['crm_deal_items', 'crm_payments', 'crm_deal_log']) {
    filter(`${collection}.items.create`, async (payload, _meta, { accountability, database }) => {
      const role = roleOf(accountability)
      if (role === 'prod' && collection !== 'crm_deal_log')
        throw await forbidden('Нет доступа')
      await assertOwnDeal(database ?? rootDb, payload.deal, accountability?.user, role)
      return payload
    })
  }

  action('crm_payments.items.create', async ({ key }, { database, accountability }) => {
    const db = database ?? rootDb
    const p = await db('crm_payments').where({ id: key }).first()
    if (p)
      await log(db, p.deal, `Оплата ${money(p.amount)}${p.note ? ` (${p.note})` : ''}`, accountability?.user)
  })

  filter('crm_payments.items.delete', async (keys, _meta, { accountability, database }) => {
    const db = database ?? rootDb
    const rows = await db('crm_payments').whereIn('id', keys)
    for (const p of rows)
      await log(db, p.deal, `Удалён платёж ${money(p.amount)}${p.note ? ` (${p.note})` : ''}`, accountability?.user)
    return keys
  })

  // ── заявки: менеджер берёт себе, руководитель назначает ────────────────
  filter('crm_leads.items.update', async (payload, meta, { accountability, database }) => {
    const role = roleOf(accountability)
    if (role === 'mgr' && payload.manager !== undefined && payload.manager !== accountability.user)
      throw await forbidden('Заявку можно взять только себе. Назначает руководитель')
    if (payload.manager !== undefined) {
      const db = database ?? rootDb
      for (const l of await db('crm_leads').whereIn('id', meta.keys ?? []))
        before.set(`lead:${l.id}`, l)
    }
    return payload
  })

  action('crm_leads.items.update', async ({ keys, payload }, { database, accountability }) => {
    if (payload.manager === undefined)
      return
    const db = database ?? rootDb
    for (const id of keys) {
      const old = before.get(`lead:${id}`)
      before.delete(`lead:${id}`)
      if (!payload.manager || payload.manager === old?.manager || payload.manager === accountability?.user)
        continue
      const l = await db('crm_leads').where({ id }).first()
      await notify(db, { recipient: payload.manager, lead: Number(id), kind: 'lead', text: `Вам назначена заявка: ${l.sender ?? ''} — ${String(l.text ?? '').slice(0, 90)}` })
    }
  })

  logger.info('[crm-rules] правила CRM подключены')
}
