/**
 * GET /search?q=ручка черная&type=own|partner&category=<slug>&page=1&limit=24
 *
 * Ищет по индексу `search.docs_v1` (его ведёт `directus-extension-search-index`):
 *  - каждое слово запроса должно найтись в товаре, порядок не важен;
 *  - окончания не важны: «черная» = «черный» = «черные» (русская морфология Postgres);
 *  - недописанное слово ищется как начало: «руч» → «ручка»;
 *  - опечатки: одна буква в словах от 4 букв, две — от 7 («ручька» → «ручка»);
 *  - запрос целиком ищется ещё и как подстрока — для артикулов вида «HY-610», «4098.09-S».
 *
 * Отдаёт { ids, total } — id товаров по убыванию релевантности.
 * Для своего каталога — все совпадения (сайт сам фильтрует и листает), для партнёрского — страница.
 */

const VIEW = 'search.docs_v1'
const MAX_TOKENS = 8

function normalize(value) {
  return String(value ?? '').toLowerCase().replaceAll('ё', 'е').trim().slice(0, 100)
}

function tokenize(phrase) {
  const words = phrase.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(w => w.slice(0, 40))
  return [...new Set(words)].slice(0, MAX_TOKENS)
}

function typoBudget(token) {
  if (token.length >= 7)
    return 2
  if (token.length >= 4)
    return 1
  return 0
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, m => `\\${m}`)
}

export default {
  id: 'search',
  handler: (router, { database, logger }) => {
    router.get('/', async (req, res) => {
      const phrase = normalize(req.query.q)
      const type = req.query.type === 'partner' ? 'partner' : 'own'
      const category = typeof req.query.category === 'string' ? req.query.category : ''
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), 100)
      const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
      const tokens = tokenize(phrase)

      if (!phrase || !tokens.length)
        return res.json({ ids: [], total: 0 })

      const like = escapeLike(phrase)
      const anyQuery = tokens.map(t => `${t}:*`).join(' | ')

      // strict: слова ищем в названии, категории, цвете, артикуле (веса A и B);
      // если так ничего нет — второй проход, где в счёт идёт и описание.
      function buildQuery(strict, pageNo) {
        const weight = strict ? 'AB' : ''
        const bindings = []
        const tokenConditions = tokens.map((token) => {
          const budget = typoBudget(token)
          bindings.push(`${token}:*${weight}`, `${token}:*${weight}`)
          let sql = `(tsv @@ (to_tsquery('russian', ?) || to_tsquery('simple', ?))`

          if (budget > 0) {
            sql += ` OR EXISTS (SELECT 1 FROM unnest(words) AS w
              WHERE abs(length(w) - ?) <= ? AND levenshtein(w, ?) <= ?)`
            bindings.push(token.length, budget, token, budget)
          }

          return `${sql})`
        })

        // сколько слов запроса нашлось прямо в названии — главный признак релевантности
        const titleHits = tokens.map(() => `(tsv @@ (to_tsquery('russian', ?) || to_tsquery('simple', ?)))::int`)
        const titleBindings = tokens.flatMap(t => [`${t}:*A`, `${t}:*A`])

        const where = [`kind = ?`, `active`]
        const whereBindings = [type]

        if (category) {
          where.push('category_slug = ?')
          whereBindings.push(category)
        }

        const sql = `
          WITH q AS (SELECT to_tsquery('russian', ?) || to_tsquery('simple', ?) AS query)
          SELECT id,
            2 * (${titleHits.join(' + ')})
              + ts_rank(tsv, q.query)
              + similarity(title, ?)
              + CASE WHEN title LIKE ? THEN 1 ELSE 0 END AS score,
            count(*) OVER () AS total
          FROM ${VIEW}, q
          WHERE ${where.join(' AND ')}
            AND ((${tokenConditions.join(' AND ')}) OR haystack LIKE ?)
          ORDER BY score DESC, id DESC
          ${type === 'partner' ? 'LIMIT ? OFFSET ?' : ''}`

        return [sql, [
          anyQuery,
          anyQuery,
          ...titleBindings,
          phrase,
          `${like}%`,
          ...whereBindings,
          ...bindings,
          `%${like}%`,
          ...(type === 'partner' ? [limit, (pageNo - 1) * limit] : []),
        ]]
      }

      async function run(strict, pageNo = page) {
        const result = await database.raw(...buildQuery(strict, pageNo))
        return result.rows ?? result
      }

      try {
        let rows = await run(true)

        // нестрогий проход — только если строгий не нашёл вообще ничего
        // (пустая 2-я страница при непустой 1-й — это просто конец списка)
        if (!rows.length && (page === 1 || !(await run(true, 1)).length))
          rows = await run(false)

        res.set('Cache-Control', 'public, max-age=30')
        return res.json({
          ids: rows.map(row => row.id),
          total: rows.length ? Number(rows[0].total) : 0,
        })
      }
      catch (error) {
        logger.error(`[search] ${error.message}`)
        return res.status(500).json({ errors: [{ message: 'Поиск временно недоступен' }] })
      }
    })
  },
}
