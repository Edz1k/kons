import type {
  LocationQueryValue,
  LocationQueryValueRaw,
} from 'vue-router'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '~/stores/product'

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined

export interface CategoryOption {
  slug: string
  title: string
}

export interface SortOption {
  value: string
  label: string
}

export function useMarketFilters() {
  const route = useRoute()
  const router = useRouter()
  const productsStore = useProductsStore()

  const { categories } = storeToRefs(productsStore)

  const categoryOptions = computed<CategoryOption[]>(() => [
    { slug: '', title: 'Все типы' },
    ...categories.value.map(category => ({
      slug: category.slug,
      title: category.title,
    })),
  ])

  const sortOptions: SortOption[] = [
    { value: 'default', label: 'По умолчанию' },
    { value: 'price-asc', label: 'Сначала дешёвые' },
    { value: 'price-desc', label: 'Сначала дорогие' },
  ]

  function normalizeQueryValue(value: QueryValue): string {
    if (typeof value === 'string')
      return value

    if (Array.isArray(value)) {
      const firstString = value.find(item => typeof item === 'string')
      return firstString ?? ''
    }

    return ''
  }

  function cleanupQuery(query: Record<string, unknown>) {
    const cleaned: Record<string, string> = {}

    Object.entries(query).forEach(([key, value]) => {
      if (typeof value !== 'string')
        return

      if (!value.trim())
        return

      cleaned[key] = value
    })

    return cleaned
  }

  function areQueriesEqual(
    a: Record<string, string>,
    b: Record<string, string>,
  ) {
    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()

    if (aKeys.length !== bKeys.length)
      return false

    return aKeys.every(key => a[key] === b[key])
  }

  function replaceQuery(next: Record<string, LocationQueryValueRaw | LocationQueryValueRaw[] | undefined>) {
    const merged: Record<string, unknown> = {
      ...route.query,
      ...next,
    }

    Object.keys(merged).forEach((key) => {
      if (merged[key] === undefined || merged[key] === '')
        delete merged[key]
    })

    const currentClean = cleanupQuery(route.query as Record<string, unknown>)
    const nextClean = cleanupQuery(merged)

    if (areQueriesEqual(currentClean, nextClean))
      return

    router.replace({
      query: nextClean,
    })
  }

  const localSearch = ref(normalizeQueryValue(route.query.search))

  watch(
    () => route.query.search,
    (value) => {
      const normalized = normalizeQueryValue(value)
      if (localSearch.value !== normalized)
        localSearch.value = normalized
    },
  )

  function submitSearch() {
    replaceQuery({
      search: localSearch.value.trim() || undefined,
    })
  }

  const inStockOnlyModel = computed<boolean>({
    get() {
      return route.query.inStock === 'true'
    },
    set(value) {
      replaceQuery({
        inStock: value ? 'true' : undefined,
      })
    },
  })

  const selectedCategoryObject = computed<CategoryOption>({
    get() {
      const currentCategory = normalizeQueryValue(route.query.category)

      return categoryOptions.value.find(item => item.slug === currentCategory)
        ?? categoryOptions.value[0]
    },
    set(value) {
      replaceQuery({
        category: value.slug || undefined,
      })
    },
  })

  const selectedSortObject = computed<SortOption>({
    get() {
      const currentSort = normalizeQueryValue(route.query.sort) || 'default'

      return sortOptions.find(item => item.value === currentSort)
        ?? sortOptions[0]
    },
    set(value) {
      replaceQuery({
        sort: value.value !== 'default' ? value.value : undefined,
      })
    },
  })

  function resetAll() {
    localSearch.value = ''

    router.replace({
      query: {},
    })
  }

  return {
    localSearch,
    categoryOptions,
    sortOptions,
    inStockOnlyModel,
    selectedCategoryObject,
    selectedSortObject,
    resetAll,
    submitSearch,
  }
}
