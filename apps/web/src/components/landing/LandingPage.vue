<script setup lang="ts">
import type { Landing } from '~/data/landings'
import { Button } from '@brillex/shared/components/ui/button'
import { computed } from 'vue'
import { useJsonLd, usePageSeo } from '~/composables/usePageSeo'
import { WHATSAPP_LINK } from '~/constants/contacts'
import { LANDING_FACTS, LANDING_LINKS } from '~/data/landings'

/*
 * Шаблон посадочной страницы под рекламу и поиск.
 * Порядок блоков: первый экран → факты → идеи → наборы с ценами (если есть) → условия (если есть)
 * → реальные работы → как работаем → вопросы → форма заявки.
 */
const props = defineProps<{ landing: Landing }>()

const landing = computed(() => props.landing)

usePageSeo(() => ({
  title: landing.value.seo.title,
  description: landing.value.seo.description,
}))

useJsonLd('faq', () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': landing.value.faq.map(item => ({
    '@type': 'Question',
    'name': item.q,
    'acceptedAnswer': { '@type': 'Answer', 'text': item.a },
  })),
}))

const whatsappLink = computed(() => `${WHATSAPP_LINK}?text=${encodeURIComponent(landing.value.whatsappText)}`)

const terms = computed(() => [
  { label: 'Минимальный тираж', value: landing.value.terms.minQty },
  { label: 'Сроки', value: landing.value.terms.leadTime },
  { label: 'Заказать до', value: landing.value.terms.deadline },
].filter(item => item.value))

/** Короткая строка условий на первом экране: «Тираж от 50 шт · Заказ до 25 декабря». */
const heroTerms = computed(() => [
  landing.value.terms.minQty && `Тираж ${landing.value.terms.minQty}`,
  landing.value.terms.leadTime && `Сроки ${landing.value.terms.leadTime}`,
  landing.value.terms.deadline && `Заказ до ${landing.value.terms.deadline}`,
].filter(Boolean).join(' · '))

const otherLandings = computed(() => LANDING_LINKS.filter(link => link.to !== landing.value.path))

function scrollToForm() {
  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const ctaShadow = 'shadow-[0_18px_36px_rgba(254,72,25,0.28)]'
const eyebrowClass = 'inline-flex items-center gap-2 border border-black/10 rounded-full px-3 py-1 text-xs text-neutral-600 font-semibold tracking-[0.15em] uppercase'
const h2Class = 'mt-4 text-3xl font-black leading-[0.95] tracking-tight uppercase md:text-5xl'
</script>

<template>
  <!-- первый экран -->
  <section class="pb-10 pt-6 md:pb-16 md:pt-12">
    <div class="grid mx-auto max-w-7xl items-center gap-8 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 sm:px-6">
      <div>
        <span :class="eyebrowClass">
          <span class="size-2 rounded-full bg-primary" aria-hidden="true" />
          {{ landing.eyebrow }}
        </span>

        <h1 class="mt-4 text-4xl font-black leading-[0.95] tracking-tight uppercase md:text-6xl xl:text-7xl">
          {{ landing.title }}
          <span class="mt-2 block text-primary">{{ landing.titleAccent }}</span>
        </h1>

        <p class="mt-5 max-w-xl text-base text-neutral-600 leading-7 md:mt-6 md:text-lg md:leading-8">
          {{ landing.lead }}
        </p>

        <div class="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button as-child size="lg" class="h-12 rounded-full px-7 text-base" :class="ctaShadow">
            <a :href="whatsappLink" target="_blank" rel="noopener noreferrer">
              <span class="icon-[mdi--whatsapp] size-5" aria-hidden="true" />
              Обсудить в WhatsApp
            </a>
          </Button>
          <Button size="lg" variant="outline" class="h-12 rounded-full px-7 text-base" @click="scrollToForm">
            Оставить заявку
          </Button>
        </div>

        <p v-if="heroTerms" class="mt-4 text-sm text-neutral-800 font-semibold">
          {{ heroTerms }}
        </p>

        <p v-if="landing.note" class="mt-5 max-w-xl text-sm text-neutral-500 leading-6">
          {{ landing.note }}
        </p>
      </div>

      <div class="overflow-hidden rounded-3xl bg-neutral-100">
        <img
          :src="landing.heroImage"
          :alt="landing.heroAlt"
          class="aspect-[4/3] w-full object-cover"
          width="1200"
          height="900"
          fetchpriority="high"
        >
      </div>
    </div>
  </section>

  <!-- факты -->
  <section aria-label="Почему Brillex" class="pb-12 md:pb-20">
    <dl class="grid mx-auto max-w-7xl grid-cols-2 gap-2 px-4 md:grid-cols-4 md:gap-3 lg:px-8 sm:px-6">
      <div
        v-for="(fact, index) in LANDING_FACTS"
        :key="fact.value"
        class="flex flex-col rounded-2xl px-4 py-4 md:rounded-3xl md:p-6"
        :class="index === 0 ? 'bg-black text-white' : 'bg-neutral-100'"
      >
        <dt class="order-2 mt-1 text-xs leading-5 md:text-sm" :class="index === 0 ? 'text-white/60' : 'text-neutral-500'">
          {{ fact.label }}
        </dt>
        <dd class="order-1 m-0 text-lg font-black tracking-tight md:text-2xl">
          {{ fact.value }}
        </dd>
      </div>
    </dl>
  </section>

  <!-- идеи -->
  <section class="py-10 md:py-16">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <FadeComponent>
        <h2 :class="h2Class">
          {{ landing.ideasTitle }}
        </h2>
      </FadeComponent>

      <ul class="grid mt-8 gap-4 md:mt-10 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(idea, index) in landing.ideas" :key="idea.title">
          <FadeComponent :delay="index * 60" class="h-full">
            <article class="h-full flex flex-col overflow-hidden rounded-3xl bg-neutral-100">
              <img :src="idea.image" :alt="idea.alt" class="aspect-[4/3] w-full object-cover" loading="lazy" width="600" height="450">
              <div class="p-5 md:p-6">
                <h3 class="text-lg font-bold leading-tight md:text-xl">
                  {{ idea.title }}
                </h3>
                <p class="mt-2 text-sm text-neutral-600 leading-6">
                  {{ idea.text }}
                </p>
                <RouterLink v-if="idea.to" :to="idea.to" class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  Смотреть в каталоге
                  <span class="icon-[mdi--arrow-right] size-4" aria-hidden="true" />
                </RouterLink>
              </div>
            </article>
          </FadeComponent>
        </li>
      </ul>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <RouterLink to="/katalog" class="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline md:text-base">
          Смотреть каталог по категориям
          <span class="icon-[mdi--arrow-right] size-4" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- готовые наборы с ценами: только если есть реальные данные -->
  <section v-if="landing.offers.length" class="py-10 md:py-16">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <h2 :class="h2Class">
        Готовые наборы
      </h2>
      <ul class="grid mt-8 gap-4 md:mt-10 md:grid-cols-3">
        <li v-for="offer in landing.offers" :key="offer.title" class="flex flex-col overflow-hidden border border-black/10 rounded-3xl">
          <img v-if="offer.image" :src="offer.image" :alt="offer.title" class="aspect-[4/3] w-full object-cover" loading="lazy">
          <div class="flex flex-1 flex-col p-6">
            <h3 class="text-xl font-bold">
              {{ offer.title }}
            </h3>
            <p class="mt-2 flex-1 text-sm text-neutral-600 leading-6">
              {{ offer.items }}
            </p>
            <p class="mt-4 text-2xl font-black">
              от {{ offer.priceFrom }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </section>

  <!-- условия: только заполненные -->
  <section v-if="terms.length" class="pb-10 md:pb-16">
    <dl class="grid mx-auto max-w-7xl gap-3 px-4 md:grid-cols-3 lg:px-8 sm:px-6">
      <div v-for="term in terms" :key="term.label" class="border border-black/10 rounded-3xl p-6">
        <dt class="text-xs text-neutral-500 font-semibold tracking-[0.15em] uppercase">
          {{ term.label }}
        </dt>
        <dd class="m-0 mt-2 text-2xl font-black">
          {{ term.value }}
        </dd>
      </div>
    </dl>
  </section>

  <!-- реальные работы -->
  <section class="py-10 md:py-16">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <FadeComponent>
        <span :class="eyebrowClass">
          <span class="size-2 rounded-full bg-primary" aria-hidden="true" />
          Наши работы
        </span>
        <h2 :class="h2Class">
          Сделали для
          <span class="text-primary">клиентов</span>
        </h2>
      </FadeComponent>

      <ul class="grid mt-8 gap-4 md:mt-10 md:grid-cols-3">
        <li v-for="(work, index) in landing.works" :key="work.image">
          <FadeComponent :delay="index * 60">
            <figure class="m-0">
              <div class="overflow-hidden rounded-3xl bg-neutral-100">
                <img :src="work.image" :alt="work.caption" class="aspect-[4/5] w-full object-cover" loading="lazy" width="900" height="1125">
              </div>
              <figcaption class="mt-3 text-sm text-neutral-600 leading-6">
                {{ work.caption }}
              </figcaption>
            </figure>
          </FadeComponent>
        </li>
      </ul>

      <RouterLink to="/portfolio" class="mt-6 inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline md:text-base">
        Все работы
        <span class="icon-[mdi--arrow-right] size-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>

  <StepsSection />

  <!-- вопросы -->
  <section class="py-10 md:py-16">
    <div class="grid mx-auto max-w-7xl gap-8 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-8 sm:px-6">
      <div>
        <h2 :class="h2Class">
          Частые
          <span class="block text-primary">вопросы</span>
        </h2>
        <Button as-child size="lg" class="mt-8 hidden h-12 rounded-full px-7 text-base lg:inline-flex" :class="ctaShadow">
          <a :href="whatsappLink" target="_blank" rel="noopener noreferrer">
            <span class="icon-[mdi--whatsapp] size-5" aria-hidden="true" />
            Задать свой вопрос
          </a>
        </Button>
      </div>

      <div class="divide-y divide-black/10 border-y border-black/10">
        <details v-for="item in landing.faq" :key="item.q" class="group py-5">
          <summary class="flex cursor-pointer list-none items-start [&::-webkit-details-marker]:hidden justify-between gap-4 text-base font-bold leading-snug md:text-lg">
            {{ item.q }}
            <span class="icon-[mdi--plus] mt-0.5 size-5 shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p class="mt-3 max-w-2xl text-sm text-neutral-600 leading-6 md:text-base md:leading-7">
            {{ item.a }}
          </p>
        </details>
      </div>
    </div>
  </section>

  <!-- перелинковка -->
  <nav aria-label="Другие решения" class="pb-6">
    <div class="mx-auto max-w-7xl flex flex-wrap gap-2 px-4 lg:px-8 sm:px-6">
      <RouterLink
        v-for="link in otherLandings"
        :key="link.to"
        :to="link.to"
        class="border border-black/10 rounded-full px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
      >
        {{ link.label }}
      </RouterLink>
    </div>
  </nav>

  <ContactForm :source="landing.source" />
</template>
