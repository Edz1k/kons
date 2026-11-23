/**
 * Откуда пришёл посетитель: UTM-метки, gclid / yclid, страница входа, реферер.
 *
 * Запоминаем при заходе на сайт и отдаём вместе с заявкой в CRM — так в сделке видно,
 * какая кампания и какой запрос её привели. Модель «последний значимый переход»:
 * новый заход с метками перезаписывает старые, заход без меток (прямой) — нет.
 * Храним 30 дней: B2B-клиент часто возвращается и оставляет заявку не в первый визит.
 */

const STORAGE_KEY = 'brillex_attribution'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'yclid'] as const

export type Attribution = Partial<Record<typeof PARAMS[number] | 'landing_page' | 'referrer', string>> & {
  saved_at?: number
}

function read(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw)
      return null

    const data = JSON.parse(raw) as Attribution
    return data.saved_at && Date.now() - data.saved_at < TTL_MS ? data : null
  }
  catch {
    return null
  }
}

/** Вызывается один раз при загрузке сайта в браузере. */
export function captureAttribution() {
  try {
    const url = new URL(window.location.href)
    const found: Attribution = {}

    for (const key of PARAMS) {
      const value = url.searchParams.get(key)
      if (value)
        found[key] = value.slice(0, 200)
    }

    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer.slice(0, 300)
      : ''

    // нет ни меток, ни внешнего реферера — прямой заход или переход внутри сайта:
    // сохранённый источник не трогаем
    if (!Object.keys(found).length && !referrer)
      return

    const data: Attribution = {
      ...found,
      referrer: referrer || undefined,
      landing_page: (url.pathname + url.search).slice(0, 300),
      saved_at: Date.now(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  catch {
    // приватный режим / запрет хранилища — просто без атрибуции
  }
}

/** Поля для заявки: только непустые, без служебного saved_at. */
export function getAttributionFields(): Record<string, string> {
  const data = read()

  if (!data)
    return {}

  const { saved_at: _savedAt, ...fields } = data

  return Object.fromEntries(
    Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== ''),
  )
}
