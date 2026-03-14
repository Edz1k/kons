<script setup lang="ts">
import type { LocationQueryValue, LocationQueryValueRaw } from 'vue-router'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { watchDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '~/stores/product'

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined

interface CategoryOption {
  slug: string
  title: string
}

interface SortOption {
  value: string
  label: string
}

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

watchDebounced(
  localSearch,
  (value) => {
    replaceQuery({
      search: value.trim() || undefined,
    })
  },
  {
    debounce: 400,
    maxWait: 800,
  },
)

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
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <input
      v-model="localSearch"
      type="text"
      placeholder="Поиск по названию..."
      class="min-w-[220px] border border-white/10 rounded-xl bg-white/5 px-4 py-2 outline-none"
    >

    <Listbox v-model="selectedCategoryObject">
      <div class="relative min-w-[220px]">
        <ListboxButton class="w-full border border-white/10 rounded-xl bg-white/5 px-4 py-2 text-left outline-none">
          {{ selectedCategoryObject.title }}
        </ListboxButton>

        <ListboxOptions class="absolute z-20 mt-2 max-h-60 w-full overflow-auto border border-white/10 rounded-xl bg-zinc-900 p-1 shadow-lg">
          <ListboxOption
            v-for="category in categoryOptions"
            :key="category.slug || 'all'"
            v-slot="{ active, selected }"
            :value="category"
          >
            <li
              class="cursor-pointer rounded-lg px-3 py-2"
              :class="[
                active ? 'bg-white/10' : '',
                selected ? 'font-semibold text-white' : 'text-white/80',
              ]"
            >
              {{ category.title }}
            </li>
          </ListboxOption>
        </ListboxOptions>
      </div>
    </Listbox>

    <Listbox v-model="selectedSortObject">
      <div class="relative min-w-[220px]">
        <ListboxButton class="w-full border border-white/10 rounded-xl bg-white/5 px-4 py-2 text-left outline-none">
          {{ selectedSortObject.label }}
        </ListboxButton>

        <ListboxOptions class="absolute z-20 mt-2 max-h-60 w-full overflow-auto border border-white/10 rounded-xl bg-zinc-900 p-1 shadow-lg">
          <ListboxOption
            v-for="option in sortOptions"
            :key="option.value"
            v-slot="{ active, selected }"
            :value="option"
          >
            <li
              class="cursor-pointer rounded-lg px-3 py-2"
              :class="[
                active ? 'bg-white/10' : '',
                selected ? 'font-semibold text-white' : 'text-white/80',
              ]"
            >
              {{ option.label }}
            </li>
          </ListboxOption>
        </ListboxOptions>
      </div>
    </Listbox>

    <label class="flex items-center gap-2 text-sm">
      <input
        v-model="inStockOnlyModel"
        type="checkbox"
      >
      Только в наличии
    </label>

    <button
      class="border border-white/10 rounded-xl bg-white/5 px-4 py-2 text-sm"
      @click="resetAll"
    >
      Сбросить
    </button>
  </div>
</template>
