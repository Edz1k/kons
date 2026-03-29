<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAmocrm } from '~/composables/useAmocrm'

type ContactType = 'invite' | 'video'

const props = withDefaults(defineProps<{
  email?: string
  source?: string
  productTitle?: string
  variantName?: string
  sku?: string
  quantity?: string | number
}>(), {
  email: 'zakaz@brillex.kz',
  source: 'layout-contact-form',
})

const { sendForm } = useAmocrm()

const name = ref('')
const phone = ref('')
const contactType = ref<ContactType>('invite')
const agreed = ref(false)

const loading = ref(false)
const success = ref(false)
const error = ref('')

const phoneDigits = computed(() => phone.value.replace(/\D/g, ''))

const isValid = computed(() => {
  return (
    name.value.trim().length >= 2
    && phoneDigits.value.length === 11
    && agreed.value
  )
})

async function submitForm() {
  if (!isValid.value || loading.value)
    return

  loading.value = true
  success.value = false
  error.value = ''

  try {
    const pageSource = typeof window !== 'undefined'
      ? `${window.location.hostname}${window.location.pathname}-layout-form`
      : props.source

    await sendForm({
      name: name.value.trim(),
      phone: phone.value,
      source: pageSource,
      product_title: props.productTitle || 'Обратная связь',
      variant_name: contactType.value === 'invite'
        ? 'Приглашаем Brillex в гости'
        : 'Созвонимся по видео',
      sku: props.sku,
      quantity: props.quantity !== undefined ? String(props.quantity) : undefined,
    })

    success.value = true
    name.value = ''
    phone.value = ''
    contactType.value = 'invite'
    agreed.value = false
  }
  catch (e) {
    console.error(e)
    error.value = 'Не удалось отправить форму. Попробуйте ещё раз.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="w-full py-14 md:py-20 xl:py-24">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <div class="mb-8 md:mb-10 xl:mb-12">
        <p class="text-sm text-secondary font-800 tracking-[0.22em] uppercase md:text-base">
          Контактная форма
        </p>

        <h2 class="mt-3 max-w-4xl text-3xl text-black font-900 leading-[0.95] tracking-[-0.03em] md:text-5xl sm:text-4xl xl:text-6xl">
          Пора знакомиться
        </h2>

        <p class="mt-4 max-w-2xl text-sm text-slate-600 leading-7 md:text-lg sm:text-base">
          Оставьте заявку, и мы подберём удобный формат общения: личная встреча или видеозвонок.
        </p>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-stretch">
        <!-- Левая карточка с одной картинкой -->
        <div class="relative min-h-[320px] overflow-hidden rounded-[28px] bg-slate-900 sm:min-h-[420px] xl:min-h-full">
          <img
            src="/image.png"
            alt="Brillex contact preview"
            class="absolute inset-0 h-full w-full object-cover"
          >

          <!-- мягкое затемнение -->
          <div class="absolute inset-0 bg-black/25" />

          <!-- нижний градиент под текст -->
          <div class="absolute inset-x-0 bottom-0 h-[60%] from-black/75 via-black/35 to-transparent bg-gradient-to-t" />

          <!-- декоративный blur -->
          <div class="absolute h-40 w-40 rounded-full bg-white/10 blur-3xl -bottom-10 -left-10" />

          <div class="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 sm:p-7 xl:p-10">
            <div class="max-w-[32rem]">
              <div class="mb-4 inline-flex items-center rounded-full bg-white/12 px-4 py-2 text-xs text-white/90 font-medium tracking-[0.18em] uppercase backdrop-blur-sm md:text-sm">
                Brillex
              </div>

              <h3 class="text-2xl text-white font-900 leading-tight md:text-[38px] sm:text-3xl md:leading-[1.05]">
                Начните с короткой формы — и мы свяжемся с вами удобным способом
              </h3>

              <p class="mt-4 max-w-[28rem] text-sm text-white/80 leading-7 md:text-lg sm:text-base">
                Расскажите немного о себе, и мы предложим лучший вариант сотрудничества для вашего бренда, компании или мероприятия.
              </p>
            </div>
          </div>
        </div>

        <!-- Правая часть -->
        <div class="border border-slate-200 rounded-[28px] bg-[#f7f7f7] p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] md:rounded-[32px] md:p-8 sm:p-7 xl:p-10">
          <div class="mb-8 flex flex-wrap items-center gap-3">
            <span class="text-sm text-slate-500 font-medium md:text-base">
              Кому:
            </span>

            <div class="rounded-full bg-white px-4 py-2 text-sm text-slate-900 font-semibold shadow-sm ring-1 ring-slate-200 md:text-base">
              {{ email }}
            </div>
          </div>

          <form class="flex flex-col" @submit.prevent="submitForm">
            <div class="border-b border-slate-300 pb-4">
              <input
                v-model="name"
                type="text"
                placeholder="Ваше имя *"
                class="w-full bg-transparent text-base text-slate-900 outline-none md:text-lg placeholder:text-slate-400"
              >
            </div>

            <div class="mt-6 border-b border-slate-300 pb-4">
              <div class="flex items-center gap-3">
                <div class="text-lg">
                  🇰🇿
                </div>

                <input
                  v-model="phone"
                  v-maska="'+7 (7##) ###-##-##'"
                  type="tel"
                  inputmode="tel"
                  placeholder="+7 (700) 000-00-00"
                  class="w-full bg-transparent text-base text-slate-900 outline-none md:text-lg placeholder:text-slate-400"
                >
              </div>
            </div>

            <div class="mt-8 space-y-4">
              <label class="flex cursor-pointer items-start gap-3 rounded-2xl bg-white px-4 py-4 transition hover:ring-1 hover:ring-slate-300">
                <input
                  v-model="contactType"
                  type="radio"
                  value="invite"
                  class="mt-1 h-5 w-5 shrink-0 accent-black"
                >
                <div>
                  <p class="text-sm text-slate-900 font-semibold md:text-base">
                    Приглашаем Brillex в гости
                  </p>
                  <p class="mt-1 text-sm text-slate-500 leading-6">
                    Обсудим задачу лично и покажем возможные решения по мерчу.
                  </p>
                </div>
              </label>

              <label class="flex cursor-pointer items-start gap-3 rounded-2xl bg-white px-4 py-4 transition hover:ring-1 hover:ring-slate-300">
                <input
                  v-model="contactType"
                  type="radio"
                  value="video"
                  class="mt-1 h-5 w-5 shrink-0 accent-black"
                >
                <div>
                  <p class="text-sm text-slate-900 font-semibold md:text-base">
                    Созвонимся по видео
                  </p>
                  <p class="mt-1 text-sm text-slate-500 leading-6">
                    Быстро обсудим проект онлайн в удобное для вас время.
                  </p>
                </div>
              </label>
            </div>

            <label class="mt-8 flex items-start gap-3">
              <input
                v-model="agreed"
                type="checkbox"
                class="mt-1 h-5 w-5 shrink-0 accent-black"
              >
              <span class="text-sm text-slate-600 leading-6 md:text-base">
                Я даю согласие на
                <a
                  href="/privacy-policy"
                  target="_blank"
                  class="text-slate-900 underline underline-offset-4"
                >
                  обработку персональных данных
                </a>
              </span>
            </label>

            <div class="mt-8">
              <button
                type="submit"
                class="min-h-[56px] inline-flex items-center justify-center rounded-full bg-secondary px-7 py-4 text-sm text-white font-semibold transition-all duration-300 md:min-h-[60px] disabled:cursor-not-allowed md:px-8 md:text-base disabled:opacity-50 hover:opacity-95 hover:-translate-y-0.5"
                :disabled="loading || !isValid"
              >
                {{ loading ? 'Отправка...' : 'Отправить заявку →' }}
              </button>
            </div>

            <p
              v-if="success"
              class="mt-5 text-sm text-green-600 font-medium md:text-base"
            >
              Заявка успешно отправлена
            </p>

            <p
              v-if="error"
              class="mt-5 text-sm text-red-500 font-medium md:text-base"
            >
              {{ error }}
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
