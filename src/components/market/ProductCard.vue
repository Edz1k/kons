<script setup lang="ts">
import type { Product } from '~/types/product'
import { computed } from 'vue'
import { fileUrl } from '~/services/directus'

const props = defineProps<{
  product: Product
}>()

const productLink = computed(() => `/product/${props.product.slug}`)
const variants = computed(() => props.product.product_variants ?? [])
const isPartnerProduct = computed(() => Boolean(props.product.is_partner))

const activeVariant = computed(() => {
  if (!variants.value.length)
    return null

  if (isPartnerProduct.value)
    return variants.value.find(variant => variant.is_default) ?? variants.value[0] ?? null

  const defaultVariant = variants.value.find(variant => variant.is_default)

  if (defaultVariant && defaultVariant.stock > 0)
    return defaultVariant

  const firstInStockVariant = variants.value.find(variant => variant.stock > 0)

  if (firstInStockVariant)
    return firstInStockVariant

  return defaultVariant ?? variants.value[0] ?? null
})

const imageUrl = computed(() => {
  const variantImage = activeVariant.value?.images?.[0]?.directus_files_id

  if (variantImage)
    return fileUrl(variantImage)

  const externalVariantImage = activeVariant.value?.external_images_urls?.[0]

  if (externalVariantImage)
    return externalVariantImage

  const productImage = props.product.images?.[0]?.directus_files_id

  if (productImage)
    return fileUrl(productImage)

  return props.product.preview_image ?? null
})

const isInStock = computed(() => {
  if (isPartnerProduct.value)
    return true

  if (!variants.value.length)
    return false

  return variants.value.some(variant => variant.stock > 0)
})

const badgeText = computed(() => {
  if (isPartnerProduct.value)
    return 'Под заказ'

  return isInStock.value ? 'В наличии' : 'Нет в наличии'
})

const stockClasses = computed(() => {
  if (isPartnerProduct.value)
    return 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30'

  return isInStock.value
    ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30'
    : 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30'
})

const dotClasses = computed(() => {
  if (isPartnerProduct.value)
    return 'bg-amber-500'

  return isInStock.value ? 'bg-emerald-500' : 'bg-rose-500'
})

function formatPrice(v?: string | number) {
  if (v === undefined || v === null || v === '')
    return ''

  const n = typeof v === 'string' ? Number(v) : v

  if (Number.isNaN(n))
    return String(v)

  return new Intl.NumberFormat('ru-RU').format(n)
}
</script>

<template>
  <RouterLink
    :to="productLink"
    class="group relative overflow-hidden border border-white/10 rounded-2xl bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1"
  >
    <div class="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
      <div class="absolute inset-0 from-black/30 via-transparent to-transparent bg-gradient-to-t" />
    </div>

    <div class="absolute left-3 top-3 z-10">
      <span
        class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md"
        :class="stockClasses"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="dotClasses"
        />
        {{ badgeText }}
      </span>
    </div>

    <div class="relative aspect-square w-full overflow-hidden">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        :alt="product.title"
        loading="lazy"
      >

      <div
        v-else
        class="h-full w-full flex items-center justify-center bg-white/5"
      >
        <div class="text-center">
          <div class="text-sm font-semibold opacity-80">
            Нет фото
          </div>
          <div class="mt-1 text-xs opacity-50">
            {{ product.slug }}
          </div>
        </div>
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <h3 class="line-clamp-2 text-lg font-semibold leading-snug">
          {{ product.title }}
        </h3>

        <span class="mt-1 shrink-0 text-xs opacity-50 transition group-hover:opacity-80">
          →
        </span>
      </div>

      <div class="mt-2 flex items-center justify-between">
        <div class="text-sm opacity-70">
          {{ product.category?.title || 'Brillex' }}
        </div>

        <div class="text-base font-bold tracking-tight">
          <span v-if="!isPartnerProduct">
            {{ formatPrice(product.price) }} ₸
          </span>

          <span v-else class="text-sm text-amber-600 font-medium">
            Цена по запросу
          </span>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div class="text-xs opacity-60">
          Нажмите, чтобы открыть
        </div>

        <div
          class="inline-flex items-center gap-2 border border-white/10 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold opacity-80 transition group-hover:border-white/20 group-hover:bg-white/10 group-hover:opacity-100"
        >
          Подробнее
          <span class="transition group-hover:translate-x-0.5">
            →
          </span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
