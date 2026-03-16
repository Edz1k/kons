<script setup lang="ts">
import type { Product, ProductVariant } from '~/types/product'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchProductBySlug, fileUrl } from '~/services/directus'

defineOptions({
  name: 'ProductDetailPage',
})

const route = useRoute()

const slug = computed(() => {
  const params = route.params

  if (!('slug' in params))
    return ''

  const value = params.slug
  return String(Array.isArray(value) ? value[0] : value ?? '')
})

const item = ref<Product | null>(null)
const selectedVariant = ref<ProductVariant | null>(null)
const loading = ref(true)
const error = ref('')
const modalRef = ref()

const variants = computed<ProductVariant[]>(() => {
  return item.value?.product_variants ?? []
})

function getInitialVariant(productVariants: ProductVariant[]): ProductVariant | null {
  if (!productVariants.length)
    return null

  const defaultVariant = productVariants.find(variant => variant.is_default)

  if (defaultVariant && defaultVariant.stock > 0)
    return defaultVariant

  const firstInStockVariant = productVariants.find(variant => variant.stock > 0)

  if (firstInStockVariant)
    return firstInStockVariant

  return defaultVariant ?? productVariants[0] ?? null
}

const currentVariant = computed<ProductVariant | null>(() => {
  return selectedVariant.value ?? getInitialVariant(variants.value)
})

const currentImageId = computed<string | null>(() => {
  return currentVariant.value?.image
    ?? item.value?.images?.[0]?.directus_files_id
    ?? null
})

const currentSku = computed(() => currentVariant.value?.sku ?? '')
const currentStock = computed(() => currentVariant.value?.stock ?? 0)
const isInStock = computed(() => currentStock.value > 0)

function selectVariant(variant: ProductVariant) {
  selectedVariant.value = variant
}

async function load() {
  loading.value = true
  error.value = ''
  item.value = null
  selectedVariant.value = null

  try {
    if (!slug.value) {
      error.value = 'Некорректный slug товара'
      return
    }

    const product = await fetchProductBySlug(slug.value)

    if (!product) {
      error.value = 'Товар не найден'
      return
    }

    item.value = product
    selectedVariant.value = getInitialVariant(product.product_variants ?? [])
  }
  catch (e: any) {
    error.value = e?.message ?? 'Ошибка загрузки товара'
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
watch(slug, load)
</script>

<template>
  <section class="min-h-screen bg-white px-4 py-8 text-black lg:px-8 sm:px-6">
    <div class="mx-auto max-w-7xl">
      <div class="mb-8 flex items-center gap-2 text-sm text-black/50">
        <RouterLink
          to="/market"
          class="transition hover:text-black"
        >
          Каталог
        </RouterLink>
        <span>/</span>
        <span class="truncate text-black/80">
          {{ item?.title || 'Товар' }}
        </span>
      </div>

      <div v-if="loading" class="min-h-[60vh] flex items-center justify-center">
        <div class="text-sm text-black/40 tracking-[0.25em] uppercase">
          Загрузка товара...
        </div>
      </div>

      <div
        v-else-if="error"
        class="min-h-[60vh] flex flex-col items-center justify-center text-center"
      >
        <p class="mb-4 text-lg text-red-500 font-medium">
          {{ error }}
        </p>

        <RouterLink
          to="/market"
          class="border border-black rounded-full px-6 py-3 text-sm font-medium transition hover:bg-black hover:text-white"
        >
          Вернуться в каталог
        </RouterLink>
      </div>

      <div
        v-else-if="item"
        class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
      >
        <div>
          <div class="overflow-hidden rounded-[28px] bg-[#f5f5f5]">
            <img
              v-if="currentImageId"
              :src="fileUrl(currentImageId)"
              :alt="item.title"
              class="h-[420px] w-full object-cover lg:h-[720px] md:h-[560px]"
            >

            <div
              v-else
              class="h-[420px] flex items-center justify-center text-sm text-black/30 tracking-[0.2em] uppercase lg:h-[720px] md:h-[560px]"
            >
              Нет изображения
            </div>
          </div>
        </div>

        <div>
          <div class="border-b border-black/10 pb-6">
            <div class="mb-3">
              <p class="text-xs text-black/45 tracking-[0.3em] uppercase">
                Brillex
              </p>
            </div>

            <h1 class="text-3xl font-bold leading-tight lg:text-5xl md:text-4xl">
              {{ item.title }}
            </h1>

            <div class="mt-5 text-2xl font-semibold md:text-3xl">
              {{ item.price }} ₸
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <div
                v-if="currentSku"
                class="rounded-full bg-black/[0.05] px-3 py-2 text-sm text-black/70"
              >
                Артикул: <span class="text-black font-medium">{{ currentSku }}</span>
              </div>

              <div
                class="rounded-full px-3 py-2 text-sm"
                :class="isInStock
                  ? 'bg-green-500/10 text-green-700'
                  : 'bg-red-500/10 text-red-600'"
              >
                {{ isInStock
                  ? `Остаток: ${currentStock} шт.`
                  : 'Нет в наличии' }}
              </div>
            </div>

            <div
              v-if="item.category?.title"
              class="mt-4 text-sm text-black/55"
            >
              Категория: {{ item.category.title }}
            </div>

            <div
              v-if="variants.length"
              class="mt-6"
            >
              <p class="mb-3 text-sm text-black/55">
                Цвет
              </p>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="variant in variants"
                  :key="variant.id"
                  type="button"
                  class="h-8 w-8 border rounded-full transition"
                  :style="{ background: variant.color.hex }"
                  :class="currentVariant?.id === variant.id
                    ? 'border-black scale-110'
                    : 'border-black/20'"
                  @click="selectVariant(variant)"
                />
              </div>
            </div>
          </div>

          <div class="grid gap-3 border-b border-black/10 py-6">
            <div class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4">
              <span class="text-sm text-black/50">Бренд</span>
              <span class="text-right text-sm font-medium">Brillex</span>
            </div>

            <div class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4">
              <span class="text-sm text-black/50">Статус</span>
              <span class="text-right text-sm font-medium">
                {{ isInStock ? 'Доступен к заказу' : 'Временно отсутствует' }}
              </span>
            </div>

            <div
              v-if="currentVariant?.color?.name"
              class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4"
            >
              <span class="text-sm text-black/50">Выбранный цвет</span>
              <span class="text-right text-sm font-medium">
                {{ currentVariant.color.name }}
              </span>
            </div>

            <div
              v-if="item.category?.title"
              class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4"
            >
              <span class="text-sm text-black/50">Категория</span>
              <span class="text-right text-sm font-medium">
                {{ item.category.title }}
              </span>
            </div>

            <div>
              <button
                class="mt-4 w-full rounded-xl bg-secondary py-3 text-white transition-colors duration-300 disabled:cursor-not-allowed hover:bg-primary disabled:opacity-60"
                :disabled="!isInStock"
                @click="modalRef?.openModal()"
              >
                {{ isInStock ? 'Оставить заявку' : 'Нет в наличии' }}
              </button>
            </div>
          </div>

          <div class="pt-6">
            <h2 class="mb-4 text-lg font-semibold md:text-xl">
              Описание
            </h2>

            <div
              v-if="item.description"
              class="max-w-none prose prose-headings:font-semibold prose-p:leading-7"
              v-html="item.description"
            />
            <p v-else class="text-black/50 leading-7">
              Описание пока не добавлено.
            </p>
          </div>
        </div>
      </div>
    </div>

    <LeadsComponent ref="modalRef" />
  </section>
</template>
