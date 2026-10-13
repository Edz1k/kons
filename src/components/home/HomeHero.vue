<script setup lang="ts">
import { ArrowRight, MessageCircle } from '@lucide/vue'
import { motion, useReducedMotion } from 'motion-v'
import { computed } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { heroPhotos, whatsappWith } from './content'

/*
 * 3D Marquee (Aceternity UI, 21st.dev), портирован на Vue + motion-v:
 * наклонённая сетка из четырёх колонок, соседние колонки едут навстречу друг другу.
 */
const reduceMotion = useReducedMotion()

const columns = computed(() => {
  // Повторяем фото, чтобы колонки были длиннее экрана при любом их количестве
  const pool = Array.from({ length: 4 }, () => heroPhotos).flat()
  const perColumn = Math.ceil(pool.length / 4)
  return Array.from({ length: 4 }, (_, i) => pool.slice(i * perColumn, (i + 1) * perColumn))
})

const titleLines = [
  { text: 'МЕРЧ ДЛЯ' },
  { text: 'СИЛЬНЫХ' },
  { text: 'БРЕНДОВ', accent: true },
]

const spring = { type: 'spring', stiffness: 120, damping: 18 } as const
</script>

<template>
  <section class="relative overflow-hidden bg-white">
    <div class="grid mx-auto max-w-7xl items-center gap-10 px-4 pb-6 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:min-h-[calc(100svh-7rem)] lg:gap-6 lg:px-8 lg:py-12 sm:px-6">
      <div class="relative z-10 text-center lg:text-left">
        <motion.div
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <Badge variant="outline" class="border-black/10 rounded-full px-3 py-1 text-xs text-neutral-600 font-medium tracking-wide uppercase sm:text-sm">
            <span class="size-1.5 rounded-full bg-primary" />
            Из семейного дела — в новый масштаб
          </Badge>
        </motion.div>

        <h1 class="mt-6 text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-6xl xl:text-8xl">
          <motion.span
            v-for="(line, index) in titleLines"
            :key="line.text"
            class="block"
            :class="line.accent ? 'text-primary' : 'text-black'"
            :initial="{ opacity: 0, y: 48 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ ...spring, delay: 0.1 + index * 0.08 }"
          >
            {{ line.text }}
          </motion.span>
        </h1>

        <motion.p
          class="mx-auto mt-6 max-w-xl text-base text-neutral-600 leading-7 lg:mx-0 sm:text-lg"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6, delay: 0.4 }"
        >
          Корпоративный мерч с нанесением логотипа. Свой склад и производство в Алматы — тысячи товаров уже в наличии.
        </motion.p>

        <motion.div
          class="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ ...spring, delay: 0.55 }"
        >
          <Button as-child size="lg" class="h-13 w-full rounded-full px-7 text-base shadow-[0_18px_36px_rgba(254,72,25,0.28)] sm:w-auto">
            <RouterLink to="/market">
              Смотреть товары
              <ArrowRight class="size-5" />
            </RouterLink>
          </Button>
          <Button as-child size="lg" variant="outline" class="h-13 w-full border-black/15 rounded-full px-7 text-base sm:w-auto">
            <a :href="whatsappWith('Здравствуйте! Хочу получить расчёт на мерч.')" target="_blank" rel="noopener noreferrer">
              <MessageCircle class="size-5" />
              Получить расчёт
            </a>
          </Button>
        </motion.div>
      </div>

      <motion.div
        class="relative h-[360px] overflow-hidden rounded-3xl bg-neutral-100 lg:h-[620px] sm:h-[460px]"
        :initial="{ opacity: 0, scale: 0.96 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ duration: 0.8, delay: 0.2 }"
        aria-hidden="true"
      >
        <div class="size-full flex items-center justify-center">
          <div class="size-[1400px] shrink-0 scale-[0.42] lg:scale-[0.72] sm:scale-[0.55] xl:scale-[0.8]">
            <div
              class="relative right-1/2 top-[22rem] grid grid-cols-4 size-full origin-top-left gap-6"
              style="transform: rotateX(55deg) rotateY(0deg) rotateZ(-45deg); transform-style: preserve-3d;"
            >
              <motion.div
                v-for="(column, colIndex) in columns"
                :key="colIndex"
                class="flex flex-col items-start gap-6"
                :animate="reduceMotion ? undefined : { y: colIndex % 2 === 0 ? 100 : -100 }"
                :transition="{ duration: colIndex % 2 === 0 ? 10 : 15, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }"
              >
                <motion.img
                  v-for="(photo, imageIndex) in column"
                  :key="`${colIndex}-${imageIndex}`"
                  :src="photo.src"
                  alt=""
                  width="970"
                  height="700"
                  loading="lazy"
                  decoding="async"
                  class="aspect-[970/700] w-full rounded-xl object-cover shadow-[0_24px_48px_rgba(0,0,0,0.18)] ring ring-black/5"
                  :while-hover="{ y: -10 }"
                  :transition="{ duration: 0.3, ease: 'easeInOut' }"
                />
              </motion.div>
            </div>
          </div>
        </div>

        <!-- мягкие края, чтобы сетка не обрывалась резко -->
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(245,245,245,0.9)_100%)]" />
      </motion.div>
    </div>
  </section>
</template>
