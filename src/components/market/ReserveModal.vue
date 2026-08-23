<script setup lang="ts">
import type { Reservation } from '~/types/reservation'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RESERVATION_DAYS } from '~/services/reservations'
import { useAuthStore } from '~/stores/auth'
import { useReservationsStore } from '~/stores/reservations'

interface OpenPayload {
  productId: number | string
  productTitle: string
  variantId?: number | string | null
  variantName?: string
  sku?: string
  availableStock: number
  price?: number | null
}

const emit = defineEmits<{
  reserved: [reservation: Reservation]
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()

const isOpen = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const createdReservation = ref<Reservation | null>(null)

const productId = ref<number | string>('')
const productTitle = ref('')
const variantId = ref<number | string | null>(null)
const variantName = ref('')
const sku = ref('')
const availableStock = ref(0)
const price = ref<number | null>(null)

const quantity = ref(1)
const comment = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)
const maxQuantity = computed(() => Math.max(0, availableStock.value))
const canSubmit = computed(() => quantity.value >= 1 && quantity.value <= maxQuantity.value)

const reservedUntilText = computed(() => {
  const expiresAt = createdReservation.value?.expires_at

  if (!expiresAt)
    return ''

  const date = new Date(expiresAt)

  if (Number.isNaN(date.getTime()))
    return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

function openModal(payload: OpenPayload) {
  productId.value = payload.productId
  productTitle.value = payload.productTitle
  variantId.value = payload.variantId ?? null
  variantName.value = payload.variantName ?? ''
  sku.value = payload.sku ?? ''
  availableStock.value = Math.max(0, Number(payload.availableStock ?? 0))
  price.value = typeof payload.price === 'number' ? payload.price : null

  quantity.value = availableStock.value > 0 ? 1 : 0
  comment.value = ''
  errorMessage.value = ''
  createdReservation.value = null
  loading.value = false
  isOpen.value = true
}

function closeModal() {
  isOpen.value = false
}

function decreaseQuantity() {
  if (quantity.value > 1)
    quantity.value--
}

function increaseQuantity() {
  if (quantity.value < maxQuantity.value)
    quantity.value++
}

function setQuantityFromInput(event: Event) {
  const target = event.target as HTMLInputElement
  const rawValue = Number(target.value)

  if (Number.isNaN(rawValue) || rawValue < 1) {
    quantity.value = 1
    return
  }

  quantity.value = Math.min(rawValue, maxQuantity.value)
}

async function goToLogin() {
  isOpen.value = false

  await router.push({
    path: '/login',
    query: { redirect: route.fullPath },
  })
}

async function submit() {
  if (!canSubmit.value || loading.value)
    return

  loading.value = true
  errorMessage.value = ''

  try {
    const reservation = await reservationsStore.reserve({
      product: productId.value,
      variant: variantId.value,
      quantity: quantity.value,
      price_at_reserve: price.value,
      customer_comment: comment.value.trim(),
    })

    createdReservation.value = reservation
    emit('reserved', reservation)
  }
  catch (e) {
    errorMessage.value = e instanceof Error
      ? e.message
      : 'Не удалось создать резерв. Попробуйте ещё раз'
  }
  finally {
    loading.value = false
  }
}

defineExpose({
  openModal,
})
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="closeModal">
      <TransitionChild
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          enter="duration-200 ease-out"
          enter-from="translate-y-2 scale-95 opacity-0"
          enter-to="translate-y-0 scale-100 opacity-100"
          leave="duration-150 ease-in"
          leave-from="translate-y-0 scale-100 opacity-100"
          leave-to="translate-y-2 scale-95 opacity-0"
        >
          <DialogPanel class="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <DialogTitle class="text-xl text-black font-semibold">
                  Резерв товара
                </DialogTitle>
                <p class="mt-1 text-sm text-black/55">
                  Держим товар за вами {{ RESERVATION_DAYS }} дня
                </p>
              </div>

              <button
                type="button"
                class="h-10 w-10 flex items-center justify-center rounded-full bg-black/5 text-black/70 transition hover:bg-black/10"
                @click="closeModal"
              >
                <div class="i-mdi:close text-xl" />
              </button>
            </div>

            <div
              v-if="productTitle"
              class="mt-5 border border-black/8 rounded-2xl bg-black/[0.03] p-4"
            >
              <div class="text-xs text-black/45 tracking-[0.2em] uppercase">
                Товар
              </div>

              <div class="mt-2 text-base text-black font-semibold">
                {{ productTitle }}
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <div
                  v-if="variantName"
                  class="rounded-full bg-white px-3 py-1.5 text-xs text-black/70"
                >
                  Цвет: <span class="text-black font-medium">{{ variantName }}</span>
                </div>

                <div
                  v-if="sku"
                  class="rounded-full bg-white px-3 py-1.5 text-xs text-black/70"
                >
                  Артикул: <span class="text-black font-medium">{{ sku }}</span>
                </div>

                <div class="rounded-full bg-white px-3 py-1.5 text-xs text-black/70">
                  Доступно: <span class="text-black font-medium">{{ maxQuantity }} шт.</span>
                </div>
              </div>
            </div>

            <div
              v-if="!isAuthenticated"
              class="mt-5 flex flex-col gap-3"
            >
              <p class="text-sm text-black/70 leading-6">
                Резерв доступен только клиентам с аккаунтом — так менеджер видит, за кем закреплён товар.
              </p>

              <button
                type="button"
                class="rounded-2xl bg-black py-3.5 text-white font-medium transition hover:bg-black/90"
                @click="goToLogin"
              >
                Войти в аккаунт
              </button>
            </div>

            <div
              v-else-if="createdReservation"
              class="mt-5 flex flex-col gap-3"
            >
              <div class="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-700 leading-6">
                Товар зарезервирован<template v-if="reservedUntilText">
                  до {{ reservedUntilText }}
                </template>.
                Менеджер свяжется с вами для подтверждения.
              </div>

              <RouterLink
                to="/profile"
                class="rounded-2xl bg-black py-3.5 text-center text-white font-medium transition hover:bg-black/90"
                @click="closeModal"
              >
                Мои резервы
              </RouterLink>
            </div>

            <form
              v-else
              class="mt-5 flex flex-col gap-4"
              @submit.prevent="submit"
            >
              <div>
                <label class="mb-2 block text-sm text-black/70 font-medium">
                  Количество
                </label>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="h-12 w-12 flex items-center justify-center border border-black/15 rounded-2xl bg-white text-black transition disabled:cursor-not-allowed hover:bg-black/5 disabled:opacity-40"
                    :disabled="quantity <= 1"
                    @click="decreaseQuantity"
                  >
                    <div class="i-mdi:minus text-xl" />
                  </button>

                  <input
                    :value="quantity"
                    type="number"
                    min="1"
                    :max="maxQuantity"
                    class="h-12 w-full border border-black/15 rounded-2xl px-4 text-center text-black outline-none focus:border-black"
                    @input="setQuantityFromInput"
                  >

                  <button
                    type="button"
                    class="h-12 w-12 flex items-center justify-center border border-black/15 rounded-2xl bg-white text-black transition disabled:cursor-not-allowed hover:bg-black/5 disabled:opacity-40"
                    :disabled="quantity >= maxQuantity"
                    @click="increaseQuantity"
                  >
                    <div class="i-mdi:plus text-xl" />
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm text-black/70 font-medium">
                  Комментарий менеджеру
                </label>
                <textarea
                  v-model="comment"
                  rows="3"
                  placeholder="Например: заберу в четверг после обеда"
                  class="w-full resize-none border border-black/15 rounded-2xl px-4 py-3 text-black outline-none focus:border-black"
                />
              </div>

              <p class="text-xs text-black/50 leading-5">
                Резерв действует {{ RESERVATION_DAYS }} дня. Если за это время покупка не подтверждена,
                товар автоматически вернётся в продажу.
              </p>

              <div
                v-if="errorMessage"
                class="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600"
              >
                {{ errorMessage }}
              </div>

              <button
                type="submit"
                class="mt-1 rounded-2xl bg-black py-3.5 text-white font-medium transition disabled:cursor-not-allowed hover:bg-black/90 disabled:opacity-60"
                :disabled="loading || !canSubmit"
              >
                {{ loading ? 'Резервируем...' : `Зарезервировать на ${RESERVATION_DAYS} дня` }}
              </button>
            </form>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
