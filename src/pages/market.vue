<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useInfiniteScrollTrigger } from '~/composables/market/useInfiniteScrollTrigger'
import { useMarketCatalog } from '~/composables/market/useMarketProducts'
import { useProductsStore } from '~/stores/product'

const productsStore = useProductsStore()

const {
  items,
  loading,
  loadingMore,
  error,
  total,
  hasMore,
  initialized,
} = storeToRefs(productsStore)

const loadMoreTrigger = ref<HTMLElement | null>(null)

const { isReadyForInfiniteScroll } = useMarketCatalog()

useInfiniteScrollTrigger({
  target: loadMoreTrigger,
  enabled: isReadyForInfiniteScroll,
  loading,
  loadingMore,
  hasMore,
  initialized,
  itemsCount: computed(() => items.value.length),
  onLoadMore: () => productsStore.loadNextPage(),
  rootMargin: '300px',
})
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

        <FilterComponent class="mt-4" />
      </div>

      <div class="text-sm opacity-60">
        <span v-if="!loading && !error">{{ total }} шт.</span>
      </div>
    </div>

    <p
      v-if="error"
      class="border border-red-500/30 rounded-xl bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </p>

    <div
      v-else-if="loading && !items.length"
      class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2"
    >
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

    <div
      v-else
      class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2"
    >
      <ProductCard
        v-for="product in items"
        :key="product.id"
        :product="product"
      />
    </div>

    <div
      v-if="!loading && !error && !items.length"
      class="py-10 text-center text-sm opacity-60"
    >
      Товары не найдены
    </div>

    <div
      v-if="loadingMore"
      class="grid grid-cols-1 gap-4 pt-4 lg:grid-cols-3 sm:grid-cols-2"
    >
      <div
        v-for="i in 3"
        :key="`more-${i}`"
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

    <div
      ref="loadMoreTrigger"
      class="h-10"
      aria-hidden="true"
    />

    <div
      v-if="!hasMore && items.length"
      class="py-6 text-center text-sm opacity-60"
    >
      Больше товаров нет
    </div>
  </div>
</template>
