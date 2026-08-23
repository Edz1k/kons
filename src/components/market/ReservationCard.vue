<script setup lang="ts">
import type { Product, ProductVariant } from '~/types/product'
import type { Reservation, ReservationStatus } from '~/types/reservation'
import { computed } from 'vue'
import { fileUrl } from '~/services/directus'
import { isReservationActive } from '~/stores/reservations'
import { formatTimeLeft } from '~/utils/stock'

const props = defineProps<{
  reservation: Reservation
  now: number
  busy?: boolean
}>()

const emit = defineEmits<{
  cancel: [id: number]
}>()

const STATUS_LABELS: Record<ReservationStatus, string> = {
  active: 'Активен',
  confirmed: 'Покупка подтверждена',
  cancelled: 'Отменён',
  expired: 'Срок истёк',
}

const STATUS_CLASSES: Record<ReservationStatus, string> = {
  active: 'bg-blue-500/10 text-blue-700',
  confirmed: 'bg-emerald-500/10 text-emerald-700',
  cancelled: 'bg-slate-500/10 text-slate-600',
  expired: 'bg-rose-500/10 text-rose-600',
}

const product = computed<Product | null>(() => {
  const value = props.reservation.product

  return value && typeof value === 'object' ? value as Product : null
})

const variant = computed<ProductVariant | null>(() => {
  const value = props.reservation.variant

  return value && typeof value === 'object' ? value as ProductVariant : null
})

const isActive = computed(() => isReservationActive(props.reservation, props.now))

const statusLabel = computed(() => {
  if (props.reservation.status === 'active' && !isActive.value)
    return STATUS_LABELS.expired

  return STATUS_LABELS[props.reservation.status] ?? props.reservation.status
})

const statusClasses = computed(() => {
  if (props.reservation.status === 'active' && !isActive.value)
    return STATUS_CLASSES.expired

  return STATUS_CLASSES[props.reservation.status] ?? STATUS_CLASSES.cancelled
})

function sortImages<T extends { sort?: number | null }>(images: T[] = []): T[] {
  return [...images].sort((a, b) => {
    const aSort = typeof a.sort === 'number' ? a.sort : Number.POSITIVE_INFINITY
    const bSort = typeof b.sort === 'number' ? b.sort : Number.POSITIVE_INFINITY
    return aSort - bSort
  })
}

const imageUrl = computed(() => {
  const variantImage = sortImages(variant.value?.images)?.[0]?.directus_files_id

  if (variantImage)
    return fileUrl(variantImage)

  const productImage = sortImages(product.value?.images)?.[0]?.directus_files_id

  return productImage ? fileUrl(productImage) : null
})

const variantLabel = computed(() =>
  variant.value?.color?.name ?? variant.value?.sku ?? '',
)

const timeLeft = computed(() => formatTimeLeft(props.reservation.expires_at, props.now))

const expiresText = computed(() => {
  const date = new Date(props.reservation.expires_at)

  if (Number.isNaN(date.getTime()))
    return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

const totalPrice = computed(() => {
  const price = Number(props.reservation.price_at_reserve ?? 0)

  if (!price || Number.isNaN(price))
    return ''

  return `${new Intl.NumberFormat('ru-RU').format(price * props.reservation.quantity)} ₸`
})
</script>

<template>
  <div class="flex flex-col gap-4 border border-slate-200 rounded-[24px] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
    <div class="h-20 w-20 shrink-0 overflow-hidden border border-slate-100 rounded-2xl bg-slate-50">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="product?.title ?? 'Товар'"
        class="h-full w-full object-cover"
        loading="lazy"
      >
      <div
        v-else
        class="h-full w-full flex items-center justify-center text-slate-300"
      >
        <div class="i-mdi:image-outline text-2xl" />
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-full px-3 py-1 text-xs font-semibold"
          :class="statusClasses"
        >
          {{ statusLabel }}
        </span>

        <span
          v-if="isActive && timeLeft"
          class="text-xs text-slate-500"
        >
          осталось {{ timeLeft }}
        </span>
      </div>

      <RouterLink
        v-if="product?.slug"
        :to="`/product/${product.slug}`"
        class="mt-2 block truncate text-base font-semibold transition hover:text-secondary"
      >
        {{ product.title }}
      </RouterLink>
      <div
        v-else
        class="mt-2 truncate text-base font-semibold"
      >
        Товар недоступен
      </div>

      <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <span>{{ reservation.quantity }} шт.</span>
        <span v-if="variantLabel">{{ variantLabel }}</span>
        <span v-if="totalPrice">{{ totalPrice }}</span>
      </div>

      <div
        v-if="isActive && expiresText"
        class="mt-1 text-sm text-slate-500"
      >
        Держим до {{ expiresText }}
      </div>

      <div
        v-if="reservation.manager_note"
        class="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
      >
        Менеджер: {{ reservation.manager_note }}
      </div>
    </div>

    <button
      v-if="isActive"
      type="button"
      class="w-full shrink-0 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto disabled:cursor-not-allowed hover:bg-slate-50 disabled:opacity-60"
      :disabled="busy"
      @click="emit('cancel', reservation.id)"
    >
      Отменить
    </button>
  </div>
</template>
