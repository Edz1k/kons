<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ref } from 'vue'
import { useAmocrm } from '~/services/useAmocrm'

const { sendForm } = useAmocrm()

const isOpen = ref(false)

function openModal() {
  isOpen.value = true
}

function closeModal() {
  isOpen.value = false
}

defineExpose({
  openModal,
})

// форма
const name = ref('')
const phone = ref('')
const loading = ref(false)
const success = ref(false)

async function submitForm() {
  if (!name.value || phone.value.length < 10)
    return

  loading.value = true

  try {
    const source = typeof window !== 'undefined'
      ? `${window.location.hostname}${window.location.pathname}-modal`
      : 'modal'

    await sendForm({
      name: name.value,
      phone: phone.value,
      source,
    })

    success.value = true
    name.value = ''
    phone.value = ''
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}
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
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          enter="duration-200 ease-out"
          enter-from="scale-95 opacity-0"
          enter-to="scale-100 opacity-100"
          leave="duration-150 ease-in"
          leave-from="scale-100 opacity-100"
          leave-to="scale-95 opacity-0"
        >
          <DialogPanel class="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl">
            <div class="flex items-center justify-between">
              <DialogTitle class="text-xl font-semibold">
                Оставьте заявку
              </DialogTitle>
              <div class="i-mdi:close opacity-75 transition transition-all hover:text-red-500" @click="closeModal" />
            </div>

            <p class="mt-1 text-sm text-black/60">
              Мы свяжемся с вами в ближайшее время
            </p>

            <form class="mt-6 flex flex-col gap-4" @submit.prevent="submitForm">
              <input
                v-model="name"
                type="text"
                placeholder="Ваше имя"
                class="w-full border border-black/20 rounded-xl px-4 py-3 outline-none focus:border-black"
              >

              <input
                v-model="phone"
                v-maska="'+7 (7##) ### ## ##'"
                type="tel"
                placeholder="+7 (7__) ___ __ __"
                class="w-full border border-black/20 rounded-xl px-4 py-3 outline-none focus:border-black"
              >

              <button
                type="submit"
                class="rounded-xl bg-black py-3 text-white transition disabled:cursor-not-allowed hover:bg-black/90 disabled:opacity-60"
                :disabled="loading"
              >
                {{ loading ? 'Отправка...' : 'Отправить заявку' }}
              </button>
            </form>

            <p v-if="success" class="mt-4 text-sm text-green-600">
              Заявка отправлена
            </p>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
