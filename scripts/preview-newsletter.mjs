/**
 * Превью письма о новинке на настоящем товаре — без отправки.
 *
 *   node scripts/preview-newsletter.mjs termobutilka > /tmp/newsletter.html
 *   node scripts/preview-newsletter.mjs termobutilka --variant   # вариант «Новый цвет» (последний цвет — новый)
 */

import process from 'node:process'
import { renderNewProductEmail } from '../directus/extensions/directus-extension-newsletter/template.js'

const CMS = process.env.DIRECTUS_URL ?? 'https://cms.brillex.kz'
const slug = process.argv[2]
const asVariant = process.argv.includes('--variant')

if (!slug) {
  console.error('Укажите slug товара: node scripts/preview-newsletter.mjs termobutilka')
  process.exit(1)
}

const fields = [
  'title',
  'slug',
  'price',
  'description',
  'category.title',
  'product_variants.id',
  'product_variants.is_default',
  'product_variants.color.name',
  'product_variants.color.hex',
  'product_variants.images.directus_files_id',
  'product_variants.images.sort',
].join(',')

const res = await fetch(`${CMS}/items/products?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=${fields}`)
const product = (await res.json()).data?.[0]

if (!product) {
  console.error(`Товар «${slug}» не найден`)
  process.exit(1)
}

const variants = [...(product.product_variants ?? [])]
  .sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) || a.id - b.id)
  .map((v, i, all) => ({
    colorName: v.color?.name,
    colorHex: v.color?.hex,
    imageId: [...(v.images ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))[0]?.directus_files_id,
    isNew: asVariant && i === all.length - 1,
  }))

const { subject, html } = renderNewProductEmail({
  kind: asVariant ? 'variant' : 'product',
  product,
  variants,
  siteUrl: 'https://brillex.kz',
  assetsUrl: CMS,
  logoUrl: 'https://brillex.kz/email/logo-light.png',
  unsubscribeUrl: `${CMS}/newsletter/unsubscribe?test=1`,
  firstName: 'Эдуард',
  discountPercent: asVariant ? 10 : 0,
})

console.error(`Тема: ${subject}`)
process.stdout.write(html)
