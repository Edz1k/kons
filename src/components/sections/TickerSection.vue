<script setup lang="ts">
/*
 * Бегущая строка — Marquee из Magic UI (21st.dev).
 * Содержимое повторяется несколько раз, каждая копия уезжает на свою ширину + gap,
 * поэтому стык между копиями не виден и движение бесконечное.
 */
const items = [
  'Склад в Алматы',
  'Собственное производство',
  'UV- и DTF-печать от 1 дня',
  'Поставки под заказ',
  'Фото первого образца',
  'Отправка по Казахстану',
]

const copies = 4
</script>

<template>
  <section class="overflow-hidden bg-black py-4 text-white md:py-6" aria-label="Наши преимущества">
    <p class="sr-only">
      {{ items.join(', ') }}
    </p>

    <!-- края растворяются, чтобы строка не обрывалась резко -->
    <div
      class="group flex [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [--duration:40s] [--gap:1.5rem] md:[--gap:2.5rem]"
      style="gap: var(--gap)"
      aria-hidden="true"
    >
      <div
        v-for="copy in copies"
        :key="copy"
        class="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style="gap: var(--gap)"
      >
        <template v-for="item in items" :key="item">
          <span class="whitespace-nowrap text-base font-bold tracking-tight uppercase md:text-2xl">
            {{ item }}
          </span>
          <span class="text-base text-primary md:text-2xl">✦</span>
        </template>
      </div>
    </div>
  </section>
</template>
