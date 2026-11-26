import type { Deal, DealItem, Mockup, PrState, Source, Stage, UserRef } from '~/types/crm'

/** Воронка: порядок стадий на доске. «Отказ» — отдельно. */
export const STAGES: { id: Exclude<Stage, 'lost'>, name: string, short: string, tone: string }[] = [
  { id: 'new', name: 'Новая', short: 'Новые', tone: 'bg-blue-600' },
  { id: 'calc', name: 'Расчёт и КП', short: 'Расчёт', tone: 'bg-violet-600' },
  { id: 'mock', name: 'Макет', short: 'Макет', tone: 'bg-pink-600' },
  { id: 'pay', name: 'Предоплата', short: 'Оплата', tone: 'bg-amber-500' },
  { id: 'prod', name: 'Производство', short: 'Цех', tone: 'bg-primary' },
  { id: 'ready', name: 'Отгрузка', short: 'Отгрузка', tone: 'bg-cyan-600' },
  { id: 'done', name: 'Закрыта', short: 'Закрыты', tone: 'bg-success' },
]
export const STAGE_NAME: Record<Stage, string> = { ...Object.fromEntries(STAGES.map(s => [s.id, s.name])), lost: 'Отказ' } as Record<Stage, string>
export const ACTIVE_STAGES: Stage[] = ['new', 'calc', 'mock', 'pay', 'prod', 'ready']

export const SOURCES: Record<Source, string> = { wa: 'WhatsApp', ig: 'Instagram', tg: 'Telegram', site: 'Сайт', call: 'Звонок' }
export const MOCKUPS: Record<Mockup, { name: string, cls: string }> = {
  none: { name: 'Нет макета', cls: '' },
  wait: { name: 'Макет на согласовании', cls: 'bg-warning/10 text-warning' },
  ok: { name: 'Макет утверждён', cls: 'bg-success/10 text-success' },
}
export const PR_STATES: Record<PrState, { name: string, cls: string }> = {
  queue: { name: 'Ждёт запуска', cls: 'bg-warning/10 text-warning' },
  work: { name: 'В цеху', cls: 'bg-primary/10 text-primary' },
  done: { name: 'Готов', cls: 'bg-success/10 text-success' },
}
export const TECHNIQUES = ['Шелкография', 'Лазерная гравировка', 'Механическая гравировка', 'UV-печать', 'DTF', 'UV-DTF', 'Тиснение', 'Вышивка', 'Сублимация', 'Термотрансфер']
export const LOST_REASONS = ['Дорого', 'Не успеваем по срокам', 'Ушли к другому подрядчику', 'Не устроил макет или качество', 'Передумали', 'Другое']

// ── деньги ─────────────────────────────────────────────────────────────

export const n = (v: string | number | null | undefined) => Number(v) || 0
export const itemSum = (i: Pick<DealItem, 'quantity' | 'price' | 'technique_price'>) => n(i.quantity) * (n(i.price) + n(i.technique_price))
export const subtotal = (d: Pick<Deal, 'items'>) => (d.items ?? []).reduce((a, i) => a + itemSum(i), 0)
export const total = (d: Pick<Deal, 'items' | 'discount'>) => Math.round(subtotal(d) * (1 - n(d.discount) / 100))
export const paid = (d: Pick<Deal, 'payments'>) => (d.payments ?? []).reduce((a, p) => a + n(p.amount), 0)
export const balance = (d: Pick<Deal, 'items' | 'discount' | 'payments'>) => Math.round(total(d) - paid(d))
export const paidPercent = (d: Pick<Deal, 'items' | 'discount' | 'payments'>) => (total(d) ? Math.min(100, Math.round(paid(d) / total(d) * 100)) : 0)
export const units = (d: Pick<Deal, 'items'>) => (d.items ?? []).reduce((a, i) => a + n(i.quantity), 0)

export const money = (v: number | string | null | undefined) => `${Math.round(n(v)).toLocaleString('ru-RU')} ₸`
export const num = (v: number | string | null | undefined) => n(v).toLocaleString('ru-RU')
/** 1,2 млн / 340 тыс — на карточках и в сводке */
export function shortMoney(v: number) {
  if (v >= 1e6)
    return `${(v / 1e6).toFixed(1).replace('.', ',')} млн`
  if (v >= 1e3)
    return `${Math.round(v / 1e3)} тыс`
  return `${Math.round(v)}`
}

// ── даты и люди ────────────────────────────────────────────────────────

export const today = () => new Date().toISOString().slice(0, 10)
export const isLate = (d: Pick<Deal, 'deadline' | 'stage'>) => Boolean(d.deadline && d.deadline < today() && !['done', 'lost'].includes(d.stage))

export function fdate(s: string | null | undefined) {
  return s ? new Date(s.length === 10 ? `${s}T00:00` : s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'
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
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`
}

export function personName(u: Pick<UserRef, 'first_name' | 'last_name'> | null | undefined) {
  return u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Сотрудник' : '—'
}

export function initials(name: string) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Склонение: plural(3, 'сделка', 'сделки', 'сделок') */
export function plural(count: number, one: string, few: string, many: string) {
  const m = count % 10
  const k = count % 100
  return m === 1 && k !== 11 ? one : m >= 2 && m <= 4 && (k < 10 || k >= 20) ? few : many
}

export function phoneHref(phone: string | null | undefined) {
  const d = String(phone ?? '').split(/[,;]/)[0]?.replace(/\D/g, '') ?? ''
  return d.length >= 10 ? `tel:+${d.length === 10 ? `7${d}` : d}` : ''
}

export function whatsappHref(phone: string | null | undefined) {
  let d = String(phone ?? '').split(/[,;]/)[0]?.replace(/\D/g, '') ?? ''
  if (d.length === 11 && d[0] === '8')
    d = `7${d.slice(1)}`
  if (d.length === 10)
    d = `7${d}`
  return d.length >= 11 ? `https://wa.me/${d}` : ''
}
