/**
 * Аналитика: Яндекс Метрика, Google Analytics 4, тег Google Ads.
 *
 * Метрика brillex.kz — счётчик 114234732 (номер не секрет: он виден в коде любой страницы).
 * Остальное включается переменными окружения сборки (Netlify → Environment variables):
 *   VITE_YM_ID     — другой счётчик Метрики вместо основного (например, для теста)
 *   VITE_GA_ID     — идентификатор потока GA4, например G-XXXXXXXXXX
 *   VITE_GADS_ID   — тег Google Ads, например AW-123456789 (ремаркетинг; конверсии берём из GA4)
 * Нет номера — соответствующий счётчик просто не грузится. В dev-режиме ничего не грузится.
 *
 * Цели (одни и те же имена в Метрике и в GA4) — см. GOALS ниже.
 */

import type { Router } from 'vue-router'

const YM_ID = Number(import.meta.env.VITE_YM_ID || 114234732)
const GA_ID = String(import.meta.env.VITE_GA_ID || '')
const GADS_ID = String(import.meta.env.VITE_GADS_ID || '')

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Цели сайта. Ключ — идентификатор цели в Метрике («JavaScript-событие»),
 * ga — событие GA4 (generate_lead / sign_up — рекомендованные Google, их проще отметить ключевыми).
 */
export const GOALS = {
  lead_form: { ga: 'generate_lead', params: { lead_source: 'contact_form' }, title: 'Заявка: общая форма' },
  lead_product: { ga: 'generate_lead', params: { lead_source: 'product' }, title: 'Заявка: товар' },
  reserve: { ga: 'reserve_product', params: {}, title: 'Резерв товара' },
  sign_up: { ga: 'sign_up', params: {}, title: 'Регистрация' },
  click_whatsapp: { ga: 'contact', params: { method: 'whatsapp' }, title: 'Клик: WhatsApp' },
  click_phone: { ga: 'contact', params: { method: 'phone' }, title: 'Клик: телефон' },
  click_email: { ga: 'contact', params: { method: 'email' }, title: 'Клик: почта' },
} as const

export type Goal = keyof typeof GOALS

let enabled = false

function loadScript(src: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function initMetrika() {
  // официальный загрузчик Метрики: очередь вызовов до загрузки tag.js
  const queue: unknown[] = []
  const ym = (...args: unknown[]) => {
    queue.push(args)
  }
  ;(ym as unknown as { a: unknown[], l: number }).a = queue
  ;(ym as unknown as { a: unknown[], l: number }).l = Date.now()
  window.ym = ym
  loadScript(`https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`)

  window.ym(YM_ID, 'init', {
    // просмотры страниц шлём сами при каждом переходе роутера (сайт — SPA)
    defer: true,
    // страницы собраны заранее (vite-ssg) — так Метрика рекомендует для SSR, в т.ч. для Вебвизора
    ssr: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
}

function initGtag() {
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag ждёт именно объект arguments
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID || GADS_ID}`)
  window.gtag('js', new Date())

  // GA4 сам считает переходы внутри SPA («Расширенная статистика» → изменения истории браузера)
  if (GA_ID)
    window.gtag('config', GA_ID)
  if (GADS_ID)
    window.gtag('config', GADS_ID)
}

/** Клики по WhatsApp, телефону и почте — на любой ссылке сайта, без правок в компонентах. */
function trackContactClicks() {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]')
    const href = link?.getAttribute('href') ?? ''

    if (/^https?:\/\/(?:wa\.me|api\.whatsapp\.com)\//.test(href) || href.startsWith('whatsapp:'))
      trackGoal('click_whatsapp')
    else if (href.startsWith('tel:'))
      trackGoal('click_phone')
    else if (href.startsWith('mailto:'))
      trackGoal('click_email')
  }, { capture: true })
}

export function initAnalytics(router: Router) {
  if (!import.meta.env.PROD || (!YM_ID && !GA_ID && !GADS_ID))
    return

  enabled = true

  if (YM_ID)
    initMetrika()
  if (GA_ID || GADS_ID)
    initGtag()

  trackContactClicks()

  if (YM_ID) {
    let previousUrl = document.referrer

    const sendHit = (fullPath: string) => {
      const url = window.location.origin + fullPath
      // заголовок страницы unhead ставит чуть позже перехода
      setTimeout(() => {
        window.ym?.(YM_ID, 'hit', url, { referer: previousUrl, title: document.title })
        previousUrl = url
      }, 0)
    }

    // первый просмотр — когда роутер открыл стартовую страницу
    router.isReady().then(() => sendHit(router.currentRoute.value.fullPath)).catch(() => {})

    // дальше — каждый переход внутри сайта (стартовый переход пропускаем, он уже учтён выше)
    router.afterEach((to, from, failure) => {
      if (failure || !from.matched.length || to.fullPath === from.fullPath)
        return

      sendHit(to.fullPath)
    })
  }
}

/** Достигнута цель: шлём и в Метрику, и в GA4. Без счётчиков — ничего не делает. */
export function trackGoal(goal: Goal, extra: Record<string, unknown> = {}) {
  if (!enabled)
    return

  const { ga, params } = GOALS[goal]

  try {
    if (YM_ID)
      window.ym?.(YM_ID, 'reachGoal', goal, extra)
    if (GA_ID)
      window.gtag?.('event', ga, { ...params, ...extra })
  }
  catch (error) {
    console.warn('[analytics] не удалось отправить цель', goal, error)
  }
}

/** ClientID Метрики — уходит вместе с заявкой в CRM, чтобы потом связать сделку с визитом. */
export function getMetrikaClientId(timeoutMs = 300): Promise<string | undefined> {
  if (!enabled || !YM_ID || !window.ym)
    return Promise.resolve(undefined)

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), timeoutMs)
    window.ym!(YM_ID, 'getClientID', (id: string) => {
      clearTimeout(timer)
      resolve(id)
    })
  })
}
