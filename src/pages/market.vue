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

const isInitialLoading = computed(() => {
  return loading.value && items.value.length === 0
})

const isEmpty = computed(() => {
  return !loading.value && !error.value && items.value.length === 0
})

const shouldShowCatalog = computed(() => {
  return !error.value && (!isEmpty.value || isInitialLoading.value || items.value.length > 0)
})

const initialSkeletonItems = computed(() => {
  return isInitialLoading.value ? Array.from({ length: 6 }, (_, index) => `initial-${index}`) : []
})

const loadMoreSkeletonItems = computed(() => {
  return loadingMore.value && items.value.length > 0
    ? Array.from({ length: 3 }, (_, index) => `more-${index}`)
    : []
})

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
  <section class="p-6">
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
        <span v-if="!loading && !error">
          {{ total }} шт.
        </span>
      </div>
    </div>

    <p
      v-if="error"
      class="border border-red-500/30 rounded-xl bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </p>

    <div
      v-else-if="shouldShowCatalog"
      class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2"
    >
      <ProductSkeleton
        v-for="skeletonId in initialSkeletonItems"
        :key="skeletonId"
      />

      <ProductCard
        v-for="product in items"
        :key="product.id"
        :product="product"
      />

      <ProductSkeleton
        v-for="skeletonId in loadMoreSkeletonItems"
        :key="skeletonId"
      />
    </div>

    <div
      v-if="isEmpty"
      class="py-10 text-center text-sm opacity-60"
    >
      Товары не найдены
    </div>

    <div
      ref="loadMoreTrigger"
      class="h-10"
      aria-hidden="true"
    />

    <div
      v-if="!hasMore && items.length > 0"
      class="py-6 text-center text-sm opacity-60"
    >
      Больше товаров нет
    </div>
  </section>
</template>
