<script setup lang="ts">
const year = new Date().getFullYear()

const linksLeft = [
  { label: 'Каталог', to: '/catalog' },
  { label: 'Портфолио', to: '/portfolio' },
] as const

const linksRight = [
  { label: 'Услуги', to: '/services' },
  { label: 'О нас', to: '/about' },
  { label: 'Контакты', to: '/contacts' },
] as const

const navLink
  = 'group inline-flex items-center gap-2 text-sm md:text-base text-white/80 transition duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg'

const socialBtn
  = 'h-11 w-11 md:h-12 md:w-12 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white backdrop-blur-sm transition duration-300 hover:scale-105 hover:border-white/30 hover:bg-white hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
</script>

<template>
  <footer class="relative overflow-hidden rounded-t-[2rem] bg-primary text-white">
    <!-- background glow -->
    <div
      class="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
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
      <!-- top CTA -->
      <div class="flex flex-col gap-6 border-b border-white/15 pb-10 md:flex-row md:items-end md:justify-between md:pb-12">
        <div class="max-w-2xl">
          <p class="text-sm text-white/60 font-medium tracking-[0.25em] uppercase">
            Brillex
          </p>

          <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Создаём мерч,
            <span class="text-secondary">
              который выглядит
            </span>
            стильно и современно
          </h2>

          <p class="mt-4 max-w-xl text-sm text-white/75 leading-7 md:text-base">
            Помогаем брендам, командам и проектам создавать качественный мерч с
            характером — от идеи до готового результата.
          </p>
        </div>

        <div class="shrink-0">
          <RouterLink
            to="/contacts"
            class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm text-secondary font-semibold transition duration-300 hover:translate-y--1 md:px-7 md:py-3.5 md:text-base hover:shadow-lg"
          >
            Обсудить заказ
          </RouterLink>
        </div>
      </div>

      <!-- main content -->
      <div class="grid gap-10 py-10 md:grid-cols-[1.2fr_1fr_1fr] md:gap-12 md:py-12">
        <!-- brand / socials -->
        <div>
          <RouterLink
            to="/"
            class="inline-flex items-center text-2xl text-white font-bold tracking-tight"
          >
            BRILLEX
          </RouterLink>

          <p class="mt-4 max-w-sm text-sm text-white/75 leading-7 md:text-base">
            Минималистичный мерч и визуальные решения для тех, кто ценит аккуратный
            стиль, качество и детали.
          </p>

          <div class="mt-6 flex items-center gap-3">
            <a
              href="https://wa.me/77052598888"
              target="_blank"
              rel="noopener noreferrer"
              :class="socialBtn"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <span class="i-mdi:whatsapp" aria-hidden="true" />
            </a>

            <a
              href="https://t.me/your_username"
              target="_blank"
              rel="noopener noreferrer"
              :class="socialBtn"
              aria-label="Telegram"
              title="Telegram"
            >
              <span class="i-mdi:telegram" aria-hidden="true" />
            </a>

            <a
              href="https://instagram.com/your_username"
              target="_blank"
              rel="noopener noreferrer"
              :class="socialBtn"
              aria-label="Instagram"
              title="Instagram"
            >
              <span class="i-mdi:instagram" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- nav -->
        <nav aria-label="Footer navigation">
          <p class="text-sm text-white/55 font-semibold tracking-[0.18em] uppercase">
            Навигация
          </p>

          <ul class="grid mt-5 gap-3">
            <li v-for="link in linksLeft" :key="link.to">
              <RouterLink :to="link.to" :class="navLink">
                <span class="h-1.5 w-1.5 rounded-full bg-white/30 transition group-hover:bg-white" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>

          <ul class="grid mt-6 gap-3">
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

          <div class="mt-5 space-y-5">
            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Телефон
              </p>
              <a
                href="tel:+77052598888"
                class="mt-1 inline-block text-lg text-white font-semibold transition md:text-xl hover:text-primary"
              >
                +7 705 259 88 88
              </a>
            </div>

            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Почта
              </p>
              <a
                href="mailto:zakaz@brillex.ru"
                class="mt-1 inline-block text-white/80 transition hover:text-white"
              >
                zakaz@brillex.ru
              </a>
            </div>

            <div>
              <p class="text-xs text-white/45 tracking-[0.15em] uppercase">
                Адрес
              </p>
              <p class="mt-1 text-white/80">
                г. Алматы, Казахстан
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
