<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '~/stores/product'

const route = useRoute()
const productsStore = useProductsStore()

const {
  filteredItems,
  loading,
  error,
} = storeToRefs(productsStore)

function syncFiltersFromRoute() {
  const category = typeof route.query.category === 'string'
    ? route.query.category
    : ''

  productsStore.setCategory(category)
}

onMounted(async () => {
  if (!productsStore.items.length)
    await productsStore.loadProducts()

  syncFiltersFromRoute()
})

watch(
  () => route.query.category,
  () => {
    syncFiltersFromRoute()
  },
)
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          Каталог
        </h1>
        <p class="mt-1 text-sm opacity-70">
          Выберите товар — откроется страница с деталями.
        </p>
        <FilterComponent />
      </div>

      <div class="text-sm opacity-60">
        <span v-if="!loading && !error">{{ filteredItems.length }} шт.</span>
      </div>
    </div>

    <p v-if="error" class="border border-red-500/30 rounded-xl bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </p>

    <div v-else-if="loading" class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2">
      <div
        v-for="i in 6"
        :key="i"
        class="animate-pulse overflow-hidden border border-white/10 rounded-2xl bg-white/5"
      >
        <div class="h-56 w-full bg-white/10" />
        <div class="p-4 space-y-2">
          <div class="h-4 w-2/3 rounded bg-white/10" />
          <div class="h-3 w-1/3 rounded bg-white/10" />
          <div class="h-4 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2">
      <FadeComponent
        v-for="(p, index) in filteredItems"
        :key="p.id"
        :delay="index * 50"
      >
        <ProductCard :product="p" />
      </FadeComponent>
    </div>
  </div>
</template>
