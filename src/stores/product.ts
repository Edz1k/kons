import type { Category, Product } from '~/types/product'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchCategories, fetchProducts } from '~/services/directus'

const PAGE_SIZE = 12
const MAX_CACHE_SIZE = 10
const ALLOWED_SORTS = new Set(['default', 'price-asc', 'price-desc'])

type SortValue = 'default' | 'price-asc' | 'price-desc'

interface CatalogSnapshot {
  items: Product[]
  page: number
  total: number
  hasMore: boolean
}

interface CatalogFiltersSnapshot {
  search: string
  inStockOnly: boolean
  selectedCategory: string
  sortBy: SortValue
}

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const categories = ref<Category[]>([])

  const loading = ref(false)
  const loadingMore = ref(false)
  const loadingCategories = ref(false)
  const initialized = ref(false)
  const error = ref('')

  const search = ref('')
  const inStockOnly = ref(false)
  const selectedCategory = ref('')
  const sortBy = ref<SortValue>('default')

  const page = ref(1)
  const limit = ref(PAGE_SIZE)
  const total = ref(0)
  const hasMore = ref(true)

  const catalogCache = ref<Record<string, CatalogSnapshot>>({})

  let activeRequestId = 0

  function normalizeSearch(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  function normalizeCategory(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  function normalizeSort(value: unknown): SortValue {
    if (typeof value !== 'string')
      return 'default'

    return ALLOWED_SORTS.has(value)
      ? (value as SortValue)
      : 'default'
  }

  function normalizeInStock(value: unknown): boolean {
    return value === true || value === 'true'
  }

  function getCurrentFiltersSnapshot(): CatalogFiltersSnapshot {
    return {
      search: search.value,
      inStockOnly: inStockOnly.value,
      selectedCategory: selectedCategory.value,
      sortBy: sortBy.value,
    }
  }

  function getCatalogKey(filters: CatalogFiltersSnapshot = getCurrentFiltersSnapshot()): string {
    return JSON.stringify(filters)
  }

  function resetPaginationState() {
    page.value = 1
    total.value = 0
    hasMore.value = true
    items.value = []
  }

  function applySnapshot(snapshot: CatalogSnapshot) {
    items.value = snapshot.items
    page.value = snapshot.page
    total.value = snapshot.total
    hasMore.value = snapshot.hasMore
  }

  function createCurrentSnapshot(): CatalogSnapshot {
    return {
      items: [...items.value],
      page: page.value,
      total: total.value,
      hasMore: hasMore.value,
    }
  }

  function saveCurrentStateToCache() {
    const key = getCatalogKey()

    // если ключ уже есть — удаляем
    if (catalogCache.value[key]) {
      delete catalogCache.value[key]
    }

    // добавляем заново (становится самым "новым")
    catalogCache.value[key] = createCurrentSnapshot()

    const keys = Object.keys(catalogCache.value)

    if (keys.length > MAX_CACHE_SIZE) {
      const oldestKey = keys[0]
      delete catalogCache.value[oldestKey]
    }
  }

  function restoreFromCache(): boolean {
    const key = getCatalogKey()
    const snapshot = catalogCache.value[key]

    if (!snapshot)
      return false

    applySnapshot({
      items: [...snapshot.items],
      page: snapshot.page,
      total: snapshot.total,
      hasMore: snapshot.hasMore,
    })

    initialized.value = true
    error.value = ''

    return true
  }

  function clearCatalogCache() {
    catalogCache.value = {}
  }

  async function loadProducts(reset = false) {
    if (loading.value || loadingMore.value)
      return

    if (reset)
      resetPaginationState()

    if (!hasMore.value)
      return

    const requestId = ++activeRequestId
    const isFirstPage = page.value === 1

    if (isFirstPage)
      loading.value = true
    else
      loadingMore.value = true

    error.value = ''
    try {
      const response = await fetchProducts({
        page: page.value,
        limit: limit.value,
        category: selectedCategory.value,
        search: search.value,
        inStockOnly: inStockOnly.value,
        sortBy: sortBy.value,
      })

      if (requestId !== activeRequestId)
        return

      if (isFirstPage)
        items.value = response.items
      else
        items.value = [...items.value, ...response.items]

      total.value = response.total
      hasMore.value = response.hasMore

      if (response.items.length > 0)
        page.value += 1

      initialized.value = true

      saveCurrentStateToCache()
    }
    catch (e: unknown) {
      if (requestId !== activeRequestId)
        return

      error.value = e instanceof Error ? e.message : String(e)
    }
    finally {
      if (requestId === activeRequestId) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  async function loadNextPage() {
    if (!hasMore.value)
      return

    await loadProducts(false)
  }

  async function resetAndReload() {
    await loadProducts(true)
  }

  async function restoreOrReload() {
    const restored = restoreFromCache()

    if (restored)
      return

    await resetAndReload()
  }

  async function loadCategories() {
    if (loadingCategories.value)
      return

    if (categories.value.length)
      return

    loadingCategories.value = true

    try {
      categories.value = await fetchCategories()
    }
    catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    }
    finally {
      loadingCategories.value = false
    }
  }

  function setSearch(value: unknown) {
    search.value = normalizeSearch(value)
  }

  function setInStockOnly(value: unknown) {
    inStockOnly.value = normalizeInStock(value)
  }

  function setCategory(value: unknown) {
    selectedCategory.value = normalizeCategory(value)
  }

  function clearCategory() {
    selectedCategory.value = ''
  }

  function setSort(value: unknown) {
    sortBy.value = normalizeSort(value)
  }

  function syncFromQuery(query: Record<string, unknown>) {
    selectedCategory.value = normalizeCategory(query.category)
    sortBy.value = normalizeSort(query.sort)
    search.value = normalizeSearch(query.search)
    inStockOnly.value = normalizeInStock(query.inStock)
  }

  function resetFilters() {
    search.value = ''
    inStockOnly.value = false
    selectedCategory.value = ''
    sortBy.value = 'default'
  }

  const loadedCount = computed(() => items.value.length)

  return {
    items,
    categories,

    loading,
    loadingMore,
    loadingCategories,
    initialized,
    error,

    search,
    inStockOnly,
    selectedCategory,
    sortBy,

    page,
    limit,
    total,
    hasMore,
    loadedCount,

    loadProducts,
    loadNextPage,
    resetAndReload,
    restoreOrReload,
    loadCategories,

    setSearch,
    setInStockOnly,
    setCategory,
    clearCategory,
    setSort,
    syncFromQuery,
    resetFilters,

    restoreFromCache,
    saveCurrentStateToCache,
    clearCatalogCache,
  }
})
