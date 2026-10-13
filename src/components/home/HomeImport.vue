<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import { motion } from 'motion-v'
import { Button } from '~/components/ui/button'
import { whatsappWith } from './content'

const countries = ['Китай', 'Россия', 'Беларусь']
const factors = ['Тираж', 'Бюджет', 'Сроки']
</script>

<template>
  <section class="px-4 py-20 lg:px-8 md:py-28 sm:px-6">
    <motion.div
      class="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-black px-6 py-14 text-white md:px-14 md:py-20"
      :initial="{ opacity: 0, y: 40 }"
      :while-in-view="{ opacity: 1, y: 0 }"
      :viewport="{ once: true, amount: 0.3 }"
      :transition="{ duration: 0.7 }"
    >
      <!-- сетка точек и оранжевое свечение: фон из 21st.dev «Dot Pattern» -->
      <div
        class="[background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)] absolute inset-0 opacity-30 -z-10"
        aria-hidden="true"
      />
      <div class="absolute size-96 rounded-full bg-primary/40 blur-3xl -right-24 -top-32 -z-10" aria-hidden="true" />

      <div class="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <h2 class="text-4xl font-black leading-none tracking-tight uppercase md:text-6xl">
            Не нашли?<br>
            <span class="text-primary">Привезём.</span>
          </h2>
          <p class="mt-6 max-w-xl text-base text-white/70 leading-7 md:text-lg">
            Если нужной позиции нет в наличии — найдём и привезём под заказ из Китая, России или Беларуси.
            Учтём тираж, бюджет и сроки.
          </p>
        </div>

        <div class="space-y-6">
          <ul class="flex flex-wrap gap-2" aria-label="Страны поставки">
            <li
              v-for="country in countries"
              :key="country"
              class="border border-white/15 rounded-full bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur md:text-base"
            >
              {{ country }}
            </li>
          </ul>
          <ul class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/50 tracking-[0.18em] uppercase" aria-label="Что учитываем">
            <li v-for="factor in factors" :key="factor" class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-primary" />
              {{ factor }}
            </li>
          </ul>
          <Button as-child size="lg" class="h-12 w-full rounded-full px-7 text-base sm:w-auto">
            <a :href="whatsappWith('Здравствуйте! Хочу подобрать товар под заказ.')" target="_blank" rel="noopener noreferrer">
              <MessageCircle class="size-5" />
              Подобрать товар под заказ
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  </section>
</template>
