import { describe, expect, it } from 'vitest'
import { dropBrokenTags } from '~/services/directus'

describe('описания партнёров', () => {
  it('вырезает незакрытый тег, текст оставляет', () => {
    expect(dropBrokenTags('Текст.\n<p style="white-space: pre-wrap"\nПеред началом')).toBe('Текст.\n\nПеред началом')
  })

  it('нормальный HTML и знак «меньше» не трогает', () => {
    const html = '<ul><li>Цвет: Белый</li></ul> 5 < 6 и <b>жирный</b>'
    expect(dropBrokenTags(html)).toBe(html)
  })

  it('пустое описание остаётся пустым', () => {
    expect(dropBrokenTags(undefined)).toBeUndefined()
  })
})
