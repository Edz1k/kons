import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '~/stores/product'

export function useMarketCatalog() {
  const route = useRoute()
  const productsStore = useProductsStore()

  const { initialized } = storeToRefs(productsStore)

  const isBootstrapping = ref(false)
  const isReadyForInfiniteScroll = ref(false)

  const normalizedRouteState = computed(() => ({
    category: typeof route.query.category === 'string'
      ? route.query.category
      : '',
    sort: typeof route.query.sort === 'string'
      ? route.query.sort
      : 'default',
    search: typeof route.query.search === 'string'
      ? route.query.search.trim()
      : '',
    inStockOnly: route.query.inStock === 'true',
  }))

  async function applyRouteAndReload() {
    productsStore.syncFromQuery(route.query)
    await productsStore.restoreOrReload()
  }

  async function initMarketCatalog() {
    if (isBootstrapping.value)
      return

    isBootstrapping.value = true

    try {
      await productsStore.loadCategories()
      await applyRouteAndReload()
      isReadyForInfiniteScroll.value = true
    }
    finally {
      isBootstrapping.value = false
    }
  }

  watch(
    normalizedRouteState,
    async () => {
      if (!initialized.value)
        return

      await applyRouteAndReload()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    },
  )

  onMounted(async () => {
    await initMarketCatalog()
  })

  return {
    isReadyForInfiniteScroll,
  }
}
