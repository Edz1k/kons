<script setup lang="ts">
/*
 * Бегущая строка — Marquee из Magic UI (21st.dev).
 * Содержимое повторяется несколько раз, каждая копия сдвигается на свою ширину + gap,
 * поэтому стык между копиями не заметен.
 */
const items = [
  'Склад в Алматы',
  'Собственное производство',
  'UV- и DTF-печать от 1 дня',
  'Поставки под заказ',
  'Фото первого образца',
  'Отправка по Казахстану',
]

const repeat = 4
</script>

<template>
  <section class="overflow-hidden bg-black py-5 text-white md:py-6" aria-label="Наши преимущества">
    <p class="sr-only">
      {{ items.join(', ') }}
    </p>

    <div class="group [--duration:45s] [--gap:2rem] flex" style="gap: var(--gap)" aria-hidden="true">
      <div
        v-for="copy in repeat"
        :key="copy"
        class="animate-marquee flex shrink-0 items-center motion-reduce:animate-none"
        style="gap: var(--gap)"
      >
        <template v-for="item in items" :key="item">
          <span class="whitespace-nowrap text-lg font-semibold tracking-tight uppercase md:text-2xl">
            {{ item }}
          </span>
          <span class="text-lg text-primary md:text-2xl">✦</span>
        </template>
      </div>
    </div>
  </section>
</template>
