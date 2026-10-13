<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import { motion, useScroll, useTransform } from 'motion-v'
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { stockPhotos, whatsappWith } from './content'
import NumberTicker from './NumberTicker.vue'

const stats = [
  { value: 250_000, label: 'ручек' },
  { value: 30_000, label: 'ланьярдов' },
  { value: 22_000, label: 'блокнотов' },
  { value: 12_000, label: 'бутылок' },
  { value: 10_000, label: 'бейджей' },
  { value: 5_000, label: 'шоперов' },
]

const sectionRef = ref<HTMLElement | null>(null)
const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ['start end', 'end start'],
})

// Картинки едут навстречу друг другу, пока секция проходит через экран
const leftY = useTransform(scrollYProgress, [0, 1], [150, -135])
const rightY = useTransform(scrollYProgress, [0, 1], [-120, 135])
</script>

<template>
  <section ref="sectionRef" class="relative isolate overflow-hidden py-20 md:py-28">
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <motion.img
        :src="stockPhotos.left.src"
        alt=""
        loading="lazy"
        decoding="async"
        class="absolute max-w-[440px] w-[52vw] object-contain opacity-90 drop-shadow-[0_28px_48px_rgba(0,0,0,0.16)] -bottom-12 -left-20 lg:w-[26vw] sm:w-[38vw] md:-left-10"
        :style="{ y: leftY, rotate: 4 }"
      />
      <motion.img
        :src="stockPhotos.right.src"
        alt=""
        loading="lazy"
        decoding="async"
        class="absolute top-0 max-w-[460px] w-[56vw] object-contain opacity-90 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] -right-20 lg:w-[28vw] sm:w-[40vw] md:-right-10"
        :style="{ y: rightY, rotate: -7 }"
      />
    </div>

    <div class="mx-auto max-w-5xl px-4 text-center lg:px-8 sm:px-6">
      <motion.h2
        class="text-4xl font-bold leading-[0.95] tracking-tight uppercase md:text-7xl sm:text-5xl"
        :initial="{ opacity: 0, y: 32 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, amount: 0.5 }"
        :transition="{ duration: 0.6 }"
      >
        В наличии.<br>
        <span class="text-primary">Здесь и сейчас.</span>
      </motion.h2>

      <p class="mx-auto mt-6 max-w-2xl text-base text-neutral-600 leading-7 md:text-lg">
        Закупаем продукцию напрямую у фабрик и держим самые востребованные позиции в наличии.
        Не нужно ждать поставку из-за рубежа — ваш мерч уже готов к брендированию.
      </p>

      <dl class="grid grid-cols-2 mx-auto mt-12 max-w-4xl gap-3 md:grid-cols-3 md:gap-4">
        <motion.div
          v-for="(stat, index) in stats"
          :key="stat.label"
          class="border border-black/5 rounded-3xl bg-white/80 px-4 py-6 backdrop-blur-sm md:py-8"
          :initial="{ opacity: 0, y: 24 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, amount: 0.4 }"
          :transition="{ duration: 0.5, delay: index * 0.06 }"
        >
          <dt class="sr-only">
            {{ stat.label }}
          </dt>
          <dd class="m-0">
            <span class="block text-3xl text-black font-extrabold tracking-tight lg:text-5xl sm:text-4xl">
              <NumberTicker :value="stat.value" :delay="index * 0.06" /><span class="text-primary">+</span>
            </span>
            <span class="mt-2 block text-sm text-neutral-500 font-medium tracking-wide uppercase md:text-base">
              {{ stat.label }}
            </span>
          </dd>
        </motion.div>
      </dl>

      <p class="mx-auto mt-8 max-w-xl text-sm text-neutral-500">
        Склад постоянно пополняется. Актуальные цвета и остатки уточняйте у менеджера.
      </p>

      <Button as-child size="lg" class="mt-6 h-12 rounded-full px-7 text-base">
        <a :href="whatsappWith('Здравствуйте! Хочу уточнить остатки на складе.')" target="_blank" rel="noopener noreferrer">
          <MessageCircle class="size-5" />
          Уточнить остатки
        </a>
      </Button>
    </div>
  </section>
</template>
