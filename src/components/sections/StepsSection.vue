<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Button } from '~/components/ui/button'

/*
 * Таймлайн шагов (идея — Timeline с 21st.dev): линия слева заполняется по мере прокрутки,
 * номер шага загорается, когда до него доходит «точка чтения» на 60% высоты экрана.
 */
const steps = [
  {
    title: 'Рассказываете, что нужно',
    text: 'Для кого и для чего нужен мерч, примерный тираж, бюджет и сроки. Остальное уточним сами.',
  },
  {
    title: 'Отсекаем лишнее',
    text: 'Предлагаем только те варианты, которые действительно подходят под вашу задачу. Вам остаётся выбрать.',
  },
  {
    title: 'Показываем, как это будет выглядеть',
    text: 'Готовим макет с вашим логотипом и согласовываем детали до запуска в производство.',
  },
  {
    title: 'Показываем первый образец',
    text: 'Отправляем фото или видео первого образца. Вы видите результат до того, как мы запустим весь тираж.',
  },
  {
    title: 'Производим и комплектуем',
    text: 'Наносим, проверяем, комплектуем и готовим заказ к выдаче или отправке.',
  },
]

const listRef = ref<HTMLElement | null>(null)
const stepRefs = ref<HTMLElement[]>([])
const progress = ref(0)
const activeCount = ref(0)
let ticking = false

function stepNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function update() {
  ticking = false
  const list = listRef.value
  if (!list)
    return

  const readLine = window.innerHeight * 0.6
  const rect = list.getBoundingClientRect()
  progress.value = Math.min(Math.max((readLine - rect.top) / rect.height, 0), 1)
  activeCount.value = stepRefs.value.filter(el => el.getBoundingClientRect().top + 20 < readLine).length
}

function onScroll() {
  if (ticking)
    return
  ticking = true
  requestAnimationFrame(update)
}

function scrollToForm() {
  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <section class="py-12 md:py-20 lg:py-24">
    <div class="grid mx-auto max-w-7xl gap-8 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-8 sm:px-6">
      <div class="lg:sticky lg:top-36 lg:self-start">
        <FadeComponent>
          <span class="inline-flex items-center gap-2 border border-black/10 rounded-full px-3 py-1 text-xs text-neutral-600 font-semibold tracking-[0.15em] uppercase">
            <span class="size-2 rounded-full bg-primary" aria-hidden="true" />
            Как мы работаем
          </span>
          <h2 class="mt-4 text-4xl font-black leading-[0.95] tracking-tight uppercase md:text-6xl">
            От заявки
            <span class="block text-primary">до готового мерча</span>
          </h2>
        </FadeComponent>

        <FadeComponent :delay="100" class="hidden lg:block">
          <Button size="lg" class="mt-10 h-12 rounded-full px-7 text-base shadow-[0_18px_36px_rgba(254,72,25,0.28)]" @click="scrollToForm">
            Оставить заявку
          </Button>
        </FadeComponent>
      </div>

      <div>
        <ol ref="listRef" class="relative">
          <!-- дорожка и её заполнение; центр совпадает с центром кружков (size-10 → 20px) -->
          <span class="absolute bottom-6 left-5 top-6 w-px bg-black/10" aria-hidden="true" />
          <span
            class="absolute left-5 top-6 w-px bg-primary transition-[height] duration-150 ease-out"
            :style="{ height: `calc((100% - 3rem) * ${progress})` }"
            aria-hidden="true"
          />

          <li
            v-for="(step, index) in steps"
            :key="step.title"
            ref="stepRefs"
            class="relative flex gap-5 pb-10 last:pb-0 md:gap-8 md:pb-14"
          >
            <span
              class="relative z-10 size-10 flex shrink-0 items-center justify-center border rounded-full text-sm font-bold transition-colors duration-300"
              :class="index < activeCount
                ? 'border-primary bg-primary text-white shadow-[0_8px_20px_rgba(254,72,25,0.35)]'
                : 'border-black/10 bg-white text-neutral-400'"
            >
              {{ stepNumber(index) }}
            </span>

            <FadeComponent class="pt-1.5">
              <span
                class="text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-300"
                :class="index < activeCount ? 'text-primary' : 'text-neutral-400'"
              >
                Шаг {{ stepNumber(index) }}
              </span>
              <h3 class="mt-2 text-xl font-bold leading-tight md:text-3xl">
                {{ step.title }}
              </h3>
              <p class="mt-2 max-w-xl text-sm text-neutral-600 leading-6 md:mt-3 md:text-lg md:leading-8">
                {{ step.text }}
              </p>
            </FadeComponent>
          </li>
        </ol>

        <Button size="lg" class="mt-10 h-12 w-full rounded-full text-base shadow-[0_18px_36px_rgba(254,72,25,0.28)] sm:w-auto sm:px-7 lg:hidden" @click="scrollToForm">
          Оставить заявку
        </Button>
      </div>
    </div>
  </section>
</template>
