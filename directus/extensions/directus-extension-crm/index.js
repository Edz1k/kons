/**
 * CRM: приём заявок.
 *
 *   POST /crm/site-lead   форма сайта — без входа, только с адресов сайта, не чаще 5 заявок за 10 минут с IP,
 *                         скрытое поле-ловушка website для ботов
 *
 * Заявку от знакомого клиента сразу получает его менеджер (уведомление). Клиента узнаём только по точным
 * признакам: телефон (последние 10 цифр), Instagram, email из карточки или точное название компании из формы.
 * Заявки от новых людей видят все менеджеры во «Входящих».
 */
import process from 'node:process'

const SITE_ORIGINS = (process.env.CRM_SITE_ORIGINS ?? 'https://brillex.kz,https://www.brillex.kz')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000

const digits = s => String(s ?? '').replace(/\D/g, '')
const phoneKeys = s => String(s ?? '').split(/[,;]/).map(x => digits(x).slice(-10)).filter(x => x.length === 10)
const igKeys = s => String(s ?? '').toLowerCase().split(/[,;\s]+/).map(x => x.replace(/^@/, '')).filter(x => x.length > 1)
const str = (v, n) => String(v ?? '').trim().slice(0, n)

/** Клиент по точным признакам из строки «откуда» и названия компании. */
export async function matchClient(db, from, company) {
  const f = String(from ?? '')
  const phones = (f.match(/\+?\d[\d\s()-]{8,}\d/g) ?? []).map(x => digits(x).slice(-10)).filter(x => x.length === 10)
  const handles = (f.match(/[\w.+-]+@[\w-]+\.[\w.]+|@[\w.]{2,}/g) ?? []).map(x => x.toLowerCase().replace(/^@/, ''))
  const clients = await db('customer_profiles as p')
    .leftJoin('directus_users as u', 'u.id', 'p.user')
    .select('p.id', 'p.company_name', 'p.phone', 'p.instagram', 'p.email', 'p.manager', 'u.email as account_email')
  const byPhone = phones.length && clients.find(c => phoneKeys(c.phone).some(k => phones.includes(k)))
  if (byPhone)
    return byPhone
  const byHandle = handles.length && clients.find(c =>
    igKeys(c.instagram).some(k => handles.includes(k))
    || [c.email, c.account_email].some(e => e && handles.includes(String(e).toLowerCase())))
  if (byHandle)
    return byHandle
  const co = String(company ?? '').trim().toLowerCase()
  if (co.length >= 3)
    return clients.find(c => String(c.company_name ?? '').trim().toLowerCase() === co) ?? null
  return null
}

export default {
  id: 'crm',
  handler: (router, { database, logger }) => {
    const hits = new Map()
    const allow = (ip) => {
      const now = Date.now()
      const recent = (hits.get(ip) ?? []).filter(t => t > now - WINDOW_MS)
      if (recent.length >= LIMIT)
        return false
      recent.push(now)
      hits.set(ip, recent)
      return true
    }
    // память о частоте не растёт бесконечно
    setInterval(() => {
      const edge = Date.now() - WINDOW_MS
      for (const [ip, list] of hits) {
        if (!list.some(t => t > edge))
          hits.delete(ip)
      }
    }, WINDOW_MS).unref?.()

    const fail = (res, status, message) => res.status(status).json({ errors: [{ message }] })

    router.post('/site-lead', async (req, res) => {
      try {
        const origin = req.headers.origin ?? ''
        if (!SITE_ORIGINS.includes(origin))
          return fail(res, 403, 'Запрос не с сайта')
        if (!allow(req.ip ?? req.socket?.remoteAddress ?? 'unknown'))
          return fail(res, 429, 'Слишком много заявок, попробуйте позже')

        const b = req.body ?? {}
        // ловушка: скрытое поле заполняют только боты — отвечаем «ок» и ничего не сохраняем
        if (b.website)
          return res.status(201).json({ data: { ok: true } })

        const name = str(b.name, 100)
        const phone = str(b.phone, 40)
        const company = str(b.company, 150)
        const text = str(b.text, 3000)
        if (digits(phone).length < 10 && !text)
          return fail(res, 400, 'Укажите телефон или текст заявки')

        const sender = [name, company, phone].filter(Boolean).join(', ') || 'Форма сайта'
        const client = await matchClient(database, sender, company)

        const [lead] = await database('crm_leads').insert({
          source: 'site',
          sender,
          text: text || 'Заявка с сайта',
          company: company || null,
          client: client?.id ?? null,
          manager: client?.manager ?? null,
        }).returning(['id'])

        if (client?.manager) {
          await database('crm_notifications').insert({
            recipient: client.manager,
            lead: lead.id,
            kind: 'lead',
            text: `Заявка от клиента ${client.company_name ?? sender}: ${(text || 'с сайта').slice(0, 90)}`,
          })
        }
        return res.status(201).json({ data: { ok: true } })
      }
      catch (error) {
        logger.error(error, '[crm] site-lead')
        return fail(res, 500, 'Не удалось принять заявку')
      }
    })
  },
}
