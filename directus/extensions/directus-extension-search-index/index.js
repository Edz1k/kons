/**
 * Поисковый индекс каталога.
 *
 * Держит в схеме `search` (Directus её не видит — он смотрит только в public)
 * материализованное представление `search.docs_v1`: по строке на свой и на партнёрский товар
 * с готовым полнотекстовым вектором (русская морфология + «как написано»),
 * списком слов для поиска с опечатками и сырой строкой для поиска по артикулу.
 *
 *  - при старте сам создаёт расширения pg_trgm / fuzzystrmatch, схему, представление и индексы;
 *  - пересобирает индекс через пару секунд после правок товаров, вариантов, цветов, категорий;
 *  - раз в 10 минут пересобирает на всякий случай (партнёрский каталог может заливаться мимо Directus).
 *
 * Читает индекс эндпоинт `directus-extension-search` (GET /search).
 */

const VIEW = 'search.docs_v1'

const WATCHED = [
  'products',
  'product_variants',
  'colors',
  'Categories',
  'partner_products',
  'partner_categories',
]

// lower + ё→е, одинаково для документа и запроса
const norm = x => `translate(lower(coalesce(${x}, '')), 'ё', 'е')`
// всё, что не буква/цифра — в пробел (иначе «HY-610» парсится как «hy» и «-610»)
const clean = x => `regexp_replace(${x}, '[^[:alnum:]]+', ' ', 'g')`

const DOC_COLUMNS = `
  setweight(to_tsvector('russian', d.title), 'A')
  || setweight(to_tsvector('simple', ${clean('d.title')}), 'A')
  || setweight(to_tsvector('russian', d.meta), 'B')
  || setweight(to_tsvector('simple', ${clean('d.meta')}), 'B')
  || setweight(to_tsvector('russian', d.descr), 'C') AS tsv,
  ARRAY(
    SELECT DISTINCT w
    FROM unnest(regexp_split_to_array(${clean(`d.title || ' ' || d.meta`)}, '\\s+')) AS w
    WHERE length(w) >= 3
  ) AS words,
  d.title || ' ' || d.meta AS haystack`

const CREATE_VIEW = `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${VIEW} AS
WITH own AS (
  SELECT
    'own'::text AS kind,
    p.id,
    c.slug AS category_slug,
    true AS active,
    ${norm('p.title')} AS title,
    ${norm(`concat_ws(' ', c.title,
      (SELECT string_agg(DISTINCT col.name, ' ') FROM product_variants v JOIN colors col ON col.id = v.color WHERE v.product = p.id),
      (SELECT string_agg(DISTINCT trim(v.sku), ' ') FROM product_variants v WHERE v.product = p.id))`)} AS meta,
    ${norm('p.description')} AS descr
  FROM products p
  LEFT JOIN "Categories" c ON c.id = p.category
),
partner AS (
  SELECT
    'partner'::text AS kind,
    pp.id,
    pc.slug AS category_slug,
    coalesce(pp.is_active, true) AS active,
    ${norm('pp.title')} AS title,
    ${norm(`concat_ws(' ', pc.title, pp.external_id,
      pp.payload->>'category', pp.payload->>'material', pp.payload->>'brand',
      (SELECT string_agg(DISTINCT concat_ws(' ', v->>'color', v->>'sku'), ' ')
       FROM json_array_elements(CASE WHEN json_typeof(pp.payload->'variants') = 'array' THEN pp.payload->'variants' ELSE '[]'::json END) AS v))`)} AS meta,
    ${norm(`regexp_replace(pp.description, '<[^>]+>', ' ', 'g')`)} AS descr
  FROM partner_products pp
  LEFT JOIN partner_categories pc ON pc.id = pp.category
)
SELECT d.kind, d.id, d.category_slug, d.active, d.title, ${DOC_COLUMNS}
FROM (SELECT * FROM own UNION ALL SELECT * FROM partner) AS d`

const SETUP = [
  'CREATE EXTENSION IF NOT EXISTS pg_trgm',
  'CREATE EXTENSION IF NOT EXISTS fuzzystrmatch',
  'CREATE SCHEMA IF NOT EXISTS search',
  CREATE_VIEW,
  `CREATE UNIQUE INDEX IF NOT EXISTS docs_v1_pk ON ${VIEW} (kind, id)`,
  `CREATE INDEX IF NOT EXISTS docs_v1_tsv ON ${VIEW} USING gin (tsv)`,
  `CREATE INDEX IF NOT EXISTS docs_v1_haystack ON ${VIEW} USING gin (haystack gin_trgm_ops)`,
]

export default ({ action, schedule }, { database, logger }) => {
  let ready = null
  let timer = null
  let running = false
  let again = false

  function ensure() {
    ready ??= (async () => {
      for (const sql of SETUP)
        await database.raw(sql)
      logger.info('[search] индекс готов')
    })().catch((error) => {
      ready = null
      throw error
    })

    return ready
  }

  async function refresh() {
    if (running) {
      again = true
      return
    }

    running = true

    try {
      await ensure()
      await database.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${VIEW}`)
    }
    catch (error) {
      logger.error(`[search] не удалось обновить индекс: ${error.message}`)
    }
    finally {
      running = false

      if (again) {
        again = false
        refresh()
      }
    }
  }

  function refreshSoon() {
    clearTimeout(timer)
    timer = setTimeout(refresh, 3000)
  }

  ensure().catch(error => logger.error(`[search] не удалось создать индекс: ${error.message}`))

  for (const collection of WATCHED) {
    for (const event of ['create', 'update', 'delete'])
      action(`${collection}.items.${event}`, refreshSoon)
  }

  schedule('*/10 * * * *', refresh)
}
