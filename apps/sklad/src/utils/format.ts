import type { MovementType, OpType, UserRef, Variant, VariantRef } from '~/types/warehouse'

export const OP: Record<MovementType, { name: string, sign: '+' | '−' }> = {
  receipt: { name: 'Приход', sign: '+' },
  issue: { name: 'Списание', sign: '−' },
  return: { name: 'Возврат', sign: '+' },
  cancel_in: { name: 'Отмена списания', sign: '+' },
  cancel_out: { name: 'Отмена прихода', sign: '−' },
  adjust_in: { name: 'Корректировка', sign: '+' },
  adjust_out: { name: 'Корректировка', sign: '−' },
}

export const OP_FORM: Record<OpType, { verb: string, note: string }> = {
  receipt: { verb: 'Провести приход', note: 'Поставщик или партия (необязательно)' },
  issue: { verb: 'Списать', note: 'Для какого заказа или клиента (необязательно)' },
  return: { verb: 'Принять возврат', note: 'От какого клиента (необязательно)' },
}

export const isMinus = (t: MovementType) => OP[t].sign === '−'
export const isCorrection = (t: MovementType) => t.startsWith('cancel_') || t.startsWith('adjust_')

export const num = (n: number | string | null | undefined) => Number(n || 0).toLocaleString('ru-RU')
export const money = (n: number | string | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₸`
export const qtyText = (q: number | null | undefined) => (q === null || q === undefined ? '—' : `${num(q)} шт`)

/** Подпись позиции: «Шопер, Белый». Вариант без товара — «Без товара · SKU». */
export function nameOf(v: Pick<VariantRef, 'product' | 'color' | 'sku'> | null | undefined) {
  if (!v)
    return ''
  if (!v.product)
    return `Без товара${v.sku ? ` · ${v.sku}` : ''}`
  return v.color?.name ? `${v.product.title}, ${v.color.name}` : v.product.title
}

/** Артикул (SKU варианта). */
export const art = (v: Pick<VariantRef, 'sku'>) => String(v.sku ?? '').trim()

export const userName = (u: UserRef | null | undefined) => (u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || '—' : '—')

export function initials(name: string) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function when(ts: string | null | undefined) {
  if (!ts)
    return '—'
  const d = new Date(ts)
  const now = new Date()
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString())
    return `сегодня, ${time}`
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString())
    return `вчера, ${time}`
  return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: d.getFullYear() === now.getFullYear() ? undefined : '2-digit' })}, ${time}`
}

export type StockKey = 'ok' | 'low' | 'out' | 'unknown'

export function stockState(v: Pick<Variant, 'stock' | 'min_quantity'>): { key: StockKey, cls: string, label: string } {
  const q = v.stock
  if (q === null || q === undefined)
    return { key: 'unknown', cls: 'bg-warning/10 text-warning', label: 'не пересчитан' }
  if (q === 0)
    return { key: 'out', cls: 'bg-destructive/10 text-destructive', label: 'нет' }
  if (v.min_quantity !== null && v.min_quantity !== undefined && q <= v.min_quantity)
    return { key: 'low', cls: 'bg-warning/10 text-warning', label: 'мало' }
  return { key: 'ok', cls: '', label: '' }
}

/** Поиск по складу: штрихкод, артикул, название товара, цвет. */
export function matches(v: Pick<VariantRef, 'barcode' | 'sku' | 'product' | 'color'>, term: string) {
  const t = term.trim().toLowerCase()
  if (!t)
    return true
  return v.barcode.toLowerCase().includes(t)
    || (v.sku ?? '').toLowerCase().includes(t)
    || (v.product?.title ?? '').toLowerCase().includes(t)
    || (v.color?.name ?? '').toLowerCase().includes(t)
}

/** CSV с ; и BOM — Excel открывает кириллицу без танцев. Текст с = + - @ экранируем от формул. */
export function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    let t = String(v ?? '')
    if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(t))
      t = `'${t}`
    return `"${t.replace(/"/g, '""')}"`
  }
  const BOM = String.fromCharCode(0xFEFF)
  const csv = `${BOM}${rows.map(r => r.map(cell).join(';')).join('\r\n')}`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const today = () => new Date().toISOString().slice(0, 10)
