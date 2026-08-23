/**
 * Резерв товаров.
 *
 *  - при создании резерва проставляет клиента, статус и срок (максимум RESERVATION_DAYS дней);
 *  - не даёт зарезервировать больше, чем реально свободно на складе;
 *  - держит на product_variants актуальные reserved_qty / reserved_until;
 *  - раз в 10 минут гасит просроченные резервы и возвращает товар в продажу.
 */

import process from 'node:process'

const RESERVATION_DAYS = Number(process.env.RESERVATION_DAYS ?? 3)
const RESERVATION_MS = RESERVATION_DAYS * 24 * 60 * 60 * 1000
const ACTIVE = 'active'
const CLOSED_STATUSES = ['confirmed', 'cancelled', 'expired']

let invalidPayloadErrorPromise = null

/**
 * Пробуем отдать клиенту нормальную 400-ошибку с текстом.
 * Если пакет ошибок Directus недоступен — падаем на обычный Error.
 */
async function invalidPayload(message) {
  invalidPayloadErrorPromise ??= import('@directus/errors')
    .then(errors => errors.InvalidPayloadError ?? null)
    .catch(() => null)

  const InvalidPayloadError = await invalidPayloadErrorPromise

  if (InvalidPayloadError)
    return new InvalidPayloadError({ reason: message })

  const error = new Error(message)
  error.status = 400
  error.code = 'INVALID_PAYLOAD'

  return error
}

export default ({ filter, action, schedule }, { services, database, getSchema, logger }) => {
  const { ItemsService } = services

  async function serviceFor(collection) {
    return new ItemsService(collection, {
      schema: await getSchema(),
      accountability: null,
      knex: database,
    })
  }

  function activeFilter(extra = []) {
    return {
      _and: [
        { status: { _eq: ACTIVE } },
        { expires_at: { _gt: '$NOW' } },
        ...extra,
      ],
    }
  }

  /** Свободный остаток варианта: склад минус чужие активные резервы. */
  async function availableStock(variantId, excludeReservationId = null) {
    const variants = await serviceFor('product_variants')
    const reservations = await serviceFor('reservations')

    const variant = await variants.readOne(variantId, { fields: ['id', 'stock'] })
    const stock = Number(variant?.stock ?? 0)

    const extra = [{ variant: { _eq: variantId } }]

    if (excludeReservationId !== null)
      extra.push({ id: { _neq: excludeReservationId } })

    const rows = await reservations.readByQuery({
      filter: activeFilter(extra),
      fields: ['quantity'],
      limit: -1,
    })

    const reserved = rows.reduce((total, row) => total + Number(row.quantity ?? 0), 0)

    return Math.max(0, stock - reserved)
  }

  /** Пересчитывает счётчики резерва у перечисленных вариантов. */
  async function recalcVariants(variantIds) {
    const ids = [...new Set(variantIds.filter(id => id !== null && id !== undefined))]

    if (!ids.length)
      return

    const variants = await serviceFor('product_variants')
    const reservations = await serviceFor('reservations')

    const rows = await reservations.readByQuery({
      filter: activeFilter([{ variant: { _in: ids } }]),
      fields: ['variant', 'quantity', 'expires_at'],
      limit: -1,
    })

    const totals = new Map(ids.map(id => [String(id), { qty: 0, until: null }]))

    for (const row of rows) {
      const key = String(row.variant)
      const entry = totals.get(key) ?? { qty: 0, until: null }

      entry.qty += Number(row.quantity ?? 0)

      const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null

      if (expiresAt && (entry.until === null || expiresAt < entry.until))
        entry.until = expiresAt

      totals.set(key, entry)
    }

    for (const [variantId, entry] of totals) {
      await variants.updateOne(
        variantId,
        {
          reserved_qty: entry.qty,
          reserved_until: entry.until ? new Date(entry.until).toISOString() : null,
        },
        { emitEvents: false },
      )
    }
  }

  async function variantsOfReservations(keys) {
    if (!keys?.length)
      return []

    const reservations = await serviceFor('reservations')

    const rows = await reservations.readMany(keys, {
      fields: ['variant'],
      limit: -1,
    })

    return rows.map(row => row.variant).filter(Boolean)
  }

  // ── создание резерва ────────────────────────────────────────────────────
  filter('reservations.items.create', async (payload, _meta, context) => {
    const result = { ...payload }
    const currentUser = context.accountability?.user ?? null

    if (!result.user && currentUser)
      result.user = currentUser

    if (!result.user)
      throw await invalidPayload('Резерв можно создать только от имени клиента')

    result.status = CLOSED_STATUSES.includes(result.status) ? result.status : ACTIVE
    result.quantity = Math.max(1, Number(result.quantity ?? 1))

    // Срок резерва задаём здесь, чтобы клиент не мог продлить его сам.
    result.expires_at = new Date(Date.now() + RESERVATION_MS).toISOString()

    if (result.variant) {
      const available = await availableStock(result.variant)

      if (available <= 0)
        throw await invalidPayload('Товар уже разобрали — свободных остатков нет')

      if (result.quantity > available)
        throw await invalidPayload(`Свободно только ${available} шт. — уменьшите количество`)
    }

    return result
  })

  // ── изменение резерва ───────────────────────────────────────────────────
  filter('reservations.items.update', async (payload, meta, context) => {
    const result = { ...payload }

    if (!result.status)
      return result

    const isClosing = CLOSED_STATUSES.includes(result.status)

    if (isClosing) {
      result.resolved_at = new Date().toISOString()

      if (context.accountability?.user)
        result.resolved_by = context.accountability.user
    }

    // Возврат резерва в работу продлевает срок от текущего момента.
    if (result.status === ACTIVE)
      result.expires_at = new Date(Date.now() + RESERVATION_MS).toISOString()

    if (result.quantity !== undefined && meta.keys?.length === 1) {
      const reservations = await serviceFor('reservations')
      const current = await reservations.readOne(meta.keys[0], { fields: ['variant'] })

      if (current?.variant) {
        const available = await availableStock(current.variant, meta.keys[0])

        if (Number(result.quantity) > available)
          throw await invalidPayload(`Свободно только ${available} шт.`)
      }
    }

    return result
  })

  // ── пересчёт счётчиков ──────────────────────────────────────────────────
  action('reservations.items.create', async ({ key }) => {
    try {
      await recalcVariants(await variantsOfReservations([key]))
    }
    catch (error) {
      logger.error(error, 'reservations: не удалось пересчитать остаток после создания')
    }
  })

  action('reservations.items.update', async ({ keys }) => {
    try {
      await recalcVariants(await variantsOfReservations(keys))
    }
    catch (error) {
      logger.error(error, 'reservations: не удалось пересчитать остаток после изменения')
    }
  })

  // Варианты снимаем до удаления — после записи уже не прочитать.
  const pendingDeletes = new Map()

  filter('reservations.items.delete', async (keys) => {
    try {
      pendingDeletes.set(String(keys), await variantsOfReservations(keys))
    }
    catch (error) {
      logger.error(error, 'reservations: не удалось запомнить варианты перед удалением')
    }

    return keys
  })

  action('reservations.items.delete', async ({ keys }) => {
    const cacheKey = String(keys)
    const variantIds = pendingDeletes.get(cacheKey) ?? []
    pendingDeletes.delete(cacheKey)

    try {
      await recalcVariants(variantIds)
    }
    catch (error) {
      logger.error(error, 'reservations: не удалось пересчитать остаток после удаления')
    }
  })

  // Изменили склад руками — счётчики резерва тоже пересчитываем.
  action('product_variants.items.update', async ({ keys, payload }) => {
    if (payload?.reserved_qty !== undefined || payload?.reserved_until !== undefined)
      return

    try {
      await recalcVariants(keys)
    }
    catch (error) {
      logger.error(error, 'reservations: не удалось пересчитать остаток после правки склада')
    }
  })

  // ── просроченные резервы ────────────────────────────────────────────────
  async function expireOverdue() {
    const reservations = await serviceFor('reservations')

    const overdue = await reservations.readByQuery({
      filter: {
        _and: [
          { status: { _eq: ACTIVE } },
          { expires_at: { _lte: '$NOW' } },
        ],
      },
      fields: ['id', 'variant'],
      limit: -1,
    })

    if (!overdue.length)
      return

    await reservations.updateMany(
      overdue.map(row => row.id),
      { status: 'expired', resolved_at: new Date().toISOString() },
      { emitEvents: false },
    )

    await recalcVariants(overdue.map(row => row.variant))

    logger.info(`reservations: истекло резервов — ${overdue.length}`)
  }

  schedule('*/10 * * * *', async () => {
    try {
      await expireOverdue()
    }
    catch (error) {
      logger.error(error, 'reservations: сбой планового снятия резервов')
    }
  })
}
