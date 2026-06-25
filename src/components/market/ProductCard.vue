<script setup lang="ts">
import type { Product } from '~/types/product'
import { computed } from 'vue'
import { fileUrl } from '~/services/directus'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  product: Product
}>()

const authStore = useAuthStore()

const productLink = computed(() => `/product/${props.product.slug}`)
const variants = computed(() => props.product.product_variants ?? [])
const isPartnerProduct = computed(() => Boolean(props.product.is_partner))

const visibleColorOptions = computed(() => {
  const options = variants.value
    .filter(variant => isPartnerProduct.value || variant.stock > 0)
    .map((variant) => {
      const label = variant.color?.name
        ?? variant.variation_description
        ?? variant.sku
        ?? 'Вариант'

      return {
        key: String(variant.color?.id ?? variant.color?.slug ?? variant.id),
        label,
        hex: variant.color?.hex,
      }
    })

  const uniqueOptions = new Map<string, typeof options[number]>()

  options.forEach((option) => {
    const key = option.hex
      ? `hex:${option.hex.toLowerCase()}`
      : `label:${option.label.toLowerCase()}`

    if (!uniqueOptions.has(key))
      uniqueOptions.set(key, option)
  })

  return Array.from(uniqueOptions.values())
})

const colorPreviewOptions = computed(() => visibleColorOptions.value.slice(0, 6))
const hiddenColorsCount = computed(() => Math.max(visibleColorOptions.value.length - colorPreviewOptions.value.length, 0))

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

const discountedPrice = computed(() => {
  if (isPartnerProduct.value || !authStore.hasDiscount)
    return null

  const price = Number(props.product.price ?? 0)

  if (Number.isNaN(price) || price <= 0)
    return null

  return Math.round(price * (100 - authStore.discountPercent) / 100)
})

function formatPrice(v?: string | number) {
  if (v === undefined || v === null || v === '')
    return ''

  const n = typeof v === 'string' ? Number(v) : v

  if (Number.isNaN(n))
    return String(v)

  return new Intl.NumberFormat('ru-RU').format(n)
}

function getColorOptionStyle(hex?: string) {
  if (!hex)
    return { background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)' }

  return { background: hex }
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
          <div v-if="!isPartnerProduct" class="text-right">
            <template v-if="discountedPrice !== null">
              <div class="text-xs line-through opacity-45">
                {{ formatPrice(product.price) }} ₸
              </div>
              <div class="text-secondary">
                {{ formatPrice(discountedPrice) }} ₸
              </div>
            </template>

            <span v-else>
              {{ formatPrice(product.price) }} ₸
            </span>
          </div>

          <span v-else class="text-sm text-amber-600 font-medium">
            Цена по запросу
          </span>
        </div>
      </div>

      <div
        v-if="visibleColorOptions.length"
        class="mt-4 min-h-8 flex items-center justify-between gap-3 border border-white/10 rounded-xl bg-white/5 px-3 py-2"
      >
        <div class="min-w-0 text-xs font-medium opacity-70">
          {{ visibleColorOptions.length === 1 ? '1 цвет' : `${visibleColorOptions.length} цветов` }}
        </div>

        <div class="flex shrink-0 items-center">
          <span
            v-for="option in colorPreviewOptions"
            :key="option.key"
            class="h-5 w-5 border border-white/70 rounded-full shadow-sm ring-1 ring-black/10 -ml-1 first:ml-0"
            :style="getColorOptionStyle(option.hex)"
            :title="option.label"
          />

          <span
            v-if="hiddenColorsCount"
            class="h-5 min-w-5 border border-white/40 rounded-full bg-black/70 px-1.5 text-center text-[10px] text-white font-semibold leading-5 ring-1 ring-black/10 -ml-1"
            :title="`Еще ${hiddenColorsCount}`"
          >
            +{{ hiddenColorsCount }}
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
