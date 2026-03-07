<script setup lang="ts">
import type { Product } from '~/types/product'
import { computed } from 'vue'
import { fileUrl } from '~/services/directus'

const props = defineProps<{
  product: Product
}>()

const productLink = computed(() => `/product/${props.product.slug}`)

const imageId = computed(() => props.product.images?.[0]?.directus_files_id)

const imageUrl = computed(() =>
  imageId.value ? fileUrl(imageId.value) : null,
)

const isInStock = computed(() => props.product.in_stock)

const stockClasses = computed(() =>
  isInStock.value
    ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
    : 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30',
)

const dotClasses = computed(() =>
  isInStock.value ? 'bg-emerald-300' : 'bg-rose-300',
)

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
    <!-- hover gradient -->
    <div class="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
      <div class="absolute inset-0 from-black/30 via-transparent to-transparent bg-gradient-to-t" />
    </div>

    <!-- stock badge -->
    <div class="absolute left-3 top-3 z-10">
      <span
        class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md"
        :class="stockClasses"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="dotClasses"
        />
        {{ isInStock ? 'В наличии' : 'Нет в наличии' }}
      </span>
    </div>

    <!-- image -->
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

    <!-- content -->
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
          Артикул:
          <span class="opacity-90">
            {{ product.slug }}
          </span>
        </div>

        <div
          v-if="product.price !== undefined"
          class="text-base font-bold tracking-tight"
        >
          {{ formatPrice(product.price) }} ₸
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
