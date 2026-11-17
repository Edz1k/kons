import type { CatalogSectionPage } from '~/services/directus'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Товары подборок /katalog/<slug>, загруженные при сборке (SSG).
 * Состояние pinia попадает в HTML: в браузере страница сразу показывает товары
 * и совпадает с готовой разметкой, а поисковик видит их без JavaScript.
 */
export const useCatalogSectionStore = defineStore('catalogSection', () => {
  const bySlug = ref<Record<string, CatalogSectionPage & { partnerPage: number }>>({})

  function set(slug: string, page: CatalogSectionPage, partnerPage = 1) {
    bySlug.value[slug] = { ...page, partnerPage }
  }

  function appendPartner(slug: string, page: CatalogSectionPage, partnerPage: number) {
    const current = bySlug.value[slug]

    if (!current) {
      set(slug, page, partnerPage)
      return
    }

    current.partner = [...current.partner, ...page.partner]
    current.partnerTotal = page.partnerTotal
    current.partnerPage = partnerPage
  }

  return { bySlug, set, appendPartner }
})
