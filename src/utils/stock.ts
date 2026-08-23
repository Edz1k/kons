import type { Product, ProductVariant } from '~/types/product'

/** Сколько штук варианта держат активные резервы (значение считает Directus). */
export function variantReservedQty(variant?: ProductVariant | null) {
  const value = Number(variant?.reserved_qty ?? 0)

  return Number.isNaN(value) ? 0 : Math.max(0, value)
}

/** Остаток, который реально можно купить или зарезервировать прямо сейчас. */
export function variantAvailableStock(variant?: ProductVariant | null) {
  const stock = Number(variant?.stock ?? 0)

  if (Number.isNaN(stock))
    return 0

  return Math.max(0, stock - variantReservedQty(variant))
}

export function productReservedQty(product?: Product | null) {
  return (product?.product_variants ?? []).reduce(
    (total, variant) => total + variantReservedQty(variant),
    0,
  )
}

export function productAvailableStock(product?: Product | null) {
  return (product?.product_variants ?? []).reduce(
    (total, variant) => total + variantAvailableStock(variant),
    0,
  )
}

/** Ближайшая дата, когда чей-то резерв освободит товар. */
export function productReservedUntil(product?: Product | null) {
  const dates = (product?.product_variants ?? [])
    .filter(variant => variantReservedQty(variant) > 0)
    .map(variant => variant.reserved_until)
    .filter((value): value is string => Boolean(value))
    .map(value => new Date(value).getTime())
    .filter(value => !Number.isNaN(value) && value > Date.now())

  if (!dates.length)
    return null

  return new Date(Math.min(...dates)).toISOString()
}

export function formatReservedUntil(value?: string | null, withYear = false) {
  if (!value)
    return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  }).format(date)
}

function pluralize(value: number, forms: [string, string, string]) {
  const mod10 = value % 10
  const mod100 = value % 100

  if (mod10 === 1 && mod100 !== 11)
    return forms[0]

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return forms[1]

  return forms[2]
}

/** «2 дня 4 часа», «5 часов», «12 минут» — сколько осталось до конца резерва. */
export function formatTimeLeft(expiresAt?: string | null, now = Date.now()) {
  if (!expiresAt)
    return ''

  const target = new Date(expiresAt).getTime()

  if (Number.isNaN(target))
    return ''

  const diff = target - now

  if (diff <= 0)
    return 'истёк'

  const totalMinutes = Math.floor(diff / 60_000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    const daysText = `${days} ${pluralize(days, ['день', 'дня', 'дней'])}`

    return hours > 0
      ? `${daysText} ${hours} ${pluralize(hours, ['час', 'часа', 'часов'])}`
      : daysText
  }

  if (hours > 0)
    return `${hours} ${pluralize(hours, ['час', 'часа', 'часов'])} ${minutes} мин`

  return `${minutes} ${pluralize(minutes, ['минута', 'минуты', 'минут'])}`
}
