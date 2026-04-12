import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '~/stores/product'

export function useMarketCatalog() {
  const route = useRoute()
  const router = useRouter()
  const productsStore = useProductsStore()

  const {
    loading,
    loadingMore,
    initialized,
    search,
    inStockOnly,
    selectedCategory,
    sortBy,
    catalogType,
  } = storeToRefs(productsStore)

  function buildQuery() {
    const query: Record<string, string> = {}

    if (catalogType.value && catalogType.value !== 'own')
      query.type = catalogType.value

    if (selectedCategory.value)
      query.category = selectedCategory.value

    if (sortBy.value !== 'default')
      query.sort = sortBy.value

    if (search.value)
      query.search = search.value

    if (inStockOnly.value)
      query.inStock = 'true'

    return query
  }

  async function updateRouteQuery() {
    const nextQuery = buildQuery()
    const currentQuery = route.query

    const isSame
      = String(currentQuery.type ?? '') === String(nextQuery.type ?? '')
        && String(currentQuery.category ?? '') === String(nextQuery.category ?? '')
        && String(currentQuery.sort ?? '') === String(nextQuery.sort ?? '')
        && String(currentQuery.search ?? '') === String(nextQuery.search ?? '')
        && String(currentQuery.inStock ?? '') === String(nextQuery.inStock ?? '')

    if (isSame)
      return

    await router.replace({
      query: nextQuery,
    })
  }

  async function applyQueryToStore() {
    productsStore.syncFromQuery(route.query as Record<string, unknown>)
    await productsStore.loadCategories(true)
    await productsStore.restoreOrReload()
  }

  async function setCatalogType(type: 'own' | 'partner') {
    if (catalogType.value === type)
      return

    await productsStore.setCatalogType(type)
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  async function setCategory(categorySlug: string) {
    productsStore.setCategory(categorySlug)
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  async function clearCategory() {
    productsStore.clearCategory()
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  async function setSort(sort: 'default' | 'price-asc' | 'price-desc') {
    productsStore.setSort(sort)
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  async function setSearch(searchValue: string) {
    productsStore.setSearch(searchValue)
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  async function setInStockOnly(value: boolean) {
    productsStore.setInStockOnly(value)
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  async function resetFilters() {
    productsStore.resetFilters()
    await updateRouteQuery()
    await productsStore.resetAndReload()
  }

  watch(
    () => route.query,
    async () => {
      productsStore.syncFromQuery(route.query as Record<string, unknown>)
      await productsStore.loadCategories(true)
      await productsStore.restoreOrReload()
    },
    { immediate: true },
  )

  const isReadyForInfiniteScroll = computed(() => {
    return initialized.value && !loading.value && !loadingMore.value
  })

  return {
    isReadyForInfiniteScroll,

    updateRouteQuery,
    setCatalogType,
    setCategory,
    clearCategory,
    setSort,
    setSearch,
    setInStockOnly,
    resetFilters,
    applyQueryToStore,
  }
}
