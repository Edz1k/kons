import type { CalcInput } from '../src/utils/applicationPrice'
import { describe, expect, it } from 'vitest'
import { calculate, PRICE_METHODS } from '../src/utils/applicationPrice'

function must<T>(value: T | undefined, name: string): T {
  if (value === undefined)
    throw new Error(`нет в прайсе: ${name}`)
  return value
}

const uv = must(PRICE_METHODS.find(method => method.id === 'uv'), 'УФ-печать')
const pens = must(uv.products.find(product => product.id === 'small'), 'ручки')

function input(qty: number, overrides: Partial<CalcInput> = {}): CalcInput {
  return {
    method: uv,
    product: pens,
    qty,
    places: 1,
    colors: 1,
    bigPrint: false,
    embossFoil: false,
    clicheSize: '',
    width: 0,
    height: 0,
    bagPrice: 0,
    ...overrides,
  }
}

describe('калькулятор нанесения', () => {
  it('УФ-печать на 100 ручках: 160 ₸ за штуку, 16 000 ₸ всего (пример на сайте и в FAQ посадочных)', () => {
    const result = calculate(input(100))
    expect(result.perItem).toBe(160)
    expect(result.total).toBe(16000)
  })

  it('от 200 штук цена за штуку ниже: 140 ₸', () => {
    const result = calculate(input(200))
    expect(result.perItem).toBe(140)
    expect(result.total).toBe(28000)
  })

  it('тираж 0 или пустой считается как 1 штука, без деления на ноль', () => {
    const result = calculate(input(0))
    expect(Number.isFinite(result.total)).toBe(true)
    expect(Number.isFinite(result.perItem)).toBe(true)
    expect(result.total).toBeGreaterThan(0)
  })

  it('описание для менеджера без длинных тире и с тиражом', () => {
    const { summary } = calculate(input(100))
    expect(summary).toContain('УФ-печать')
    expect(summary).toContain('100 шт.')
    expect(summary).not.toContain('—')
  })

  it('каждый способ и изделие считаются без ошибок и дают конечную сумму', () => {
    for (const method of PRICE_METHODS) {
      for (const product of method.products) {
        const result = calculate(input(100, { method, product, width: 10, height: 10, clicheSize: '5×3', bagPrice: 0 }))
        expect(Number.isFinite(result.total), `${method.name} / ${product.name}`).toBe(true)
        expect(result.total, `${method.name} / ${product.name}`).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
