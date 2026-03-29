<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useAmocrm } from '~/composables/useAmocrm'

const { sendForm } = useAmocrm()

const isOpen = ref(false)

const name = ref('')
const phone = ref('')
const loading = ref(false)
const success = ref(false)

const productTitle = ref('')
const variantName = ref('')
const sku = ref('')
const quantity = ref(1)
const maxQuantity = ref(1)

function openModal(payload?: {
  productTitle?: string
  variantName?: string
  sku?: string
  maxQuantity?: number
}) {
  productTitle.value = payload?.productTitle ?? ''
  variantName.value = payload?.variantName ?? ''
  sku.value = payload?.sku ?? ''
  maxQuantity.value = Math.max(0, Number(payload?.maxQuantity ?? 0))
  quantity.value = 1

  name.value = ''
  phone.value = ''
  success.value = false
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
  quantity.value++
}

function setQuantityFromInput(event: Event) {
  const target = event.target as HTMLInputElement
  const rawValue = Number(target.value)

  if (Number.isNaN(rawValue)) {
    quantity.value = 1
    return
  }

  if (rawValue < 1) {
    quantity.value = 1
    return
  }

  quantity.value = rawValue
}

async function submitForm() {
  if (!name.value.trim())
    return

  if (phone.value.replace(/\D/g, '').length < 11)
    return

  loading.value = true

  try {
    const source = typeof window !== 'undefined'
      ? `${window.location.hostname}${window.location.pathname}-modal`
      : 'modal'

    await sendForm({
      name: name.value.trim(),
      phone: phone.value,
      source,
      product_title: productTitle.value,
      variant_name: variantName.value,
      sku: sku.value,
      quantity: String(quantity.value),
    })

    success.value = true
    name.value = ''
    phone.value = ''
    quantity.value = 1
  }
  catch (error) {
    console.error(error)
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
                  Оставить заявку
                </DialogTitle>
                <p class="mt-1 text-sm text-black/55">
                  Укажите количество и оставьте контакты
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
                  Остаток: <span class="text-black font-medium">{{ maxQuantity }} шт.</span>
                </div>
              </div>
            </div>

            <form class="mt-5 flex flex-col gap-4" @submit.prevent="submitForm">
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
                    class="h-12 w-full border border-black/15 rounded-2xl px-4 text-center text-black outline-none focus:border-black"
                    @input="setQuantityFromInput"
                  >

                  <button
                    type="button"
                    class="h-12 w-12 flex items-center justify-center border border-black/15 rounded-2xl bg-white text-black transition hover:bg-black/5"
                    @click="increaseQuantity"
                  >
                    <div class="i-mdi:plus text-xl" />
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm text-black/70 font-medium">
                  Ваше имя
                </label>
                <input
                  v-model="name"
                  type="text"
                  placeholder="Введите имя"
                  class="w-full border border-black/15 rounded-2xl px-4 py-3 text-black outline-none focus:border-black"
                >
              </div>

              <div>
                <label class="mb-2 block text-sm text-black/70 font-medium">
                  Телефон
                </label>
                <input
                  v-model="phone"
                  v-maska="'+7 (7##) ### ## ##'"
                  type="tel"
                  placeholder="+7 (7__) ___ __ __"
                  class="w-full border border-black/15 rounded-2xl px-4 py-3 text-black outline-none focus:border-black"
                >
              </div>

              <button
                type="submit"
                class="mt-1 rounded-2xl bg-black py-3.5 text-white font-medium transition disabled:cursor-not-allowed hover:bg-black/90 disabled:opacity-60"
                :disabled="loading"
              >
                {{ loading ? 'Отправка...' : 'Отправить заявку' }}
              </button>
            </form>

            <div
              v-if="success"
              class="mt-4 rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-700"
            >
              Заявка успешно отправлена
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
