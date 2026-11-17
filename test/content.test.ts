import { describe, expect, it } from 'vitest'
import { CATALOG_SECTIONS, findCatalogSection } from '../src/data/catalogSections'
import { LANDING_LINKS, LANDINGS } from '../src/data/landings'

describe('подборки каталога /katalog', () => {
  it('слаги уникальны и подходят для адреса', () => {
    const slugs = CATALOG_SECTIONS.map(section => section.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs)
      expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('у каждой подборки есть категории, заголовок и описание для поиска', () => {
    for (const section of CATALOG_SECTIONS) {
      expect(section.own.length + section.partner.length, section.slug).toBeGreaterThan(0)
      expect(section.h1.length, section.slug).toBeGreaterThan(0)
      expect(section.seoTitle.length, section.slug).toBeLessThanOrEqual(70)
      expect(section.seoDescription.length, section.slug).toBeLessThanOrEqual(170)
    }
  })

  it('findCatalogSection находит существующую и не находит чужую подборку', () => {
    expect(findCatalogSection('ruchki')?.h1).toBe('Ручки с логотипом')
    expect(findCatalogSection('net-takoy')).toBeUndefined()
  })
})

describe('посадочные страницы', () => {
  const landings = Object.values(LANDINGS)

  it('адреса и источники заявок уникальны', () => {
    expect(new Set(landings.map(l => l.path)).size).toBe(landings.length)
    expect(new Set(landings.map(l => l.source)).size).toBe(landings.length)
  })

  it('подвал ссылается только на существующие посадочные и на все', () => {
    const paths = landings.map(l => l.path)
    expect(LANDING_LINKS.map(link => link.to).sort()).toEqual([...paths].sort())
  })

  it('ссылки из карточек ведут в существующие подборки каталога', () => {
    for (const landing of landings) {
      for (const idea of landing.ideas) {
        if (!idea.to)
          continue
        const slug = idea.to.replace('/katalog/', '')
        expect(findCatalogSection(slug), `${landing.path}: ${idea.to}`).toBeDefined()
      }
    }
  })

  it('описания для поиска не длиннее 170 символов, в текстах нет длинных тире', () => {
    for (const landing of landings) {
      expect(landing.seo.description.length, landing.path).toBeLessThanOrEqual(170)
      const text = [landing.title, landing.titleAccent, landing.lead, ...landing.ideas.map(i => i.text), ...landing.faq.map(f => f.a)].join(' ')
      expect(text, landing.path).not.toContain('—')
    }
  })

  it('цены и условия не выдуманы: блоки пустые, пока их не заполнят', () => {
    for (const landing of landings) {
      for (const offer of landing.offers)
        expect(offer.priceFrom, landing.path).toMatch(/\d/)
    }
  })
})
