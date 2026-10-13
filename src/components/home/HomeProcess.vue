<script setup lang="ts">
import { ArrowDown } from '@lucide/vue'
import { motion, useScroll, useTransform } from 'motion-v'
import { ref } from 'vue'
import { Button } from '~/components/ui/button'

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

/* Timeline (Aceternity UI, 21st.dev): линия слева заполняется по мере прокрутки шагов */
const listRef = ref<HTMLElement | null>(null)
const { scrollYProgress } = useScroll({
  target: listRef,
  offset: ['start 70%', 'end 60%'],
})
const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])
</script>

<template>
  <section class="bg-neutral-50 py-20 md:py-28">
    <div class="grid mx-auto max-w-7xl gap-12 px-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8 sm:px-6">
      <div class="lg:sticky lg:top-36 lg:self-start">
        <p class="text-sm text-primary font-semibold tracking-[0.25em] uppercase">
          Как мы работаем
        </p>
        <h2 class="mt-4 text-4xl font-black leading-none tracking-tight uppercase md:text-6xl">
          От заявки до готового мерча
        </h2>
        <Button as-child size="lg" class="mt-8 hidden h-12 rounded-full px-7 text-base lg:inline-flex">
          <RouterLink :to="{ hash: '#brief' }">
            Оставить заявку
            <ArrowDown class="size-5" />
          </RouterLink>
        </Button>
      </div>

      <div>
        <ol ref="listRef" class="relative space-y-10 md:space-y-14">
          <!-- ось таймлайна и её заполнение -->
          <span class="absolute bottom-2 left-[1.375rem] top-2 w-px bg-black/10 md:left-[1.875rem]" aria-hidden="true" />
          <motion.span
            class="absolute bottom-2 left-[1.375rem] top-2 w-px origin-top bg-primary md:left-[1.875rem]"
            :style="{ scaleY: lineScale }"
            aria-hidden="true"
          />

          <motion.li
            v-for="(step, index) in steps"
            :key="step.title"
            class="relative grid grid-cols-[auto_1fr] gap-5 md:gap-8"
            :initial="{ opacity: 0, y: 32 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, amount: 0.6 }"
            :transition="{ duration: 0.5 }"
          >
            <span class="relative z-10 size-11 flex items-center justify-center rounded-full bg-black text-sm text-white font-bold tabular-nums ring-8 ring-neutral-50 md:size-15 md:text-lg">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <div class="pt-1 md:pt-3">
              <p class="text-xs text-neutral-400 font-semibold tracking-[0.25em] uppercase">
                Шаг {{ String(index + 1).padStart(2, '0') }}
              </p>
              <h3 class="mt-2 text-xl font-bold leading-tight md:text-3xl">
                {{ step.title }}
              </h3>
              <p class="mt-3 max-w-xl text-base text-neutral-600 leading-7 md:text-lg">
                {{ step.text }}
              </p>
            </div>
          </motion.li>
        </ol>

        <Button as-child size="lg" class="mt-12 h-12 w-full rounded-full px-7 text-base lg:hidden sm:w-auto">
          <RouterLink :to="{ hash: '#brief' }">
            Оставить заявку
            <ArrowDown class="size-5" />
          </RouterLink>
        </Button>
      </div>
    </div>
  </section>
</template>
