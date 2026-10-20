<script setup lang="ts">
import { ADDRESS_FULL, EMAILS, PHONE, PHONE_DIGITS, WHATSAPP_LINK } from '~/constants/contacts'

const year = new Date().getFullYear()

const linksLeft = [
  { label: 'Каталог', to: '/market' },
  { label: 'Портфолио', to: '/portfolio' },
] as const

const linksRight = [
  { label: 'Услуги', to: '/services' },
  { label: 'О нас', to: '/about' },
  { label: 'Контакты', to: '/contacts' },
] as const

const navLink
  = 'group inline-flex items-center gap-2 text-sm md:text-base text-white/80 transition duration-300 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg'

const socialBtn
  = 'h-11 w-11 md:h-12 md:w-12 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white backdrop-blur-xs transition duration-300 hover:scale-105 hover:border-white/30 hover:bg-white hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/70'
</script>

<template>
  <footer class="relative overflow-hidden rounded-t-[2rem] bg-black text-white">
    <!-- background glow -->
    <div
      class="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-navy/20 blur-3xl"
      aria-hidden="true"
    />

    <!-- huge background word -->
    <div
      class="pointer-events-none absolute bottom-[-2vw] left-1/2 w-full select-none whitespace-nowrap text-center text-[20vw] text-white/6 font-extrabold leading-none tracking-[0.15em] uppercase -translate-x-1/2 md:text-[14vw]"
      aria-hidden="true"
    >
      BRILLEX
    </div>

    <div class="relative z-10 mx-auto max-w-7xl px-5 pb-4 pt-7 md:px-10 md:pb-10 md:pt-18">
      <!-- top CTA -->
      <div class="flex flex-col gap-4 border-b border-white/15 pb-5 md:flex-row md:gap-6 md:items-end md:justify-between md:pb-12">
        <div class="max-w-2xl">
          <p class="text-sm text-white/60 font-medium tracking-[0.25em] uppercase">
            Brillex
          </p>

          <h2 class="mt-3 text-2xl font-bold leading-tight tracking-tight md:mt-4 md:text-5xl md:leading-none">
            Создаём мерч,
            <span class="text-primary">
              который выглядит
            </span>
            стильно и современно
          </h2>

          <p class="mt-3 max-w-xl text-sm text-white/75 leading-6 md:mt-4 md:text-base md:leading-6">
            Помогаем брендам, командам и проектам создавать качественный мерч с
            характером — от идеи до готового результата.
          </p>
        </div>

        <div class="shrink-0">
          <RouterLink
            to="/contacts"
            class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm text-primary font-semibold transition duration-300 hover:-translate-y-1 md:px-7 md:py-3.5 md:text-base hover:shadow-lg"
          >
            Обсудить заказ
          </RouterLink>
        </div>
      </div>

      <!-- main content -->
      <div class="grid grid-cols-2 gap-x-5 gap-y-5 py-5 md:grid-cols-[1.2fr_1fr_1fr] md:gap-12 md:py-12">
        <!-- brand / socials: на телефоне — одна строка во всю ширину -->
        <div class="col-span-2 flex items-center justify-between md:col-span-1 md:block">
          <RouterLink
            to="/"
            class="inline-flex items-center text-2xl text-white font-bold tracking-tight"
          >
            BRILLEX
          </RouterLink>

          <p class="mt-4 hidden max-w-sm text-sm text-white/75 leading-7 md:block md:text-base md:leading-6">
            Минималистичный мерч и визуальные решения для тех, кто ценит аккуратный
            стиль, качество и детали.
          </p>

          <div class="flex items-center gap-3 md:mt-6">
            <a
              :href="WHATSAPP_LINK"
              target="_blank"
              rel="noopener noreferrer"
              :class="socialBtn"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <span class="icon-[mdi--whatsapp]" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- nav -->
        <nav aria-label="Footer navigation">
          <p class="text-sm text-white/55 font-semibold tracking-[0.18em] uppercase">
            Навигация
          </p>

          <ul class="grid mt-4 gap-2.5 md:mt-5 md:gap-3">
            <li v-for="link in linksLeft" :key="link.to">
              <RouterLink :to="link.to" :class="navLink">
                <span class="h-1.5 w-1.5 rounded-full bg-white/30 transition group-hover:bg-white" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>

          <ul class="grid mt-2.5 gap-2.5 md:mt-6 md:gap-3">
            <li v-for="link in linksRight" :key="link.to">
              <RouterLink :to="link.to" :class="navLink">
                <span class="h-1.5 w-1.5 rounded-full bg-white/30 transition group-hover:bg-white" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- contacts -->
        <address class="not-italic">
          <p class="text-sm text-white/55 font-semibold tracking-[0.18em] uppercase">
            Контакты
          </p>

          <div class="mt-4 space-y-3 md:mt-5 md:space-y-5">
            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Телефон
              </p>
              <a
                :href="`tel:+${PHONE_DIGITS}`"
                class="mt-1 inline-block whitespace-nowrap text-base text-white font-semibold transition md:text-xl hover:text-navy"
              >
                {{ PHONE }}
              </a>
            </div>

            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Почта
              </p>
              <a
                v-for="email in EMAILS"
                :key="email"
                :href="`mailto:${email}`"
                class="mt-1 block break-words text-sm text-white/80 transition md:text-base hover:text-white"
              >
                {{ email }}
              </a>
            </div>

            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Адрес
              </p>
              <p class="mt-1 text-sm text-white/80 md:text-base">
                {{ ADDRESS_FULL }}
              </p>
            </div>
          </div>
        </address>
      </div>

      <!-- bottom -->
      <div class="flex flex-col gap-2 border-t border-white/15 pt-5 text-xs text-white/60 md:gap-3 md:pt-6 md:text-sm md:flex-row md:items-center md:justify-between">
        <p>© {{ year }} BRILLEX. Все права защищены.</p>

        <div class="flex flex-wrap items-center gap-4">
          <RouterLink to="/privacy" class="transition hover:text-white">
            Политика конфиденциальности
          </RouterLink>
          <RouterLink to="/terms" class="transition hover:text-white">
            Условия использования
          </RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>
