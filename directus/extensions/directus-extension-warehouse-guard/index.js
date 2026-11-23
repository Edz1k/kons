/**
 * Варианты товаров = позиции склада. Хуки, которые держат склад целым при работе в админке Directus:
 *
 *  - новый вариант (менеджер завёл цвет) сразу получает следующий штрихкод BRX-…;
 *  - штрихкод не меняется;
 *  - правка stock записывается в журнал склада корректировкой (adjust_in / adjust_out) в той же транзакции —
 *    журнал и остаток не расходятся, видно, кто и когда правил.
 *
 * Склад сам пишет stock напрямую (directus-extension-warehouse), мимо этих хуков.
 */

let InvalidPayloadError = null

async function invalidPayload(message) {
  InvalidPayloadError ??= await import('@directus/errors').then(e => e.InvalidPayloadError).catch(() => null)
  if (InvalidPayloadError)
    return new InvalidPayloadError({ reason: message })
  return Object.assign(new Error(message), { status: 400, code: 'INVALID_PAYLOAD' })
}

async function nextBarcode(db) {
  await db.raw('SELECT pg_advisory_xact_lock(hashtext(?))', ['brillex_barcode'])
  const { next } = await db('product_variants')
    .select(db.raw(`coalesce(max(substring(barcode FROM '^BRX-(\\d+)$')::int), 0) + 1 AS next`))
    .first()
  return `BRX-${String(next).padStart(6, '0')}`
}

export default ({ filter }, { database: rootDb }) => {
  filter('product_variants.items.create', async (payload, _meta, context) => {
    if (!payload || payload.barcode)
      return payload
    const db = context?.database ?? rootDb
    return { ...payload, barcode: await nextBarcode(db) }
  })

  filter('product_variants.items.update', async (payload, meta, context) => {
    if (!payload || !meta.keys?.length)
      return payload
    // та же транзакция, что и сохранение варианта: откатится правка — откатится и корректировка
    const db = context?.database ?? rootDb

    if (Object.hasOwn(payload, 'barcode')) {
      const changed = await db('product_variants').whereIn('id', meta.keys).whereNot({ barcode: payload.barcode }).first()
      if (changed)
        throw await invalidPayload('Штрихкод склада не меняется: он уже напечатан на этикетках')
    }
    if (!Object.hasOwn(payload, 'stock'))
      return payload

    const stock = payload.stock === null || payload.stock === '' ? null : Number(payload.stock)
    if (stock === null || !Number.isInteger(stock) || stock < 0)
      throw await invalidPayload('Остаток — целое число от 0')

    const user = context?.accountability?.user ?? null
    const variants = await db('product_variants').whereIn('id', meta.keys).orderBy('id').forUpdate()

    for (const v of variants) {
      const before = v.stock
      if (before === stock)
        continue
      const delta = stock - (before ?? 0)
      if (delta === 0)
        continue // был неизвестен, указали 0 — движения на 0 шт не бывает, stock запишет сам Directus
      await db('wh_movements').insert({
        variant: v.id,
        type: delta > 0 ? 'adjust_in' : 'adjust_out',
        quantity: Math.abs(delta),
        balance_after: stock,
        note: before === null
          ? `Остаток указан в Directus: ${stock} шт (раньше неизвестен)`
          : `Корректировка в Directus: было ${before}, стало ${stock}`,
        user_created: user,
      })
    }

    return payload
  })
}
