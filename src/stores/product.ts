import type { Product } from '~/types/product'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchProducts } from '~/services/directus'

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const loading = ref(false)
  const error = ref('')

  const search = ref('')
  const inStockOnly = ref(false)
  const selectedCategory = ref('')
  const sortBy = ref('default')

  async function loadProducts() {
    loading.value = true
    error.value = ''

    try {
      items.value = await fetchProducts()
    }
    catch (e: any) {
      error.value = e?.message ?? String(e)
    }
    finally {
      loading.value = false
    }
  }

  const categories = computed(() => {
    const unique = new Map<string, string>()

    for (const item of items.value) {
      if (item.category?.slug && item.category?.title) {
        unique.set(item.category.slug, item.category.title)
      }
    }

    return Array.from(unique, ([slug, title]) => ({
      slug,
      title,
    }))
  })

  const filteredItems = computed(() => {
    let result = [...items.value]

    result = result.filter((product) => {
      const normalizedSearch = search.value.trim().toLowerCase()

      const matchesSearch = normalizedSearch
        ? product.title.toLowerCase().includes(normalizedSearch)
        : true

      const matchesStock = inStockOnly.value
        ? product.stock_quantity > 0
        : true

      const matchesCategory = selectedCategory.value
        ? product.category?.slug === selectedCategory.value
        : true

      return matchesSearch && matchesStock && matchesCategory
    })

    if (sortBy.value === 'price-asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    }
    else if (sortBy.value === 'price-desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    }

    return result
  })

  function setCategory(category: string) {
    selectedCategory.value = category || ''
  }

  function clearCategory() {
    selectedCategory.value = ''
  }

  function setSort(sort: string) {
    sortBy.value = sort || 'default'
  }

  function setSearch(value: string) {
    search.value = value || ''
  }

  function setInStockOnly(value: boolean) {
    inStockOnly.value = value
  }

  function syncFromQuery(query: Record<string, unknown>) {
    selectedCategory.value = typeof query.category === 'string'
      ? query.category
      : ''

    sortBy.value = typeof query.sort === 'string'
      ? query.sort
      : 'default'

    search.value = typeof query.search === 'string'
      ? query.search
      : ''

    inStockOnly.value = query.inStock === 'true'
  }

  function resetFilters() {
    search.value = ''
    inStockOnly.value = false
    selectedCategory.value = ''
    sortBy.value = 'default'
  }

  return {
    items,
    loading,
    error,

    search,
    inStockOnly,
    selectedCategory,
    sortBy,

    categories,
    filteredItems,

    loadProducts,

    setCategory,
    clearCategory,
    setSort,
    setSearch,
    setInStockOnly,
    syncFromQuery,
    resetFilters,
  }
})
