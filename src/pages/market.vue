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
  catalogType,
} = storeToRefs(productsStore)

const loadMoreTrigger = ref<HTMLElement | null>(null)

const {
  isReadyForInfiniteScroll,
  setCatalogType,
} = useMarketCatalog()

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
  return isInitialLoading.value
    ? Array.from({ length: 6 }, (_, index) => `initial-${index}`)
    : []
})

const loadMoreSkeletonItems = computed(() => {
  return loadingMore.value && items.value.length > 0
    ? Array.from({ length: 3 }, (_, index) => `more-${index}`)
    : []
})

const pageTitle = computed(() => {
  return catalogType.value === 'partner'
    ? 'Товары под заказ'
    : 'Товары в наличии'
})

const pageDescription = computed(() => {
  return catalogType.value === 'partner'
    ? 'Каталог партнёрских товаров под заказ. Используйте поиск и фильтры, чтобы быстрее найти нужную позицию.'
    : 'Каталог наших товаров. Используйте поиск и фильтры, чтобы быстрее найти нужную позицию.'
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
  <section class="bg-white px-4 py-6 lg:px-8 md:px-6">
    <div class="mx-auto max-w-7xl">
      <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl text-primary font-900 tracking-tight md:text-4xl">
            {{ pageTitle }}
          </h1>

          <p class="mt-2 max-w-2xl text-sm text-muted leading-6 md:text-base">
            {{ pageDescription }}
          </p>
        </div>

        <div class="text-sm text-muted">
          <span v-if="!loading && !error">
            {{ total }} шт.
          </span>
        </div>
      </div>

      <div class="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          :class="catalogType === 'own'
            ? 'bg-primary text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="setCatalogType('own')"
        >
          В наличии
        </button>

        <button
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          :class="catalogType === 'partner'
            ? 'bg-primary text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="setCatalogType('partner')"
        >
          Под заказ
        </button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-8">
        <CatalogSidebar />

        <div class="min-w-0">
          <FilterComponent class="mb-6" />

          <p
            v-if="error"
            class="border border-danger/20 rounded-2xl bg-danger/5 p-4 text-danger"
          >
            {{ error }}
          </p>

          <div
            v-else-if="shouldShowCatalog"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
            class="border border-slate-200 rounded-2xl bg-slate-50 py-12 text-center text-sm text-muted"
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
            class="py-6 text-center text-sm text-muted"
          >
            Больше товаров нет
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
