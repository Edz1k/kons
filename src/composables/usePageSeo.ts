import type { MaybeRefOrGetter } from 'vue'
import { useHead } from '@unhead/vue'
import { toValue } from 'vue'
import { ADDRESS, EMAIL_PRIMARY, PHONE } from '~/constants/contacts'

export const SITE_URL = 'https://brillex.kz'
export const SITE_NAME = 'Brillex'
/** JPG 1200×630 — WebP превью ссылок понимают не все мессенджеры. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`
export const DEFAULT_DESCRIPTION
  = 'Мерч и корпоративные подарки с логотипом в Алматы: ручки, термокружки, ежедневники, шоперы, бейджи. Товары в наличии и под заказ, нанесение логотипа, доставка по Казахстану.'

export interface PageSeo {
  /** Заголовок без хвоста «| Brillex» — его добавим сами. */
  title: string
  description?: string
  image?: string | null
  /** Размеры картинки — без них WhatsApp и Facebook иногда не рисуют превью с первого раза. */
  imageWidth?: number
  imageHeight?: number
  imageType?: string
  /** Не индексировать страницу (вход, профиль, 404, черновики). */
  noindex?: boolean
  type?: 'website' | 'product'
}

/** Обрезает текст под сниппет: без HTML и переносов, по границе слова. */
export function toSnippet(text: string | null | undefined, max = 160): string {
  const clean = String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= max)
    return clean

  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, '')}…`
}

/**
 * Заголовок, описание, Open Graph и robots одной страницы.
 * Значения можно передавать геттером — тогда они обновятся, когда догрузятся данные.
 */
export function usePageSeo(seo: MaybeRefOrGetter<PageSeo>) {
  const value = () => toValue(seo)
  const fullTitle = () => {
    const title = value().title
    return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  }
  const description = () => toSnippet(value().description || DEFAULT_DESCRIPTION)
  const image = () => value().image || DEFAULT_OG_IMAGE
  const isDefaultImage = () => !value().image
  // размеры знаем только у своих картинок; для чужих (партнёры) тег не выводим вовсе
  const imageWidth = () => (isDefaultImage() ? '1200' : value().imageWidth?.toString())
  const imageHeight = () => (isDefaultImage() ? '630' : value().imageHeight?.toString())
  const imageType = () => (isDefaultImage() ? 'image/jpeg' : value().imageType)

  useHead({
    title: fullTitle,
    meta: [
      { key: 'description', name: 'description', content: description },
      { key: 'robots', name: 'robots', content: () => (value().noindex ? 'noindex, follow' : 'index, follow') },
      { key: 'og:title', property: 'og:title', content: fullTitle },
      { key: 'og:description', property: 'og:description', content: description },
      { key: 'og:image', property: 'og:image', content: image },
      { key: 'og:image:secure_url', property: 'og:image:secure_url', content: image },
      { key: 'og:image:width', property: 'og:image:width', content: imageWidth },
      { key: 'og:image:height', property: 'og:image:height', content: imageHeight },
      { key: 'og:image:type', property: 'og:image:type', content: imageType },
      { key: 'og:image:alt', property: 'og:image:alt', content: () => value().title },
      { key: 'twitter:image', name: 'twitter:image', content: image },
      { key: 'og:type', property: 'og:type', content: () => value().type ?? 'website' },
      { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    ],
  })
}

/** Микроразметка JSON-LD. Объект можно передать геттером. */
export function useJsonLd(key: string, data: MaybeRefOrGetter<Record<string, unknown> | null>) {
  // именно функцией целиком: computed внутри script unhead при сборке страниц не выводит
  useHead(() => {
    const value = toValue(data)

    return {
      script: value
        ? [{ key: `ld-${key}`, type: 'application/ld+json', innerHTML: JSON.stringify(value) }]
        : [],
    }
  })
}

/** Сведения о компании для разметки Organization / LocalBusiness. */
export const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#organization`,
  'name': SITE_NAME,
  'description': DEFAULT_DESCRIPTION,
  'url': SITE_URL,
  'logo': `${SITE_URL}/logo.webp`,
  'image': DEFAULT_OG_IMAGE,
  'telephone': PHONE,
  'email': EMAIL_PRIMARY,
  'priceRange': '₸₸',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': ADDRESS,
    'addressLocality': 'Алматы',
    'addressCountry': 'KZ',
  },
  'areaServed': 'KZ',
}
