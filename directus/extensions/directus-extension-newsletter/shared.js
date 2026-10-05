import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const OPERATION_ID = 'brillex-newsletter'
export const LOG_COLLECTION = 'newsletter_log'

export function newsletterConfig(env) {
  const publicUrl = String(env.PUBLIC_URL ?? 'https://cms.brillex.kz').replace(/\/+$/, '')
  const siteUrl = String(env.NEWSLETTER_SITE_URL ?? 'https://brillex.kz').replace(/\/+$/, '')

  return {
    publicUrl,
    siteUrl,
    logoUrl: env.NEWSLETTER_LOGO_URL ?? `${siteUrl}/email/logo-light.png`,
    from: { name: 'Brillex', address: env.EMAIL_FROM },
    /** Пауза между письмами, чтобы почтовики не приняли рассылку за спам-залп. */
    gapMs: Number(env.NEWSLETTER_GAP_MS ?? 1500),
  }
}

/** Подпись ссылки «Отписаться»: без неё любой мог бы отписать чужой адрес. */
export function unsubscribeToken(secret, userId) {
  return createHmac('sha256', String(secret))
    .update(`newsletter-unsubscribe:${userId}`)
    .digest('base64url')
    .slice(0, 32)
}

export function isValidUnsubscribeToken(secret, userId, token) {
  if (!secret || !userId || typeof token !== 'string')
    return false

  const expected = Buffer.from(unsubscribeToken(secret, userId))
  const actual = Buffer.from(token)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function unsubscribeUrl(config, secret, userId) {
  return `${config.publicUrl}/newsletter/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(secret, userId)}`
}
