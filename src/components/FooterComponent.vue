<script setup lang="ts">
import { ADDRESS_FULL, EMAILS, PHONE, PHONE_DIGITS, WHATSAPP_LINK } from '~/constants/contacts'

const year = new Date().getFullYear()

const links = [
  { label: 'Каталог', to: '/market' },
  { label: 'Портфолио', to: '/portfolio' },
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

    <div class="relative z-10 mx-auto max-w-7xl px-6 pb-8 pt-14 md:px-10 md:pb-10 md:pt-18">
      <!-- logo + slogan -->
      <div class="border-b border-white/15 pb-10 md:pb-12">
        <RouterLink to="/" class="inline-flex" aria-label="Brillex — на главную">
          <img
            src="/logo.webp"
            alt="Brillex"
            class="h-16 w-auto object-contain brightness-0 invert md:h-20"
          >
        </RouterLink>

        <h2 class="mt-6 text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">
          Результат
          <span class="text-primary">выше ожиданий.</span>
        </h2>
      </div>

      <!-- main content -->
      <div class="grid gap-10 py-10 md:grid-cols-2 md:gap-12 md:py-12">
        <!-- nav -->
        <nav aria-label="Footer navigation">
          <p class="text-sm text-white/55 font-semibold tracking-[0.18em] uppercase">
            Навигация
          </p>

          <ul class="grid mt-5 gap-3">
            <li v-for="link in links" :key="link.to">
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

          <div class="mt-5 space-y-5">
            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Телефон / WhatsApp
              </p>
              <div class="mt-1 flex items-center gap-3">
                <a
                  :href="`tel:+${PHONE_DIGITS}`"
                  class="inline-block text-lg text-white font-semibold transition md:text-xl hover:text-primary"
                >
                  {{ PHONE }}
                </a>
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

            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Почта
              </p>
              <a
                v-for="email in EMAILS"
                :key="email"
                :href="`mailto:${email}`"
                class="mt-1 block text-white/80 transition hover:text-white"
              >
                {{ email }}
              </a>
            </div>

            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Адрес
              </p>
              <p class="mt-1 text-white/80">
                {{ ADDRESS_FULL }}
              </p>
            </div>
          </div>
        </address>
      </div>

      <!-- bottom -->
      <div class="flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
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
