import type { Category, Product } from '~/types/product'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchCategories, fetchProducts } from '~/services/directus'

const PAGE_SIZE = 12
const ALLOWED_SORTS = new Set(['default', 'price-asc', 'price-desc'])

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
  const sortBy = ref<'default' | 'price-asc' | 'price-desc'>('default')

  const page = ref(1)
  const limit = ref(PAGE_SIZE)
  const total = ref(0)
  const hasMore = ref(true)

  let activeRequestId = 0

  function normalizeSearch(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  function normalizeCategory(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  function normalizeSort(value: unknown): 'default' | 'price-asc' | 'price-desc' {
    if (typeof value !== 'string')
      return 'default'

    return ALLOWED_SORTS.has(value)
      ? (value as 'default' | 'price-asc' | 'price-desc')
      : 'default'
  }

  function normalizeInStock(value: unknown): boolean {
    return value === true || value === 'true'
  }

  function resetPaginationState() {
    page.value = 1
    total.value = 0
    hasMore.value = true
    items.value = []
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
    loadCategories,

    setSearch,
    setInStockOnly,
    setCategory,
    clearCategory,
    setSort,
    syncFromQuery,
    resetFilters,
  }
})
