<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { WHATSAPP_LINK } from '~/constants/contacts'
import { cn } from '~/lib/utils'

/*
 * Bento-сетка статистики (идея с 21st.dev) + Number Ticker.
 * На десктопе ручки — большая карточка 2×2, остальные вокруг неё.
 * На телефоне все шесть карточек одинаковые (3×2), чтобы блок влезал в экран Safari
 * вместе с липким навбаром (на iPhone 15 Pro под контент остаётся ~550px).
 */
const stats = [
  { value: 300_000, label: 'ручек', span: 'lg:col-span-2 lg:row-span-2' },
  { value: 30_000, label: 'ланьярдов' },
  { value: 22_000, label: 'блокнотов' },
  { value: 12_000, label: 'бутылок' },
  { value: 10_000, label: 'бейджей' },
  { value: 5_000, label: 'шоперов' },
]

const stockLink = `${WHATSAPP_LINK}?text=${encodeURIComponent('Здравствуйте! Хочу уточнить остатки на складе.')}`
</script>

<template>
  <section class="py-8 md:py-20 lg:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-10">
        <FadeComponent>
          <span class="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold tracking-[0.15em] text-neutral-600 uppercase">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
              <span class="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            На складе в Алматы
          </span>
          <h2 class="mt-4 text-4xl leading-[0.95] font-black tracking-tight uppercase md:text-6xl">
            В наличии.<br>
            <span class="text-primary">Здесь и сейчас.</span>
          </h2>
        </FadeComponent>

        <FadeComponent :delay="100">
          <p class="max-w-xl text-sm leading-6 text-neutral-600 md:text-lg md:leading-8">
            Закупаем продукцию напрямую у фабрик и держим самые востребованные позиции в наличии.
            Не нужно ждать поставку из-за рубежа — ваш мерч уже готов к брендированию.
          </p>
        </FadeComponent>
      </div>

      <dl class="mt-5 grid grid-cols-3 gap-2 md:mt-12 md:grid-cols-2 md:gap-3 lg:grid-cols-3 lg:grid-rows-3">
        <FadeComponent
          v-for="(stat, index) in stats"
          :key="stat.label"
          :delay="index * 60"
          :class="stat.span"
        >
          <div
            :class="cn(
              'relative isolate flex h-full flex-col justify-end overflow-hidden rounded-2xl bg-neutral-100 px-3 py-3.5 transition-transform duration-300 hover:-translate-y-1 md:rounded-3xl md:p-6',
              index === 0 && 'bg-black text-white',
            )"
          >
            <!-- у главной карточки — сетка точек и оранжевое свечение -->
            <template v-if="index === 0">
              <div
                class="absolute inset-0 -z-10 hidden opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_75%)] lg:block"
                aria-hidden="true"
              />
              <div class="absolute -top-24 -right-24 -z-10 hidden size-80 rounded-full bg-primary/40 blur-3xl lg:block" aria-hidden="true" />
            </template>

            <dt class="order-2 mt-1 text-[10px] font-semibold tracking-[0.06em] uppercase md:text-sm md:tracking-[0.15em]" :class="index === 0 ? 'text-white/60' : 'text-neutral-500'">
              {{ stat.label }}
            </dt>
            <dd class="order-1 m-0 font-black tracking-tight" :class="index === 0 ? 'text-[min(1.125rem,4.6vw)] md:text-5xl lg:text-8xl' : 'text-[min(1.125rem,4.6vw)] md:text-5xl'">
              <NumberTicker :value="stat.value" :delay="index * 0.06" /><span class="text-primary">+</span>
            </dd>
          </div>
        </FadeComponent>
      </dl>

      <div class="mt-5 flex flex-col gap-4 md:mt-8 sm:flex-row sm:items-center sm:justify-between">
        <p class="max-w-md text-sm leading-6 text-neutral-500">
          Склад постоянно пополняется. Актуальные цвета и остатки уточняйте у менеджера.
        </p>
        <Button as-child size="lg" class="h-12 shrink-0 rounded-full px-7 text-base shadow-[0_18px_36px_rgba(254,72,25,0.28)]">
          <a :href="stockLink" target="_blank" rel="noopener noreferrer">
            <span class="icon-[mdi--whatsapp] size-5" aria-hidden="true" />
            Уточнить остатки
          </a>
        </Button>
      </div>
    </div>
  </section>
</template>
