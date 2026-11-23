/**
 * Склад brillex на товарах сайта: позиция склада = вариант товара (product_variants), остаток = его stock.
 * Всё, что меняет остаток, проходит здесь — одной транзакцией в базе Directus.
 *
 *   POST  /warehouse/movements               приход / списание / возврат по штрихкоду
 *   POST  /warehouse/movements/:id/cancel    отмена ошибочной операции (админ склада)
 *   POST  /warehouse/requests/:id/complete   выдача по заявке (все строки или ничего)
 *   POST  /warehouse/requests/:id/cancel     отменить невыданную заявку (админ склада)
 *   POST  /warehouse/products                новый товар-черновик с вариантом и штрихкодом (админ склада)
 *   GET   /warehouse/overview                сводка и стоимость склада (админ склада)
 *   GET   /warehouse/staff                   сотрудники склада (админ склада)
 *   POST  /warehouse/staff, PATCH /warehouse/staff/:id
 *
 * Правила:
 *  - строка варианта блокируется (SELECT … FOR UPDATE): одновременные списания встают в очередь, минуса нет;
 *  - неизвестный остаток (stock = NULL) списать нельзя, сначала приход с реальным количеством;
 *  - журнал не правится: ошибка исправляется отменой (обратная запись), отменить можно один раз;
 *  - кто провёл операцию — из токена, не из тела запроса.
 * Правка stock в админке Directus тоже попадает в журнал (корректировка) — см. directus-extension-warehouse-guard.
 */

const ROLE_ADMIN = 'a7cd57c2-b283-4ab5-86e0-90a1163df438' // «Склад: админ»
const ROLE_STAFF = '3c73f9db-5f95-4680-9b81-f3cdd25faf97' // «Склад: кладовщик»
const WAREHOUSE_ROLES = [ROLE_ADMIN, ROLE_STAFF]

const MOVEMENT_TYPES = ['receipt', 'issue', 'return']
const PLUS = ['receipt', 'return', 'cancel_in', 'adjust_in']
const MINUS = ['issue', 'cancel_out', 'adjust_out']
const MAX_QTY = 1_000_000
const STAFF_EMAIL_DOMAIN = 'sklad.brillex.kz'

class WarehouseError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const fail = (status, code, message, details) => new WarehouseError(status, code, message, details)

function roleOf(accountability) {
  if (!accountability?.user)
    return null
  if (accountability.admin)
    return 'admin'
  const roles = accountability.roles ?? (accountability.role ? [accountability.role] : [])
  if (roles.includes(ROLE_ADMIN))
    return 'admin'
  if (roles.includes(ROLE_STAFF))
    return 'staff'
  return null
}

function requireStaff(req) {
  const role = roleOf(req.accountability)
  if (!req.accountability?.user)
    throw fail(401, 'UNAUTHORIZED', 'Нужно войти')
  if (!role)
    throw fail(403, 'FORBIDDEN', 'Нет доступа к складу')
  return { role, user: req.accountability.user }
}

function requireAdmin(req) {
  const who = requireStaff(req)
  if (who.role !== 'admin')
    throw fail(403, 'FORBIDDEN', 'Доступно только администратору склада')
  return who
}

function text(value, max, label, required = false) {
  const s = String(value ?? '').trim()
  if (required && !s)
    throw fail(400, 'BAD_INPUT', `Укажите ${label}`)
  if (s.length > max)
    throw fail(400, 'BAD_INPUT', `${label}: до ${max} символов`)
  return s || null
}

function qty(value, label = 'Количество') {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0 || n > MAX_QTY)
    throw fail(400, 'BAD_QTY', `${label} — целое число больше нуля`)
  return n
}

function optionalInt(value, label) {
  if (value === null || value === undefined || value === '')
    return null
  const n = Number(String(value).replace(/\s/g, ''))
  if (!Number.isInteger(n) || n < 0 || n > 1e9)
    throw fail(400, 'BAD_QTY', `${label}: целое число от 0`)
  return n
}

function id(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0 || n > 2_147_483_647)
    throw fail(404, 'NOT_FOUND', 'Не найдено')
  return n
}

const normalizeBarcode = value => String(value ?? '').trim().toUpperCase()

/** Следующий штрихкод BRX-000145… Под advisory-блокировкой: два новых товара не получат один номер. */
async function nextBarcode(trx) {
  await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', ['brillex_barcode'])
  const { next } = await trx('product_variants')
    .select(trx.raw(`coalesce(max(substring(barcode FROM '^BRX-(\\d+)$')::int), 0) + 1 AS next`))
    .first()
  return `BRX-${String(next).padStart(6, '0')}`
}

export default {
  id: 'warehouse',
  handler: (router, { database, services, getSchema, logger }) => {
    const { UsersService } = services

    /** Обёртка: ошибки склада — понятным текстом, остальное — 500 и в лог. */
    const route = fn => async (req, res) => {
      try {
        res.json({ data: await fn(req) })
      }
      catch (error) {
        if (error instanceof WarehouseError) {
          return res.status(error.status).json({
            errors: [{ message: error.message, extensions: { code: error.code, ...(error.details ? { details: error.details } : {}) } }],
          })
        }
        logger.error(error, '[warehouse]')
        res.status(500).json({ errors: [{ message: 'Внутренняя ошибка склада', extensions: { code: 'INTERNAL' } }] })
      }
    }

    // ── остаток ────────────────────────────────────────────────────────────

    const lockByBarcode = (trx, barcode) => trx('product_variants').where({ barcode }).forUpdate().first()
    const lockInOrder = (trx, ids) => trx('product_variants').whereIn('id', ids).orderBy('id').forUpdate()

    async function writeMovement(trx, variant, { type, quantity, note, dealRef = null, request = null, reverses = null, user }) {
      const after = (variant.stock ?? 0) + (PLUS.includes(type) ? quantity : -quantity)
      await trx('product_variants').where({ id: variant.id }).update({ stock: after })
      const [row] = await trx('wh_movements').insert({
        variant: variant.id,
        type,
        quantity,
        balance_after: after,
        note,
        deal_ref: dealRef,
        request,
        reverses,
        user_created: user,
      }).returning(['id', 'date_created'])
      return { movement: row.id, date_created: row.date_created, barcode: variant.barcode, stock: after }
    }

    // ── операции ───────────────────────────────────────────────────────────

    router.post('/movements', route(async (req) => {
      const { user } = requireStaff(req)
      const type = String(req.body?.type ?? '')
      if (!MOVEMENT_TYPES.includes(type))
        throw fail(400, 'BAD_TYPE', 'Неизвестный тип операции')
      const quantity = qty(req.body?.quantity)
      const barcode = normalizeBarcode(req.body?.barcode)
      const note = text(req.body?.note, 500, 'Комментарий')

      return database.transaction(async (trx) => {
        const variant = barcode && await lockByBarcode(trx, barcode)
        if (!variant)
          throw fail(404, 'NOT_FOUND', 'Товар со штрихкодом не найден')
        if (type === 'issue') {
          if (variant.stock === null)
            throw fail(409, 'UNKNOWN_STOCK', 'Остаток этого товара неизвестен. Сначала внесите пересчитанное количество через «Приход».')
          if (variant.stock < quantity)
            throw fail(409, 'INSUFFICIENT_STOCK', `На складе только ${variant.stock} шт.`, { available: variant.stock })
        }
        return writeMovement(trx, variant, { type, quantity, note, user })
      })
    }))

    router.post('/movements/:id/cancel', route(async (req) => {
      const { user } = requireAdmin(req)
      const movementId = id(req.params.id)
      const reason = text(req.body?.reason, 300, 'причину отмены', true)

      return database.transaction(async (trx) => {
        const m = await trx('wh_movements').where({ id: movementId }).first()
        if (!m)
          throw fail(404, 'NOT_FOUND', 'Операция не найдена')
        if (m.type === 'cancel_in' || m.type === 'cancel_out')
          throw fail(409, 'BAD_TYPE', 'Отмену отменить нельзя. Проведите обычную операцию.')
        if (await trx('wh_movements').where({ reverses: movementId }).first())
          throw fail(409, 'ALREADY_DONE', 'Эта операция уже отменена')

        const [variant] = await lockInOrder(trx, [m.variant])
        // минус (списание, корректировка −) отменяется плюсом, и наоборот
        const type = MINUS.includes(m.type) ? 'cancel_in' : 'cancel_out'
        if (type === 'cancel_out' && (variant.stock ?? 0) < m.quantity)
          throw fail(409, 'INSUFFICIENT_STOCK', `Нельзя отменить приход: на складе осталось ${variant.stock ?? 0} шт, часть уже выдана`)

        const result = await writeMovement(trx, variant, {
          type,
          quantity: m.quantity,
          note: `Отмена операции №${movementId}: ${reason}`,
          dealRef: m.deal_ref,
          reverses: movementId,
          user,
        })
        return { ...result, deal_ref: m.deal_ref, cancelled_quantity: m.quantity }
      })
    }))

    // ── заявки ─────────────────────────────────────────────────────────────

    router.post('/requests/:id/complete', route(async (req) => {
      const { user } = requireStaff(req)
      const requestId = id(req.params.id)
      const scanned = new Set((Array.isArray(req.body?.scanned) ? req.body.scanned : []).map(normalizeBarcode))

      return database.transaction(async (trx) => {
        const request = await trx('wh_requests').where({ id: requestId }).forUpdate().first()
        if (!request)
          throw fail(404, 'NOT_FOUND', 'Заявка не найдена')
        if (request.status !== 'new')
          throw fail(409, 'ALREADY_DONE', request.status === 'done' ? 'Заявка уже выдана' : 'Заявка отменена')

        const lines = await trx('wh_request_lines').where({ request: requestId }).orderBy('id')
        if (!lines.length)
          throw fail(409, 'EMPTY', 'В заявке нет строк')

        const variants = await lockInOrder(trx, lines.map(l => l.variant))
        const byId = new Map(variants.map(v => [v.id, v]))

        const missing = lines.map(l => byId.get(l.variant).barcode).filter(b => !scanned.has(b))
        if (missing.length)
          throw fail(409, 'NOT_SCANNED', `Не отсканировано: ${missing.join(', ')}`, { missing })

        for (const line of lines) {
          const v = byId.get(line.variant)
          if (v.stock === null || v.stock < line.quantity) {
            throw fail(409, 'INSUFFICIENT_STOCK', `${v.barcode}: нужно ${line.quantity} шт, на складе ${v.stock ?? 0}. Сообщите менеджеру.`, { barcode: v.barcode, needed: line.quantity, available: v.stock })
          }
        }

        const balances = []
        for (const line of lines) {
          const v = byId.get(line.variant)
          const r = await writeMovement(trx, v, {
            type: 'issue',
            quantity: line.quantity,
            note: 'Выдача по заявке',
            dealRef: request.deal_ref,
            request: requestId,
            user,
          })
          v.stock = r.stock
          balances.push({ barcode: v.barcode, stock: r.stock })
        }

        await trx('wh_requests').where({ id: requestId }).update({ status: 'done', completed_at: new Date(), completed_by: user })
        return { request: requestId, deal_ref: request.deal_ref, balances }
      })
    }))

    router.post('/requests/:id/cancel', route(async (req) => {
      requireAdmin(req)
      const requestId = id(req.params.id)
      const updated = await database('wh_requests').where({ id: requestId, status: 'new' }).update({ status: 'cancelled' })
      if (!updated) {
        const r = await database('wh_requests').where({ id: requestId }).first()
        if (!r)
          throw fail(404, 'NOT_FOUND', 'Заявка не найдена')
        throw fail(409, 'ALREADY_DONE', r.status === 'done' ? 'Заявка уже выдана' : 'Заявка уже отменена')
      }
      return { request: requestId, status: 'cancelled' }
    }))

    // ── новый товар ────────────────────────────────────────────────────────

    /**
     * Склад заводит товар черновиком: на сайте он не виден, пока менеджер в Directus не добавит
     * фото и описание и не переведёт статус «На сайте». Остаток стартует с нуля — товар заходит приходом.
     */
    router.post('/products', route(async (req) => {
      requireAdmin(req)
      const title = text(req.body?.title, 120, 'название', true)
      const sku = text(req.body?.sku, 60, 'Артикул')
      const price = optionalInt(req.body?.price, 'Цена')
      const minQuantity = optionalInt(req.body?.min_quantity, 'Порог')
      const color = req.body?.color ? id(req.body.color) : null

      return database.transaction(async (trx) => {
        if (color && !(await trx('colors').where({ id: color }).first()))
          throw fail(404, 'NOT_FOUND', 'Цвет не найден')
        const barcode = await nextBarcode(trx)
        const [product] = await trx('products').insert({
          title,
          slug: `draft-${barcode.toLowerCase()}`,
          status: 'draft',
          price,
        }).returning(['id'])
        const [variant] = await trx('product_variants').insert({
          product: product.id,
          color,
          sku,
          stock: 0,
          barcode,
          min_quantity: minQuantity,
          is_default: true,
        }).returning(['id'])
        return { product: product.id, variant: variant.id, barcode }
      })
    }))

    router.get('/overview', route(async (req) => {
      requireAdmin(req)
      const row = await database('product_variants as v').leftJoin('products as p', 'p.id', 'v.product').select(
        database.raw('count(*)::int AS variant_count'),
        database.raw('coalesce(sum(v.stock), 0)::int AS total_quantity'),
        database.raw('coalesce(sum(v.stock::numeric * coalesce(p.price, 0)), 0)::numeric(14,2) AS total_value'),
        database.raw('count(*) FILTER (WHERE v.stock = 0)::int AS out_count'),
        database.raw('count(*) FILTER (WHERE v.stock > 0 AND v.stock <= v.min_quantity)::int AS low_count'),
        database.raw('count(*) FILTER (WHERE v.stock IS NULL)::int AS unknown_count'),
        database.raw(`count(DISTINCT p.id) FILTER (WHERE p.status = 'draft')::int AS draft_count`),
      ).first()
      const { open } = await database('wh_requests').where({ status: 'new' }).count({ open: '*' }).first()
      return { ...row, total_value: Number(row.total_value), open_requests: Number(open) }
    }))

    // ── сотрудники склада ──────────────────────────────────────────────────

    async function usersService() {
      return new UsersService({ schema: await getSchema(), accountability: null, knex: database })
    }

    const staffEmail = login => (String(login).includes('@') ? String(login).trim().toLowerCase() : `${String(login).trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`)

    function password(value, role) {
      const min = role === ROLE_ADMIN ? 8 : 6
      if (typeof value !== 'string' || value.length < min || value.length > 200)
        throw fail(400, 'BAD_PASSWORD', `Пароль: от ${min} до 200 символов`)
      return value
    }

    router.get('/staff', route(async (req) => {
      requireAdmin(req)
      return database('directus_users').whereIn('role', WAREHOUSE_ROLES).select('id', 'first_name', 'last_name', 'email', 'role', 'status', 'last_access').orderBy(['status', 'first_name'])
    }))

    router.post('/staff', route(async (req) => {
      requireAdmin(req)
      const role = req.body?.role === 'admin' ? ROLE_ADMIN : ROLE_STAFF
      const firstName = text(req.body?.first_name, 60, 'имя', true)
      const lastName = text(req.body?.last_name, 60, 'Фамилия')
      const login = text(req.body?.login, 80, 'логин', true)
      if (!/^[\w.-]+(?:@[a-z0-9.-]+\.[a-z]{2,})?$/i.test(login))
        throw fail(400, 'BAD_INPUT', 'Логин: латиница, цифры, точка, дефис')
      const email = staffEmail(login)
      if (await database('directus_users').whereRaw('lower(email) = ?', [email]).first())
        throw fail(409, 'EXISTS', 'Такой логин уже есть')
      const service = await usersService()
      const userId = await service.createOne({
        first_name: firstName,
        last_name: lastName,
        email,
        password: password(req.body?.password, role),
        role,
        status: 'active',
      })
      return { id: userId, email }
    }))

    router.patch('/staff/:id', route(async (req) => {
      const { user } = requireAdmin(req)
      const targetId = String(req.params.id)
      const target = await database('directus_users').where({ id: targetId }).whereIn('role', WAREHOUSE_ROLES).first()
      if (!target)
        throw fail(404, 'NOT_FOUND', 'Сотрудник склада не найден')
      const isSelf = targetId === user
      const changes = {}
      if (req.body?.first_name !== undefined)
        changes.first_name = text(req.body.first_name, 60, 'имя', true)
      if (req.body?.last_name !== undefined)
        changes.last_name = text(req.body.last_name, 60, 'Фамилия')
      if (req.body?.role !== undefined || req.body?.status !== undefined) {
        if (isSelf)
          throw fail(403, 'FORBIDDEN', 'Свою роль и доступ менять нельзя')
        if (req.body.role !== undefined)
          changes.role = req.body.role === 'admin' ? ROLE_ADMIN : ROLE_STAFF
        if (req.body.status !== undefined)
          changes.status = req.body.status === 'active' ? 'active' : 'suspended'
      }
      if (req.body?.password !== undefined)
        changes.password = password(req.body.password, changes.role ?? target.role)
      if (!Object.keys(changes).length)
        throw fail(400, 'BAD_INPUT', 'Нечего менять')

      const service = await usersService()
      await service.updateOne(targetId, changes)
      // новый пароль, отключение или смена роли — выкидываем со всех устройств
      if (changes.password || changes.status === 'suspended' || changes.role)
        await database('directus_sessions').where({ user: targetId }).delete()
      return { id: targetId }
    }))
  },
}
