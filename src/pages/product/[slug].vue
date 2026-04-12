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
const selectedImage = ref<string | null>(null)

const loading = ref(true)
const error = ref('')
const modalRef = ref()

const variants = computed<ProductVariant[]>(() => item.value?.product_variants ?? [])
const isPartnerProduct = computed(() => Boolean(item.value?.is_partner))

function getInitialVariant(productVariants: ProductVariant[]): ProductVariant | null {
  if (!productVariants.length)
    return null

  if (isPartnerProduct.value)
    return productVariants.find(variant => variant.is_default) ?? productVariants[0] ?? null

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

function getVariantImages(variant: ProductVariant | null): string[] {
  if (!variant)
    return []

  const directusImages = variant.images
    ?.map(image => image.directus_files_id)
    .filter(Boolean)
    .map(id => fileUrl(id)) ?? []

  if (directusImages.length)
    return directusImages

  const externalImages = variant.external_images_urls?.filter(Boolean) ?? []

  if (externalImages.length)
    return externalImages

  return []
}

function getProductImages(product: Product | null): string[] {
  if (!product)
    return []

  const directusImages = product.images
    ?.map(image => image.directus_files_id)
    .filter(Boolean)
    .map(id => fileUrl(id)) ?? []

  if (directusImages.length)
    return directusImages

  if (product.preview_image)
    return [product.preview_image]

  return []
}

const currentImages = computed<string[]>(() => {
  const variantImages = getVariantImages(currentVariant.value)

  if (variantImages.length)
    return variantImages

  return getProductImages(item.value)
})

const currentImageUrl = computed<string | null>(() => {
  if (selectedImage.value && currentImages.value.includes(selectedImage.value))
    return selectedImage.value

  return currentImages.value[0] ?? null
})

const currentSku = computed(() => {
  return currentVariant.value?.sku
    ?? item.value?.external_id
    ?? ''
})

const currentStock = computed<number | null>(() => {
  if (isPartnerProduct.value)
    return null

  if (typeof currentVariant.value?.stock === 'number')
    return currentVariant.value.stock

  return item.value?.in_stock ? 1 : 0
})

const isInStock = computed(() => {
  if (isPartnerProduct.value)
    return true

  return Number(currentStock.value ?? 0) > 0
})

const currentPrice = computed<number | null>(() => {
  if (isPartnerProduct.value)
    return null

  const variantPrice = currentVariant.value?.price

  if (typeof variantPrice === 'number' && !Number.isNaN(variantPrice))
    return variantPrice

  const basePrice = Number(item.value?.price ?? 0)
  return Number.isNaN(basePrice) ? null : basePrice
})

const stockBadgeText = computed(() => {
  if (isPartnerProduct.value)
    return 'Под заказ'

  return isInStock.value
    ? `Остаток: ${currentStock.value} шт.`
    : 'Нет в наличии'
})

const stockBadgeClasses = computed(() => {
  if (isPartnerProduct.value)
    return 'bg-amber-500/10 text-amber-700'

  return isInStock.value
    ? 'bg-green-500/10 text-green-700'
    : 'bg-red-500/10 text-red-600'
})

const productStatusText = computed(() => {
  if (isPartnerProduct.value)
    return 'Под заказ'

  return isInStock.value ? 'Доступен к заказу' : 'Временно отсутствует'
})

const actionButtonText = computed(() => {
  if (isPartnerProduct.value)
    return 'Оставить заявку'

  return isInStock.value ? 'Оставить заявку' : 'Нет в наличии'
})

const isActionDisabled = computed(() => {
  if (isPartnerProduct.value)
    return false

  return !isInStock.value
})

function getColorStyle(variant: ProductVariant) {
  if (variant.color?.hex)
    return { background: variant.color.hex }

  return { background: '#ccc' }
}

function getVariantLabel(variant: ProductVariant) {
  return variant.color?.name
    ?? variant.variation_description
    ?? variant.sku
    ?? 'Вариант'
}

function setInitialImage() {
  selectedImage.value = currentImages.value[0] ?? null
}

function selectVariant(variant: ProductVariant) {
  selectedVariant.value = variant

  const variantImages = getVariantImages(variant)

  if (variantImages.length) {
    selectedImage.value = variantImages[0]
    return
  }

  const productImages = getProductImages(item.value)
  selectedImage.value = productImages[0] ?? null
}

function formatPrice(value?: number | string) {
  if (value === undefined || value === null || value === '')
    return ''

  const numericValue = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(numericValue))
    return String(value)

  return new Intl.NumberFormat('ru-RU').format(numericValue)
}

async function load() {
  loading.value = true
  error.value = ''
  item.value = null
  selectedVariant.value = null
  selectedImage.value = null

  try {
    if (!slug.value) {
      loading.value = false
      return
    }

    const product = await fetchProductBySlug(slug.value)

    if (!product) {
      error.value = 'Товар не найден'
      return
    }

    item.value = product
    selectedVariant.value = getInitialVariant(product.product_variants ?? [])

    const initialVariantImages = getVariantImages(selectedVariant.value)

    if (initialVariantImages.length)
      selectedImage.value = initialVariantImages[0]
    else
      selectedImage.value = getProductImages(product)[0] ?? null
  }
  catch (e: any) {
    error.value = e?.message ?? 'Ошибка загрузки товара'
  }
  finally {
    loading.value = false
  }
}

watch(currentVariant, () => {
  if (!currentImages.value.includes(selectedImage.value ?? ''))
    setInitialImage()
})

onMounted(() => {
  if (slug.value)
    load()
})

watch(slug, (value) => {
  if (value)
    load()
})
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
              v-if="currentImageUrl"
              :src="currentImageUrl"
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

          <div
            v-if="currentImages.length > 1"
            class="grid grid-cols-4 mt-4 gap-3 sm:grid-cols-5"
          >
            <button
              v-for="imageUrl in currentImages"
              :key="imageUrl"
              type="button"
              class="overflow-hidden border rounded-2xl bg-[#f5f5f5] transition"
              :class="currentImageUrl === imageUrl
                ? 'border-black'
                : 'border-black/10 hover:border-black/30'"
              @click="selectedImage = imageUrl"
            >
              <img
                :src="imageUrl"
                :alt="item.title"
                class="h-24 w-full object-cover"
              >
            </button>
          </div>
        </div>

        <div>
          <div class="border-b border-black/10 pb-6">
            <h1 class="text-3xl font-bold leading-tight lg:text-5xl md:text-4xl">
              {{ item.title }}
            </h1>

            <div
              v-if="!isPartnerProduct && currentPrice !== null"
              class="mt-5 text-2xl font-semibold md:text-3xl"
            >
              {{ formatPrice(currentPrice) }} ₸
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
                :class="stockBadgeClasses"
              >
                {{ stockBadgeText }}
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
                {{ isPartnerProduct ? 'Варианты' : 'Цвет' }}
              </p>

              <div
                v-if="isPartnerProduct"
                class="flex flex-wrap gap-2"
              >
                <button
                  v-for="variant in variants"
                  :key="variant.id"
                  type="button"
                  class="border rounded-full px-4 py-2 text-sm transition"
                  :class="currentVariant?.id === variant.id
                    ? 'border-black bg-black text-white'
                    : 'border-black/15 bg-white text-black hover:border-black/35'"
                  @click="selectVariant(variant)"
                >
                  {{ getVariantLabel(variant) }}
                </button>
              </div>

              <div
                v-else
                class="flex flex-wrap gap-2"
              >
                <button
                  v-for="variant in variants"
                  :key="variant.id"
                  type="button"
                  class="group relative h-8 min-w-8 border rounded-full px-2 transition"
                  :style="getColorStyle(variant)"
                  :class="currentVariant?.id === variant.id
                    ? 'border-black scale-110'
                    : 'border-black/20'"
                  :title="getVariantLabel(variant)"
                  @click="selectVariant(variant)"
                >
                  <span
                    v-if="!variant.color?.hex"
                    class="absolute left-1/2 top-full z-10 mt-2 hidden whitespace-nowrap rounded-lg bg-black px-2 py-1 text-xs text-white group-hover:block -translate-x-1/2"
                  >
                    {{ getVariantLabel(variant) }}
                  </span>
                </button>
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
                {{ productStatusText }}
              </span>
            </div>

            <div
              v-if="currentVariant && getVariantLabel(currentVariant)"
              class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4"
            >
              <span class="text-sm text-black/50">
                {{ isPartnerProduct ? 'Выбранный вариант' : 'Выбранный цвет' }}
              </span>
              <span class="text-right text-sm font-medium">
                {{ getVariantLabel(currentVariant) }}
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
                :disabled="isActionDisabled"
                @click="modalRef?.openModal({
                  productTitle: item.title,
                  variantName: getVariantLabel(currentVariant || {} as ProductVariant),
                  sku: currentSku,
                  maxQuantity: isPartnerProduct ? undefined : currentStock ?? 0,
                })"
              >
                {{ actionButtonText }}
              </button>
            </div>
          </div>

          <div class="pt-6">
            <h2 class="mb-4 text-lg font-semibold md:text-xl">
              Описание
            </h2>

            <div
              v-if="item.description"
              class="max-w-none whitespace-normal break-words prose prose-headings:font-semibold prose-p:leading-7"
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
