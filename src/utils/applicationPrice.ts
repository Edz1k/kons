/**
 * Прайс нанесения и расчёт стоимости для калькулятора на главной.
 * Цены меняются только здесь. Цена — за нанесение, без стоимости изделий.
 *
 * Строка прайса: [подпись, тираж от, тираж до, цены по колонкам, тип]
 *   тип 't' — цена за весь тираж (образец, малые тиражи), 'u' — цена за штуку.
 * Если тираж попадает между строками (например, 150 шт.), цена берётся пропорционально между соседними ступенями.
 */

export type PriceKind = 't' | 'u'
export type PriceRow = [label: string, from: number, to: number, prices: number[], kind: PriceKind]

/** Какие доп. параметры показывать для изделия. */
export type ProductKind = 'plain' | 'tex' | 'two' | 'bags' | 'emb' | 'area'

export interface PriceProduct {
  id: string
  name: string
  kind: ProductKind
  /** Названия колонок цены: «1 цвет / 2 цвета», «Слепое / Фольгой» */
  cols: string[]
  rows: PriceRow[]
  warn?: string
}

export interface PriceMethod {
  id: string
  name: string
  note?: string
  products: PriceProduct[]
}

const INF = Number.POSITIVE_INFINITY

function sample(a: number, b: number): PriceRow {
  return ['образец', 1, 1, [a, b], 't']
}

const DTF_ROWS: PriceRow[] = [
  ['до 50', 1, 50, [650, 750], 'u'],
  ['100', 100, 100, [550, 650], 'u'],
  ['200', 200, 200, [450, 550], 'u'],
  ['300', 300, 300, [400, 500], 'u'],
  ['500', 500, 500, [350, 400], 'u'],
  ['1000', 1000, 1000, [300, 350], 'u'],
  ['2000+', 2000, INF, [280, 320], 'u'],
]

function dtfColumn(col: number): PriceRow[] {
  return DTF_ROWS.map(([label, from, to, prices, kind]) => [label, from, to, [prices[col]], kind])
}

export const PRICE_METHODS: PriceMethod[] = [
  {
    id: 'uv',
    name: 'УФ-печать',
    note: 'Изделие до 15 см в высоту и до 30×42 см. На круглых изделиях печатаем на одной стороне, без запечатки по кругу.',
    products: [
      { id: 'small', name: 'Ручки, брелоки, флешки', kind: 'plain', cols: ['Цена'], rows: [
        ['образец', 1, 1, [3000], 't'],
        ['10–20', 10, 20, [8000], 't'],
        ['30–50', 30, 50, [10000], 't'],
        ['100', 100, 100, [160], 'u'],
        ['200', 200, 200, [140], 'u'],
        ['300', 300, 300, [110], 'u'],
        ['500', 500, 500, [80], 'u'],
        ['1000', 1000, 1000, [50], 'u'],
        ['2000', 2000, 2000, [45], 'u'],
        ['3000+', 3000, INF, [35], 'u'],
      ] },
      { id: 'bottle', name: 'Бутылки, термосы, кружки', kind: 'plain', cols: ['Цена'], rows: [
        ['образец', 1, 1, [3000], 't'],
        ['10–20', 10, 20, [750], 'u'],
        ['30–50', 30, 50, [550], 'u'],
        ['100', 100, 100, [500], 'u'],
        ['200', 200, 200, [400], 'u'],
        ['300–500', 300, 500, [360], 'u'],
        ['1000', 1000, 1000, [350], 'u'],
        ['2000+', 2000, INF, [320], 'u'],
      ] },
      { id: 'diary', name: 'Ежедневники, блокноты', kind: 'plain', cols: ['Цена'], rows: [
        ['образец', 1, 1, [3000], 't'],
        ['10–20', 10, 20, [750], 'u'],
        ['30–50', 30, 50, [650], 'u'],
        ['100', 100, 100, [500], 'u'],
        ['200', 200, 200, [450], 'u'],
        ['300–500', 300, 500, [380], 'u'],
        ['1000', 1000, 1000, [350], 'u'],
        ['2000+', 2000, INF, [300], 'u'],
      ] },
      { id: 'card', name: 'Флешки-визитки, повербанки', kind: 'plain', cols: ['Цена'], warn: 'Печать на всю поверхность считается отдельно.', rows: [
        ['образец', 1, 1, [2500], 't'],
        ['10–20', 10, 20, [550], 'u'],
        ['30–50', 30, 50, [450], 'u'],
        ['100', 100, 100, [400], 'u'],
        ['200', 200, 200, [350], 'u'],
        ['300–500', 300, 500, [300], 'u'],
        ['1000', 1000, 1000, [220], 'u'],
        ['2000+', 2000, INF, [180], 'u'],
      ] },
    ],
  },
  {
    id: 'silk',
    name: 'Шелкография',
    products: [
      { id: 'light', name: 'Светлый текстиль: футболки, бейсболки', kind: 'tex', cols: ['1 цвет', '2 цвета'], rows: [
        sample(20000, 30000),
        ['до 50', 2, 50, [24000, 44000], 't'],
        ['100', 100, 100, [280, 540], 'u'],
        ['200', 200, 200, [260, 510], 'u'],
        ['300–500', 300, 500, [240, 460], 'u'],
        ['1000', 1000, 1000, [200, 380], 'u'],
        ['2000+', 2000, INF, [180, 340], 'u'],
      ] },
      { id: 'dark', name: 'Тёмный текстиль: футболки, бейсболки', kind: 'tex', cols: ['1 цвет', '2 цвета'], rows: [
        sample(20000, 30000),
        ['до 50', 2, 50, [26000, 50000], 't'],
        ['100', 100, 100, [320, 680], 'u'],
        ['200', 200, 200, [280, 540], 'u'],
        ['300–500', 300, 500, [260, 500], 'u'],
        ['1000', 1000, 1000, [250, 480], 'u'],
        ['2000+', 2000, INF, [220, 400], 'u'],
      ] },
      { id: 'lanyard', name: 'Ланьярды', kind: 'two', cols: ['1 цвет', '2 цвета'], warn: 'Логотип в 3 цвета и больше считаем индивидуально.', rows: [
        sample(15000, 25000),
        ['до 50', 2, 50, [22000, 40000], 't'],
        ['100', 100, 100, [260, 500], 'u'],
        ['200', 200, 200, [240, 460], 'u'],
        ['300–500', 300, 500, [220, 400], 'u'],
        ['1000', 1000, 1000, [200, 380], 'u'],
        ['2000+', 2000, INF, [160, 260], 'u'],
      ] },
      { id: 'bags', name: 'Полиэтиленовые пакеты', kind: 'bags', cols: ['1 цвет', '2 цвета'], warn: 'Логотип в 3 цвета и больше или печать на большую площадь считаем индивидуально.', rows: [
        sample(20000, 30000),
        ['до 50', 2, 50, [22000, 40000], 't'],
        ['100', 100, 100, [260, 520], 'u'],
        ['200', 200, 200, [220, 400], 'u'],
        ['300–500', 300, 500, [190, 340], 'u'],
        ['1000', 1000, 1000, [150, 280], 'u'],
        ['2000', 2000, 2000, [120, 200], 'u'],
        ['3000+', 3000, INF, [100, 190], 'u'],
      ] },
      { id: 'ribbon', name: 'Ленты: атлас, репс, нейлон', kind: 'two', cols: ['1 цвет', '2 цвета'], warn: 'Логотип в 3 цвета и больше считаем индивидуально.', rows: [
        ['образец', 1, 1, [15000, 28000], 't'],
        ['до 50', 2, 50, [22000, 40000], 't'],
        ['100', 100, 100, [260, 500], 'u'],
        ['200', 200, 200, [240, 460], 'u'],
        ['300–500', 300, 500, [200, 380], 'u'],
        ['1000', 1000, 1000, [160, 300], 'u'],
        ['2000', 2000, 2000, [130, 220], 'u'],
        ['3000+', 3000, INF, [100, 180], 'u'],
      ] },
    ],
  },
  {
    id: 'emboss',
    name: 'Тиснение',
    products: [
      { id: 'emb', name: 'Тиснение логотипа на коже и обложках', kind: 'emb', cols: ['Слепое', 'Фольгой'], rows: [
        ['образец', 1, 1, [7000, 9000], 't'],
        ['до 50', 2, 50, [12000, 14000], 't'],
        ['100', 100, 100, [160, 190], 'u'],
        ['200', 200, 200, [140, 170], 'u'],
        ['300–500', 300, 500, [130, 150], 'u'],
        ['1000', 1000, 1000, [100, 120], 'u'],
        ['2000', 2000, 2000, [80, 100], 'u'],
        ['3000+', 3000, INF, [70, 90], 'u'],
      ] },
    ],
  },
  {
    id: 'dtf',
    name: 'DTF-печать',
    products: [
      { id: 'cap', name: 'Бейсболки', kind: 'plain', cols: ['Цена'], rows: dtfColumn(0) },
      { id: 'tee', name: 'Футболки, логотип на груди до 10 см', kind: 'plain', cols: ['Цена'], rows: dtfColumn(1) },
      { id: 'area', name: 'Большой логотип (по площади)', kind: 'area', cols: ['Цена'], rows: [], warn: 'Тиражи до 50 шт. считаем индивидуально.' },
    ],
  },
]

/** Варианты пакетов: цена за штуку, 0 — пакеты клиента. */
export const BAG_OPTIONS = [
  { value: 0, label: 'Свои пакеты' },
  { value: 40, label: 'Наши, 25×36 см' },
  { value: 65, label: 'Наши, 38×50 см' },
]

/** Наценка за большой размер печати на текстиле (от 12 до 40 см). */
const BIG_PRINT_RATE = 1.15
/** Клише для тиснения: ₸ за см² площади логотипа, разово. */
const CLICHE_PER_CM2 = 300
/** DTF по площади: ₸ за см² + базовая цена за штуку. */
const DTF_AREA_PER_CM2 = 4
const DTF_AREA_BASE = 100

function rowTotal(row: PriceRow, qty: number, col: number) {
  return row[4] === 't' ? row[3][col] : row[3][col] * qty
}

/** Стоимость нанесения на весь тираж по одной колонке прайса. */
export function priceFor(rows: PriceRow[], qty: number, col: number): number {
  const exact = rows.find(row => qty >= row[1] && qty <= row[2])
  if (exact)
    return rowTotal(exact, qty, col)

  // тираж между ступенями — линейно между соседними точками
  const points: [number, number][] = []
  for (const row of rows) {
    points.push([row[1], rowTotal(row, row[1], col)])
    if (row[2] !== row[1] && row[2] !== INF)
      points.push([row[2], rowTotal(row, row[2], col)])
  }
  points.sort((a, b) => a[0] - b[0])

  if (qty < points[0][0])
    return points[0][1]

  for (let i = 0; i < points.length - 1; i++) {
    const [qa, pa] = points[i]
    const [qb, pb] = points[i + 1]
    if (qty > qa && qty < qb)
      return pa + (pb - pa) * (qty - qa) / (qb - qa)
  }

  return rowTotal(rows[rows.length - 1], qty, col)
}

/** «5×3», «5 x 3», «5,5*3» → площадь в см². */
export function parseArea(text: string): number {
  const match = String(text).replace(',', '.').match(/([\d.]+)\s*[x×х*]\s*([\d.]+)/i)
  return match ? Number.parseFloat(match[1]) * Number.parseFloat(match[2]) : 0
}

export function formatTenge(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₸`
}

export interface CalcInput {
  method: PriceMethod
  product: PriceProduct
  qty: number
  places: number
  colors: number
  bigPrint: boolean
  embossFoil: boolean
  clicheSize: string
  width: number
  height: number
  bagPrice: number
}

export interface CalcResult {
  total: number
  perItem: number
  lines: { label: string, value: string }[]
  tip: { qty: number, perItem: number } | null
  warn: string
  /** Короткое описание заказа для сообщения менеджеру */
  summary: string
}

export function calculate(input: CalcInput): CalcResult {
  const { method, product } = input
  const qty = Math.max(1, Math.floor(input.qty || 1))
  const places = Math.max(1, input.places || 1)
  const lines: CalcResult['lines'] = []
  let desc = product.name
  let base = 0
  let tip: CalcResult['tip'] = null

  if (product.kind === 'area') {
    const perItem = input.width * input.height * DTF_AREA_PER_CM2 + DTF_AREA_BASE
    base = perItem * qty
    desc += `, ${input.width}×${input.height} см`
  }
  else {
    let colors = 1
    let col = 0
    if (product.kind === 'tex') {
      colors = input.colors
      col = colors >= 2 ? 1 : 0
    }
    else if (product.kind === 'two' || product.kind === 'bags') {
      colors = Math.min(input.colors, 2)
      col = colors - 1
    }
    else if (product.kind === 'emb') {
      col = input.embossFoil ? 1 : 0
    }

    const big = product.kind === 'tex' && input.bigPrint
    const forQty = (n: number) => {
      let sum = priceFor(product.rows, n, col)
      // на текстиле каждый цвет сверх двух — плюс цена одного цвета
      if (product.kind === 'tex' && colors > 2)
        sum += priceFor(product.rows, n, 0) * (colors - 2)
      return big ? sum * BIG_PRINT_RATE : sum
    }

    base = forQty(qty)
    if (big)
      desc += ', до 40 см'
    if (product.cols.length > 1)
      desc += `, ${product.kind === 'emb' ? product.cols[col].toLowerCase() : `${colors} цв.`}`

    // подсказка: насколько дешевле на следующей ступени тиража
    const next = product.rows.find(row => row[1] > qty && row[4] === 'u')
    if (next) {
      const nextPerItem = forQty(next[1]) / next[1]
      if (nextPerItem < base / qty * 0.95)
        tip = { qty: next[1], perItem: nextPerItem }
    }
  }

  lines.push({ label: 'Нанесение', value: formatTenge(base) })
  let total = base

  if (places > 1) {
    const extra = base * (places - 1)
    total += extra
    lines.push({ label: `Мест нанесения: ${places}`, value: `+${formatTenge(extra)}` })
    desc += `, ${places} места`
  }

  if (product.kind === 'bags' && input.bagPrice) {
    const bags = input.bagPrice * qty
    total += bags
    lines.push({ label: 'Пакеты', value: formatTenge(bags) })
    desc += ', наши пакеты'
  }

  if (product.kind === 'emb') {
    const area = parseArea(input.clicheSize)
    if (area > 0) {
      const cliche = area * CLICHE_PER_CM2
      total += cliche
      lines.push({ label: 'Клише, разово', value: formatTenge(cliche) })
    }
  }

  let warn = product.warn ?? ''
  if (qty === 1)
    warn = `${warn ? `${warn} ` : ''}Это цена одного образца для проверки перед тиражом.`

  return {
    total,
    perItem: total / qty,
    lines,
    tip,
    warn,
    summary: `${method.name}: ${desc} — ${qty} шт.\nПредварительно: ${formatTenge(total)} (${formatTenge(total / qty)}/шт.)`,
  }
}

/** Кнопки быстрого выбора тиража. */
export function quickQuantities(product: PriceProduct): number[] {
  if (!product.rows.length)
    return [50, 100, 300, 1000]
  return product.rows.filter(row => row[1] > 1).map(row => row[1])
}
