/**
 * Пересборка сайта на Netlify при изменениях каталога.
 *
 * Сайт собирается заранее (у каждого товара свой готовый HTML с заголовком, описанием,
 * картинкой для превью ссылки и микроразметкой). Чтобы новый или изменённый товар
 * попал на сайт и в поиск, сайт нужно пересобрать — это и делает расширение:
 *
 *  - через 10 минут после последней правки товаров, вариантов, цветов или категорий
 *    (правки подряд копятся и дают одну сборку, а не десять);
 *  - каждую ночь в 05:00 — подхватить партнёрский каталог, который может заливаться мимо Directus.
 *
 * Включается переменной окружения NETLIFY_BUILD_HOOK (Netlify → Site configuration →
 * Build & deploy → Build hooks). Без неё расширение ничего не делает.
 */

import process from 'node:process'

const HOOK = process.env.NETLIFY_BUILD_HOOK ?? ''
const DELAY_MS = Number(process.env.SITE_REBUILD_DELAY_MINUTES ?? 10) * 60 * 1000

const WATCHED = [
  'products',
  'product_variants',
  'product_variants_directus_files',
  'colors',
  'Categories',
  'partner_products',
  'partner_categories',
]

export default ({ action, schedule }, { logger }) => {
  if (!HOOK) {
    logger.info('[site-rebuild] NETLIFY_BUILD_HOOK не задан — автопересборка сайта выключена')
    return
  }

  let timer = null

  async function rebuild(reason) {
    try {
      const response = await fetch(`${HOOK}?trigger_title=${encodeURIComponent(`Directus: ${reason}`)}`, { method: 'POST' })

      if (!response.ok)
        throw new Error(`Netlify ответил ${response.status}`)

      logger.info(`[site-rebuild] запущена пересборка сайта (${reason})`)
    }
    catch (error) {
      logger.error(`[site-rebuild] не удалось запустить пересборку: ${error.message}`)
    }
  }

  function rebuildSoon(collection) {
    clearTimeout(timer)
    timer = setTimeout(() => rebuild(`изменения в ${collection}`), DELAY_MS)
  }

  for (const collection of WATCHED) {
    for (const event of ['create', 'update', 'delete'])
      action(`${collection}.items.${event}`, () => rebuildSoon(collection))
  }

  schedule('0 5 * * *', () => rebuild('ночная пересборка'))
}
