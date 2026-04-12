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
  sortOptions,
  inStockOnlyModel,
  selectedSortObject,
  isOwnCatalog,
  submitSearch,
  resetAll,
} = useMarketFilters()
</script>

<template>
  <div class="border border-slate-200 rounded-[24px] bg-white p-4 shadow-sm md:p-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <input
            v-model="localSearch"
            type="text"
            placeholder="Поиск товаров..."
            class="w-full border border-slate-200 rounded-2xl bg-white px-4 py-3 pr-12 text-sm text-primary outline-none transition focus:border-secondary placeholder:text-slate-400 focus:ring-2 focus:ring-secondary/10"
            @keyup.enter="submitSearch"
          >
          <span class="i-mdi:magnify pointer-events-none absolute right-4 top-1/2 text-xl text-slate-400 -translate-y-1/2" />
        </div>

        <button
          class="inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-sm text-white font-semibold transition active:scale-[0.99] hover:opacity-90"
          @click="submitSearch"
        >
          Найти
        </button>
      </div>

      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Listbox v-model="selectedSortObject">
          <div class="relative min-w-[220px]">
            <ListboxButton class="w-full border border-slate-200 rounded-2xl bg-white px-4 py-3 text-left text-sm text-primary outline-none transition hover:border-slate-300 focus:ring-2 focus:ring-secondary/10">
              <span class="block truncate">
                {{ selectedSortObject.label }}
              </span>
            </ListboxButton>

            <ListboxOptions class="absolute z-30 mt-2 max-h-60 w-full overflow-auto border border-slate-200 rounded-2xl bg-white p-1 shadow-xl">
              <ListboxOption
                v-for="option in sortOptions"
                :key="option.value"
                v-slot="{ active, selected }"
                :value="option"
              >
                <li
                  class="cursor-pointer rounded-xl px-3 py-2 text-sm transition"
                  :class="[
                    active ? 'bg-slate-100' : '',
                    selected ? 'font-semibold text-primary' : 'text-slate-600',
                  ]"
                >
                  {{ option.label }}
                </li>
              </ListboxOption>
            </ListboxOptions>
          </div>
        </Listbox>

        <label
          v-if="isOwnCatalog"
          class="inline-flex items-center gap-3 border border-slate-200 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-primary"
        >
          <input
            v-model="inStockOnlyModel"
            type="checkbox"
            class="h-4 w-4 border-slate-300 rounded text-secondary focus:ring-secondary"
          >
          <span>Только в наличии</span>
        </label>

        <button
          class="border border-slate-200 rounded-2xl bg-white px-4 py-3 text-sm text-primary transition hover:bg-slate-50"
          @click="resetAll"
        >
          Сбросить
        </button>
      </div>
    </div>
  </div>
</template>
