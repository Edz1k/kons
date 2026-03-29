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
    <div class="sticky top-28 border border-slate-200 rounded-[24px] bg-white p-5 shadow-sm">
      <div class="mb-4">
        <h2 class="text-lg text-primary font-800">
          Категории
        </h2>
        <p class="mt-1 text-sm text-muted">
          Выберите раздел каталога
        </p>
      </div>

      <div class="max-h-[70vh] flex flex-col gap-2 overflow-y-auto pr-1">
        <button
          class="w-full rounded-2xl px-4 py-3 text-left text-sm transition"
          :class="selectedCategory === ''
            ? 'bg-secondary text-white'
            : 'bg-slate-50 text-primary hover:bg-slate-100'"
          @click="clearCategory"
        >
          Все товары
        </button>

        <div v-if="loadingCategories" class="px-2 py-3 text-sm text-muted">
          Загрузка категорий...
        </div>

        <template v-else>
          <button
            v-for="category in categories"
            :key="category.id"
            class="w-full rounded-2xl px-4 py-3 text-left text-sm transition"
            :class="selectedCategory === category.slug
              ? 'bg-secondary text-white'
              : 'bg-slate-50 text-primary hover:bg-slate-100'"
            @click="setCategory(category.slug)"
          >
            {{ category.title }}
          </button>
        </template>
      </div>
    </div>
  </aside>
</template>
