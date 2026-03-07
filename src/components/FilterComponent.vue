<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useProductsStore } from '~/stores/product'

const productsStore = useProductsStore()

const {
  search,
  inStockOnly,
  selectedCategory,
  categories,
  sortBy,
} = storeToRefs(productsStore)

const categoryOptions = computed(() => [
  { slug: '', title: 'Все типы' },
  ...categories.value,
])

const sortOptions = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешёвые' },
  { value: 'price-desc', label: 'Сначала дорогие' },
]

const selectedCategoryObject = computed({
  get() {
    return categoryOptions.value.find(item => item.slug === selectedCategory.value)
      ?? categoryOptions.value[0]
  },
  set(value) {
    selectedCategory.value = value.slug
  },
})

const selectedSortObject = computed({
  get() {
    return sortOptions.find(item => item.value === sortBy.value) ?? sortOptions[0]
  },
  set(value) {
    sortBy.value = value.value
  },
})
</script>

<template>
  <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <input
      v-model="search"
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
                selected ? 'text-white font-semibold' : 'text-white/80',
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
                selected ? 'text-white font-semibold' : 'text-white/80',
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
        v-model="inStockOnly"
        type="checkbox"
      >
      Только в наличии
    </label>

    <button
      class="border border-white/10 rounded-xl bg-white/5 px-4 py-2 text-sm"
      @click="productsStore.resetFilters"
    >
      Сбросить
    </button>
  </div>
</template>
