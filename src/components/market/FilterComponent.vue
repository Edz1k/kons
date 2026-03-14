<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { useMarketFilters } from '~/composables/market/useMarketFilters'

const {
  localSearch,
  categoryOptions,
  sortOptions,
  inStockOnlyModel,
  selectedCategoryObject,
  selectedSortObject,
  submitSearch,
  resetAll,
} = useMarketFilters()
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <input
      v-model="localSearch"
      placeholder="Поиск..."
      @keyup.enter="submitSearch"
    >
    <button @click="submitSearch">
      Найти
    </button>

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
