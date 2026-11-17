<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { WHATSAPP_DIGITS } from '~/constants/contacts'
import CalculatorSelect from '~/components/sections/CalculatorSelect.vue'
import { trackGoal } from '~/utils/analytics'
import { BAG_OPTIONS, calculate, formatTenge, PRICE_METHODS, quickQuantities } from '~/utils/applicationPrice'

/*
 * Калькулятор нанесения для клиентов: без скидок, цена предварительная.
 * Прайс и формулы — в src/utils/applicationPrice.ts.
 */

const methodIndex = ref(0)
const productIndex = ref(0)
const qty = ref(100)
const places = ref(1)
const colors = ref(1)
const bigPrint = ref(false)
const embossFoil = ref(false)
const clicheSize = ref('5×3')
const width = ref(20)
const height = ref(25)
const bagPrice = ref(0)
const company = ref('')

const method = computed(() => PRICE_METHODS[methodIndex.value])
const product = computed(() => method.value.products[productIndex.value])
const quick = computed(() => quickQuantities(product.value))

function selectMethod(index: number) {
  methodIndex.value = index
  productIndex.value = 0
}

// новое изделие — параметры по умолчанию, чтобы не тянуть 5 цветов с футболок на ланьярды
watch(product, () => {
  colors.value = 1
  bigPrint.value = false
  embossFoil.value = false
  bagPrice.value = 0
})

const result = computed(() => calculate({
  method: method.value,
  product: product.value,
  qty: Number(qty.value),
  places: Number(places.value),
  colors: Number(colors.value),
  bigPrint: bigPrint.value,
  embossFoil: embossFoil.value,
  clicheSize: clicheSize.value,
  width: Number(width.value) || 0,
  height: Number(height.value) || 0,
  bagPrice: Number(bagPrice.value),
}))

const safeQty = computed(() => Math.max(1, Math.floor(Number(qty.value) || 1)))

const whatsappHref = computed(() => {
  const name = company.value.trim()
  const text = `Здравствуйте! Посчитал нанесение на сайте Brillex.\n${result.value.summary}${name ? `\nКомпания: ${name}` : ''}`
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(text)}`
})

function onSend() {
  trackGoal('lead_calculator', {
    method: method.value.id,
    product: product.value.id,
    qty: safeQty.value,
    total: Math.round(result.value.total),
  })
}

function scrollToForm() {
  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const colorOptions = computed(() => product.value.kind === 'tex' ? [1, 2, 3, 4, 5, 6] : [1, 2])

const productOptions = computed(() => method.value.products.map((item, index) => ({ value: index, label: item.name })))
const printSizeOptions = [{ value: false, label: 'до 12×12 см' }, { value: true, label: 'от 12 до 40 см' }]
const embossOptions = [{ value: false, label: 'Слепое' }, { value: true, label: 'Фольгой' }]
const placeOptions = [{ value: 1, label: 'Одно' }, { value: 2, label: 'Два' }, { value: 3, label: 'Три' }, { value: 4, label: 'Четыре' }]

const fieldClass = 'h-12 w-full rounded-xl border border-transparent bg-neutral-100 px-3.5 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white'
const labelClass = 'text-sm font-semibold text-neutral-500'
</script>

<template>
  <section id="calculator" class="scroll-mt-28 py-12 md:py-20 lg:py-24">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <FadeComponent>
        <span class="inline-flex items-center gap-2 border border-black/10 rounded-full px-3 py-1 text-xs text-neutral-600 font-semibold tracking-[0.15em] uppercase">
          <span class="size-2 rounded-full bg-primary" aria-hidden="true" />
          Калькулятор
        </span>
        <h2 class="mt-4 text-4xl font-black leading-[0.95] tracking-tight uppercase md:text-6xl">
          Сколько стоит
          <span class="block text-primary">нанесение</span>
        </h2>
        <p class="mt-4 max-w-2xl text-base text-neutral-600 leading-7 md:text-lg">
          Выберите способ, изделие и тираж, и сумма посчитается сразу. Точную цену менеджер подтвердит после макета.
        </p>
      </FadeComponent>

      <div class="grid mt-10 items-start gap-5 lg:grid-cols-[7fr_5fr] lg:gap-6">
        <!-- параметры -->
        <div class="flex flex-col gap-6 border border-black/10 rounded-3xl bg-white p-5 md:p-8">
          <div class="flex flex-col gap-3">
            <span :class="labelClass">Способ нанесения</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(item, index) in PRICE_METHODS"
                :key="item.id"
                type="button"
                class="border rounded-full px-4 py-2.5 text-sm font-semibold transition"
                :class="index === methodIndex
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-black/10 bg-white text-neutral-800 hover:border-neutral-900'"
                :aria-pressed="index === methodIndex"
                @click="selectMethod(index)"
              >
                {{ item.name }}
              </button>
            </div>
            <p v-if="method.note" class="text-sm text-neutral-500 leading-6">
              {{ method.note }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <span :class="labelClass">Изделие</span>
            <CalculatorSelect v-model="productIndex" :options="productOptions" highlight aria-label="Изделие" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="calc-qty" :class="labelClass">Тираж, шт.</label>
            <input
              id="calc-qty"
              v-model.number="qty"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              :class="fieldClass"
              class="text-2xl font-bold tabular-nums"
            >
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="value in quick"
                :key="value"
                type="button"
                class="border rounded-full px-3 py-1 text-sm tabular-nums transition"
                :class="value === safeQty
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-black/10 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900'"
                @click="qty = value"
              >
                {{ value.toLocaleString('ru-RU') }}
              </button>
            </div>
          </div>

          <!-- параметры, которые зависят от изделия -->
          <div v-if="product.kind !== 'plain'" class="grid gap-4 sm:grid-cols-2">
            <template v-if="product.kind === 'tex' || product.kind === 'two' || product.kind === 'bags'">
              <div class="flex flex-col gap-2">
                <span :class="labelClass">Цветов в логотипе</span>
                <CalculatorSelect v-model="colors" :options="colorOptions.map(n => ({ value: n, label: String(n) }))" aria-label="Цветов в логотипе" />
              </div>
            </template>

            <div v-if="product.kind === 'tex'" class="flex flex-col gap-2">
              <span :class="labelClass">Размер печати</span>
              <CalculatorSelect v-model="bigPrint" :options="printSizeOptions" aria-label="Размер печати" />
            </div>

            <div v-if="product.kind === 'bags'" class="flex flex-col gap-2">
              <span :class="labelClass">Пакеты</span>
              <CalculatorSelect v-model="bagPrice" :options="BAG_OPTIONS" aria-label="Пакеты" />
            </div>

            <template v-if="product.kind === 'emb'">
              <div class="flex flex-col gap-2">
                <span :class="labelClass">Вид тиснения</span>
                <CalculatorSelect v-model="embossFoil" :options="embossOptions" aria-label="Вид тиснения" />
              </div>
              <label class="flex flex-col gap-2">
                <span :class="labelClass">Размер логотипа, см</span>
                <input v-model="clicheSize" type="text" inputmode="decimal" placeholder="5×3" :class="fieldClass">
              </label>
            </template>

            <template v-if="product.kind === 'area'">
              <label class="flex flex-col gap-2">
                <span :class="labelClass">Ширина, см</span>
                <input v-model.number="width" type="number" min="1" step="0.5" inputmode="decimal" :class="fieldClass">
              </label>
              <label class="flex flex-col gap-2">
                <span :class="labelClass">Высота, см</span>
                <input v-model.number="height" type="number" min="1" step="0.5" inputmode="decimal" :class="fieldClass">
              </label>
            </template>
          </div>

          <div class="flex flex-col gap-2">
            <span :class="labelClass">Сколько мест нанесения на изделии</span>
            <CalculatorSelect v-model="places" :options="placeOptions" highlight aria-label="Сколько мест нанесения" />
          </div>
        </div>

        <!-- итог -->
        <div class="flex flex-col gap-5 rounded-3xl bg-neutral-950 p-5 text-white md:p-8 lg:sticky lg:top-32" aria-live="polite">
          <div>
            <span class="text-xs text-white/60 font-semibold tracking-[0.15em] uppercase">Предварительно</span>
            <div class="mt-2 text-5xl font-black leading-none tracking-tight tabular-nums md:text-6xl">
              {{ formatTenge(result.total) }}
            </div>
            <div class="mt-2 text-base text-white/70 tabular-nums">
              {{ formatTenge(result.perItem) }} за шт. · {{ safeQty.toLocaleString('ru-RU') }} шт.
            </div>
          </div>

          <div class="flex flex-col gap-2 border-t border-white/15 pt-4 text-sm">
            <div v-for="line in result.lines" :key="line.label" class="flex justify-between gap-3">
              <span class="text-white/70">{{ line.label }}</span>
              <span class="whitespace-nowrap tabular-nums">{{ line.value }}</span>
            </div>
          </div>

          <p v-if="result.tip" class="rounded-xl bg-white/10 px-4 py-3 text-sm leading-6">
            От {{ result.tip.qty.toLocaleString('ru-RU') }} шт. нанесение обойдётся в
            <b class="text-primary">{{ formatTenge(result.tip.perItem) }}</b> за штуку.
          </p>
          <p v-if="result.warn" class="rounded-xl bg-white/10 px-4 py-3 text-sm leading-6">
            {{ result.warn }}
          </p>

          <label class="flex flex-col gap-2">
            <span class="text-sm text-white/60 font-semibold">Компания (необязательно)</span>
            <input
              v-model="company"
              type="text"
              placeholder="Например, ТОО «Ромашка»"
              class="h-12 w-full border border-transparent rounded-xl bg-white/10 px-3.5 text-base text-white outline-none transition placeholder:text-white/40 focus:border-white/40"
            >
          </label>

          <a
            :href="whatsappHref"
            target="_blank"
            rel="noopener noreferrer"
            class="h-13 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 text-base text-white font-semibold shadow-[0_18px_36px_rgba(254,72,25,0.28)] transition hover:bg-primary/90"
            @click="onSend"
          >
            <span class="icon-[mdi--whatsapp] text-xl" aria-hidden="true" />
            Отправить расчёт в WhatsApp
          </a>
          <button type="button" class="text-sm text-white/60 underline-offset-4 transition -mt-2 hover:text-white hover:underline" @click="scrollToForm">
            или оставьте заявку на сайте
          </button>

          <p class="text-xs text-white/50 leading-5">
            Цена за нанесение, без стоимости изделий. Упаковка считается отдельно.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
