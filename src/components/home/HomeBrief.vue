<script setup lang="ts">
import { CheckCircle2, Loader2 } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useAmocrm } from '~/composables/useAmocrm'

const { sendForm } = useAmocrm()

const form = reactive({
  name: '',
  company: '',
  phone: '',
  goal: '',
  budget: '',
  quantity: '',
  colors: '',
  deadline: '',
})
const agreed = ref(false)

const loading = ref(false)
const success = ref(false)
const error = ref('')

const phoneDigits = computed(() => form.phone.replace(/\D/g, ''))
const isValid = computed(() =>
  form.name.trim().length >= 2
  && phoneDigits.value.length === 11
  && agreed.value,
)

/*
 * Набор полей виджета amoCRM не меняем: тираж уходит в quantity,
 * остальное — одной строкой в variant_name, менеджер прочитает всё в сделке.
 */
function describeBrief() {
  return [
    ['Компания', form.company],
    ['Цель мерча', form.goal],
    ['Бюджет', form.budget],
    ['Цвет продукции / логотипа', form.colors],
    ['Когда нужен', form.deadline],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join('; ')
}

async function submit() {
  if (!isValid.value || loading.value)
    return

  loading.value = true
  error.value = ''

  try {
    await sendForm({
      name: form.name.trim(),
      phone: form.phone,
      source: `${window.location.hostname}${window.location.pathname}-brief-form`,
      product_title: 'Коммерческое предложение',
      variant_name: describeBrief() || undefined,
      quantity: form.quantity.trim() || undefined,
    })

    success.value = true
    Object.assign(form, { name: '', company: '', phone: '', goal: '', budget: '', quantity: '', colors: '', deadline: '' })
    agreed.value = false
  }
  catch (e) {
    console.error(e)
    error.value = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в WhatsApp.'
  }
  finally {
    loading.value = false
  }
}

const fields = [
  { key: 'company', label: 'Компания', placeholder: 'Название компании' },
  { key: 'budget', label: 'Примерный бюджет', placeholder: 'Например, 500 000 ₸' },
  { key: 'quantity', label: 'Тираж', placeholder: 'Например, 300 шт.' },
  { key: 'colors', label: 'Цвет продукции / логотипа', placeholder: 'Чёрный, лого белое' },
  { key: 'deadline', label: 'Когда нужен заказ?', placeholder: 'Например, к 15 декабря' },
] as const
</script>

<template>
  <section id="brief" class="scroll-mt-28 bg-black px-4 py-20 text-white lg:px-8 md:py-28 sm:px-6">
    <div class="grid mx-auto max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <div class="lg:sticky lg:top-36 lg:self-start">
        <h2 class="text-5xl font-black leading-[0.92] tracking-tight uppercase md:text-7xl">
          Есть задача?<br>
          <span class="text-primary">Опишите.</span>
        </h2>
        <p class="mt-6 max-w-md text-base text-white/70 leading-7 md:text-lg">
          Цель мерча, примерный бюджет, тираж, цвета и сроки — этого достаточно, чтобы мы подготовили коммерческое предложение.
        </p>
      </div>

      <div class="rounded-[2rem] bg-white p-6 text-black md:p-10">
        <div v-if="success" class="min-h-[420px] flex flex-col items-center justify-center gap-4 text-center" role="status">
          <CheckCircle2 class="size-14 text-primary" />
          <p class="text-2xl font-bold">
            Заявка отправлена
          </p>
          <p class="max-w-sm text-neutral-600">
            Менеджер свяжется с вами и подготовит коммерческое предложение.
          </p>
          <Button variant="outline" class="mt-2 rounded-full" @click="success = false">
            Отправить ещё одну
          </Button>
        </div>

        <form v-else class="grid gap-5 sm:grid-cols-2" novalidate @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="brief-name">Имя *</Label>
            <Input id="brief-name" v-model="form.name" autocomplete="name" placeholder="Как к вам обращаться" class="h-12 rounded-xl" required />
          </div>
          <div class="grid gap-2">
            <Label for="brief-phone">Телефон / WhatsApp *</Label>
            <Input
              id="brief-phone"
              v-model="form.phone"
              v-maska="'+7 (7##) ###-##-##'"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+7 (700) 000-00-00"
              class="h-12 rounded-xl"
              required
            />
          </div>

          <div class="grid gap-2 sm:col-span-2">
            <Label for="brief-goal">Цель мерча</Label>
            <Textarea id="brief-goal" v-model="form.goal" rows="3" placeholder="Для кого и для чего: welcome-pack, конференция, подарки партнёрам…" class="min-h-24 rounded-xl" />
          </div>

          <div
            v-for="field in fields"
            :key="field.key"
            class="grid gap-2"
            :class="field.key === 'company' ? 'sm:col-span-2' : ''"
          >
            <Label :for="`brief-${field.key}`">{{ field.label }}</Label>
            <Input :id="`brief-${field.key}`" v-model="form[field.key]" :placeholder="field.placeholder" class="h-12 rounded-xl" />
          </div>

          <label class="flex items-start gap-3 text-sm text-neutral-600 sm:col-span-2">
            <input v-model="agreed" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-primary">
            <span>
              Я даю согласие на
              <a href="/privacy-policy" target="_blank" class="text-black font-medium underline underline-offset-4 hover:text-primary">обработку персональных данных</a>
            </span>
          </label>

          <p v-if="error" class="text-destructive text-sm sm:col-span-2" role="alert">
            {{ error }}
          </p>

          <Button type="submit" size="lg" class="h-13 rounded-full text-base sm:col-span-2" :disabled="!isValid || loading">
            <Loader2 v-if="loading" class="size-5 animate-spin" />
            Получить коммерческое предложение
          </Button>
        </form>
      </div>
    </div>
  </section>
</template>
