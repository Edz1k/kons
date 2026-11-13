<script setup lang="ts">
import type { Product, ProductVariant } from '~/types/product'
import { computed, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { SITE_NAME, SITE_URL, toSnippet, useJsonLd, usePageSeo } from '~/composables/usePageSeo'
import { fetchProductBySlug, fileUrl, IMAGE_WIDTH, resizeAssetUrl, SHARE_IMAGE, shareImageUrl } from '~/services/directus'
import { useAuthStore } from '~/stores/auth'
import { useProductPageStore } from '~/stores/productPage'
import { useReservationsStore } from '~/stores/reservations'
import { formatReservedUntil, formatTimeLeft, variantAvailableStock, variantReservedQty } from '~/utils/stock'

defineOptions({
  name: 'ProductDetailPage',
})

const route = useRoute()
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()
const productPageStore = useProductPageStore()

/** Заготовка для товаров, добавленных после сборки сайта (см. netlify.toml). */
const SHELL_SLUG = '__shell'

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
const reserveModalRef = ref()
const reservationError = ref('')

// Возвращаемся в каталог с теми же фильтрами (категория, поиск, сортировка),
// если пришли на товар оттуда.
// history.state обновляется роутером после setup, поэтому читаем в onMounted.
const catalogLink = ref('/market')

onMounted(() => {
  const back = window.history.state?.back
  if (typeof back === 'string' && back.startsWith('/market'))
    catalogLink.value = back
})

const variants = computed<ProductVariant[]>(() => item.value?.product_variants ?? [])
const isPartnerProduct = computed(() => Boolean(item.value?.is_partner))

function sortImages<T extends { sort?: number | null }>(images: T[] = []): T[] {
  return [...images].sort((a, b) => {
    const aSort = typeof a.sort === 'number' ? a.sort : Number.POSITIVE_INFINITY
    const bSort = typeof b.sort === 'number' ? b.sort : Number.POSITIVE_INFINITY
    return aSort - bSort
  })
}

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

  const directusImages = sortImages(variant.images)
    ?.map(image => image.directus_files_id)
    .filter(Boolean)
    .map(id => fileUrl(id, { width: IMAGE_WIDTH.gallery })) ?? []

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

  const directusImages = sortImages(product.images)
    ?.map(image => image.directus_files_id)
    .filter(Boolean)
    .map(id => fileUrl(id, { width: IMAGE_WIDTH.gallery })) ?? []

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

/** Остаток за вычетом активных резервов — именно его можно купить сейчас. */
const currentStock = computed<number | null>(() => {
  if (isPartnerProduct.value)
    return null

  if (currentVariant.value)
    return variantAvailableStock(currentVariant.value)

  return item.value?.in_stock ? 1 : 0
})

const currentReservedQty = computed(() => variantReservedQty(currentVariant.value))

const reservedUntilText = computed(() =>
  formatReservedUntil(currentVariant.value?.reserved_until, true),
)

/** Резерв текущего пользователя на выбранный вариант, если он есть. */
const myReservation = computed(() =>
  reservationsStore.reservationForVariant(currentVariant.value?.id ?? null),
)

const myReservationTimeLeft = computed(() =>
  formatTimeLeft(myReservation.value?.expires_at, reservationsStore.now),
)

const myReservationUntilText = computed(() =>
  formatReservedUntil(myReservation.value?.expires_at, true),
)

const reservedByOthersQty = computed(() =>
  Math.max(0, currentReservedQty.value - (myReservation.value?.quantity ?? 0)),
)

const canReserve = computed(() =>
  !isPartnerProduct.value && Number(currentStock.value ?? 0) > 0,
)

const isInStock = computed(() => {
  if (isPartnerProduct.value)
    return true

  return Number(currentStock.value ?? 0) > 0
})

const restockDateText = computed(() => {
  if (isInStock.value || !currentVariant.value?.restock_date)
    return ''

  const date = new Date(currentVariant.value.restock_date)

  if (Number.isNaN(date.getTime()))
    return currentVariant.value.restock_date

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
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

const discountedCurrentPrice = computed<number | null>(() => {
  if (currentPrice.value === null || !authStore.hasDiscount)
    return null

  return Math.round(currentPrice.value * (100 - authStore.discountPercent) / 100)
})

const stockBadgeText = computed(() => {
  if (isPartnerProduct.value)
    return 'Под заказ'

  if (isInStock.value)
    return `Остаток: ${currentStock.value} шт.`

  if (currentReservedQty.value > 0) {
    return reservedUntilText.value
      ? `В резерве до ${reservedUntilText.value}`
      : 'В резерве'
  }

  return restockDateText.value
    ? `Ожидается ${restockDateText.value}`
    : 'Нет в наличии'
})

const stockBadgeClasses = computed(() => {
  if (isPartnerProduct.value)
    return 'bg-amber-500/10 text-amber-700'

  if (isInStock.value)
    return 'bg-green-500/10 text-green-700'

  if (currentReservedQty.value > 0)
    return 'bg-blue-500/10 text-blue-700'

  return 'bg-red-500/10 text-red-600'
})

const productStatusText = computed(() => {
  if (isPartnerProduct.value)
    return 'Под заказ'

  if (isInStock.value)
    return 'Доступен к заказу'

  if (currentReservedQty.value > 0) {
    return reservedUntilText.value
      ? `В резерве до ${reservedUntilText.value}`
      : 'В резерве'
  }

  return restockDateText.value
    ? `Снова в наличии ${restockDateText.value}`
    : 'Временно отсутствует'
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

function applyProduct(product: Product, keepSelection = false) {
  const previousVariantId = keepSelection ? selectedVariant.value?.id : null
  const previousImage = keepSelection ? selectedImage.value : null

  item.value = product
  error.value = ''

  const variantsList = product.product_variants ?? []
  selectedVariant.value = (previousVariantId !== null && previousVariantId !== undefined
    ? variantsList.find(variant => variant.id === previousVariantId)
    : null) ?? getInitialVariant(variantsList)

  const images = getVariantImages(selectedVariant.value)
  const fallbackImage = images[0] ?? getProductImages(product)[0] ?? null
  selectedImage.value = previousImage && [...images, ...getProductImages(product)].includes(previousImage)
    ? previousImage
    : fallbackImage
}

/**
 * silent — обновить данные (остатки, резервы) без крутилки, оставив выбранный цвет и фото.
 * Так обновляется страница, которая пришла уже готовой из сборки.
 */
async function load(options: { silent?: boolean } = {}) {
  const silent = options.silent && Boolean(item.value)

  if (!silent) {
    loading.value = true
    error.value = ''
    item.value = null
    selectedVariant.value = null
    selectedImage.value = null
  }

  try {
    if (!slug.value || slug.value === SHELL_SLUG) {
      loading.value = false
      return
    }

    const product = await fetchProductBySlug(slug.value)
    productPageStore.set(slug.value, product)

    if (!product) {
      item.value = null
      error.value = 'Товар не найден'
      return
    }

    applyProduct(product, silent)
  }
  catch (e: any) {
    if (!silent)
      error.value = e?.message ?? 'Ошибка загрузки товара'
  }
  finally {
    loading.value = false
  }
}

function openReserveModal() {
  if (!item.value)
    return

  reservationError.value = ''

  reserveModalRef.value?.openModal({
    productId: item.value.id,
    productTitle: item.value.title,
    variantId: currentVariant.value?.id ?? null,
    variantName: currentVariant.value ? getVariantLabel(currentVariant.value) : '',
    sku: currentSku.value,
    availableStock: currentStock.value ?? 0,
    price: discountedCurrentPrice.value ?? currentPrice.value,
  })
}

async function handleReserved() {
  await load()
}

async function cancelMyReservation() {
  const reservation = myReservation.value

  if (!reservation)
    return

  reservationError.value = ''

  try {
    await reservationsStore.cancel(reservation.id)
    await load()
  }
  catch (e) {
    reservationError.value = e instanceof Error
      ? e.message
      : 'Не удалось отменить резерв'
  }
}

watch(currentVariant, () => {
  if (!currentImages.value.includes(selectedImage.value ?? ''))
    setInitialImage()
})

// Товар, уже загруженный при сборке страницы: показываем сразу, без крутилки.
const prefetched = productPageStore.bySlug[slug.value]

if (prefetched) {
  applyProduct(prefetched)
  loading.value = false
}
else if (prefetched === null) {
  error.value = 'Товар не найден'
  loading.value = false
}

// Сборка (SSG): грузим товар на сервере — он попадёт в готовый HTML и в состояние для браузера.
onServerPrefetch(async () => {
  if (slug.value && slug.value !== SHELL_SLUG && !(slug.value in productPageStore.bySlug))
    await load()
})

onMounted(() => {
  // готовую страницу только освежаем (остатки и резервы меняются после сборки)
  if (item.value)
    load({ silent: true })
  else if (slug.value)
    load()

  reservationsStore.load()
})

// --- SEO ---

const seoDescription = computed(() => {
  const product = item.value

  if (!product)
    return ''

  const price = currentPrice.value
  const parts = [
    product.description
      ? toSnippet(product.description, 110).replace(/([^.!?…])$/, '$1.')
      : `${product.title.trim()} с нанесением логотипа.`,
    price ? `Цена от ${formatPrice(price)} ₸.` : '',
    isPartnerProduct.value ? 'Под заказ.' : (isInStock.value ? 'В наличии в Алматы.' : ''),
  ]

  return parts.filter(Boolean).join(' ')
})

/**
 * Картинка для превью ссылки: первое фото варианта, который открывается по умолчанию
 * (иначе фото товара). Своё фото — JPG 1200×630 из Directus, у партнёров — их JPG как есть.
 */
const shareImage = computed(() => {
  const product = item.value

  if (!product)
    return null

  const variant = getInitialVariant(variants.value)
  const fileId = sortImages(variant?.images ?? [])[0]?.directus_files_id
    ?? sortImages(product.images ?? [])[0]?.directus_files_id

  if (fileId)
    return { url: shareImageUrl(fileId), ...SHARE_IMAGE }

  const external = variant?.external_images_urls?.find(Boolean) ?? product.preview_image

  return external ? { url: external } : null
})

usePageSeo(() => {
  if (slug.value === SHELL_SLUG)
    return { title: 'Товар', noindex: true }

  if (!item.value)
    return { title: error.value ? 'Товар не найден' : 'Товар', noindex: Boolean(error.value) }

  return {
    title: `${item.value.title.trim()} с логотипом — купить в Алматы`,
    description: seoDescription.value,
    image: shareImage.value?.url ?? null,
    imageWidth: shareImage.value && 'width' in shareImage.value ? shareImage.value.width : undefined,
    imageHeight: shareImage.value && 'height' in shareImage.value ? shareImage.value.height : undefined,
    imageType: shareImage.value && 'type' in shareImage.value ? shareImage.value.type : undefined,
    type: 'product',
  }
})

useJsonLd('product', () => {
  const product = item.value

  if (!product)
    return null

  const url = `${SITE_URL}/product/${product.slug}`
  const images = [...new Set([
    ...getProductImages(product),
    ...variants.value.flatMap(variant => getVariantImages(variant)),
  ])].slice(0, 6)

  // У партнёрских товаров цену на сайте не показываем (в данных — цена поставщика),
  // поэтому и в разметку её не отдаём: только свои товары с нашей ценой в тенге.
  const offers = variants.value.length && !isPartnerProduct.value
    ? variants.value.map((variant) => {
        const price = Number(variant.price ?? product.price ?? 0)
        const stock = variantAvailableStock(variant)

        return {
          '@type': 'Offer',
          'sku': variant.sku || undefined,
          'name': variant.color?.name ? `${product.title.trim()} (${variant.color.name})` : undefined,
          'price': price || undefined,
          'priceCurrency': 'KZT',
          'availability': stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url,
        }
      }).filter(offer => offer.price)
    : []

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.title.trim(),
    'description': toSnippet(product.description || seoDescription.value, 500),
    'image': images,
    'sku': currentSku.value || undefined,
    'category': product.category?.title,
    'brand': { '@type': 'Brand', 'name': SITE_NAME },
    url,
    ...(offers.length ? { offers } : {}),
  }
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
          :to="catalogLink"
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
          :to="catalogLink"
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
                :src="resizeAssetUrl(imageUrl, IMAGE_WIDTH.galleryThumb)"
                :alt="item.title"
                class="h-24 w-full object-cover"
                loading="lazy"
              >
            </button>
          </div>
        </div>

        <div>
          <div class="border-b border-black/10 pb-6">
            <h1 class="text-3xl font-bold leading-tight lg:text-5xl md:text-4xl lg:leading-none md:leading-10">
              {{ item.title }}
            </h1>

            <div
              v-if="!isPartnerProduct && currentPrice !== null"
              class="mt-5 text-2xl font-semibold md:text-3xl"
            >
              <template v-if="discountedCurrentPrice !== null">
                <div class="text-base text-black/40 line-through">
                  {{ formatPrice(currentPrice) }} ₸
                </div>
                <div class="text-primary">
                  {{ formatPrice(discountedCurrentPrice) }} ₸
                </div>
              </template>

              <template v-else>
                {{ formatPrice(currentPrice) }} ₸
              </template>
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

            <div
              v-if="myReservation"
              class="mt-4 border border-blue-500/25 rounded-2xl bg-blue-500/5 p-4"
            >
              <div class="flex items-center gap-2 text-sm text-blue-700 font-semibold">
                <div class="icon-[mdi--bookmark-check] text-lg" />
                Вы зарезервировали {{ myReservation.quantity }} шт.
              </div>

              <p class="mt-2 text-sm text-black/60 leading-6">
                Резерв действует до {{ myReservationUntilText }}
                <template v-if="myReservationTimeLeft">
                  — осталось {{ myReservationTimeLeft }}
                </template>
              </p>

              <button
                type="button"
                class="mt-3 w-full border border-black/15 rounded-xl bg-white py-2.5 text-sm font-medium transition disabled:cursor-not-allowed hover:bg-black/5 disabled:opacity-60"
                :disabled="reservationsStore.saving"
                @click="cancelMyReservation"
              >
                Отменить резерв
              </button>
            </div>

            <div
              v-else-if="!isPartnerProduct && reservedByOthersQty > 0 && !isInStock"
              class="mt-4 border border-blue-500/25 rounded-2xl bg-blue-500/5 px-4 py-3 text-sm text-blue-700 leading-6"
            >
              Товар зарезервирован другим клиентом<template v-if="reservedUntilText">
                до {{ reservedUntilText }}
              </template>.
              Оставьте заявку — сообщим, если резерв снимут.
            </div>

            <div
              v-if="reservationError"
              class="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600"
            >
              {{ reservationError }}
            </div>

            <div class="grid mt-4 gap-2">
              <button
                v-if="!isPartnerProduct"
                class="w-full rounded-xl bg-primary py-3 text-white transition-colors duration-300 disabled:cursor-not-allowed hover:bg-navy disabled:opacity-60"
                :disabled="!canReserve || Boolean(myReservation)"
                @click="openReserveModal"
              >
                {{ myReservation ? 'Уже в вашем резерве' : 'Зарезервировать на 3 дня' }}
              </button>

              <button
                class="w-full border border-black/15 rounded-xl bg-white py-3 text-black transition-colors duration-300 disabled:cursor-not-allowed hover:bg-black/5 disabled:opacity-60"
                :class="isPartnerProduct ? 'bg-primary text-white border-transparent hover:bg-navy' : ''"
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
    <ReserveModal ref="reserveModalRef" @reserved="handleReserved" />
  </section>
</template>
