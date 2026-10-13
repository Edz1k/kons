<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProductsStore } from '~/stores/product'

const productsStore = useProductsStore()

const {
  categories,
  selectedCategory,
  loadingCategories,
} = storeToRefs(productsStore)

async function setCategory(value: string) {
  productsStore.setCategory(value)
  await productsStore.resetAndReload()
}

async function clearCategory() {
  productsStore.clearCategory()
  await productsStore.resetAndReload()
}
</script>

<template>
  <aside class="hidden lg:block">
    <div class="sticky top-28 border border-slate-200 rounded-[24px] bg-white p-5 shadow-xs">
      <div class="mb-4">
        <h2 class="text-lg text-navy font-extrabold">
          Категории
        </h2>
        <p class="mt-1 text-sm text-slate-400">
          Выберите раздел каталога
        </p>
      </div>

      <div class="max-h-[70vh] flex flex-col gap-2 overflow-y-auto pr-1">
        <button
          class="w-full rounded-2xl px-4 py-3 text-left text-sm transition"
          :class="selectedCategory === ''
            ? 'bg-primary text-white'
            : 'bg-slate-50 text-navy hover:bg-slate-100'"
          @click="clearCategory"
        >
          Все товары
        </button>

        <div v-if="loadingCategories" class="px-2 py-3 text-sm text-slate-400">
          Загрузка категорий...
        </div>

        <template v-else>
          <button
            v-for="category in categories"
            :key="category.id"
            class="w-full rounded-2xl px-4 py-3 text-left text-sm transition"
            :class="selectedCategory === category.slug
              ? 'bg-primary text-white'
              : 'bg-slate-50 text-navy hover:bg-slate-100'"
            @click="setCategory(category.slug)"
          >
            {{ category.title }}
          </button>
        </template>
      </div>
    </div>
  </aside>
</template>
