<script setup lang="ts">
const year = new Date().getFullYear()

const linksLeft = [
  { label: 'Каталог', to: '/catalog' },
  { label: 'Идеи для мерча', to: '/ideas' },
  { label: 'Портфолио', to: '/portfolio' },
] as const

const linksMid = [
  { label: 'Услуги', to: '/services' },
  { label: 'О нас', to: '/about' },
  { label: 'Контакты', to: '/contacts' },
] as const

const socialBtn
  = 'h-12 w-12 inline-flex items-center justify-center rounded-full bg-white text-2xl text-orange-500 shadow-sm transition hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'

const navLink
  = 'text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded'
</script>

<template>
  <footer class="relative overflow-hidden rounded-tl-3xl rounded-tr-3xl bg-orange-500 text-white">
    <!-- Огромный фон-текст -->
    <div
      class="pointer-events-none absolute bottom-[-2vw] left-1/2 w-full select-none whitespace-nowrap text-center text-[22vw] text-white/50 font-extrabold leading-none tracking-tight tracking-wider uppercase -translate-x-1/2 md:text-[18vw]"
      aria-hidden="true"
    >
      BRILLEX
    </div>

    <div class="relative z-10 mx-auto px-6 pb-8 pt-10 container">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-3">
        <!-- Лево -->
        <nav aria-label="Footer navigation">
          <ul class="grid gap-3">
            <li v-for="l in linksLeft" :key="l.to">
              <RouterLink :to="l.to" :class="navLink">
                {{ l.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Центр -->
        <div class="flex flex-col items-center text-center">
          <nav aria-label="Footer navigation secondary" class="mb-6">
            <ul class="grid gap-3">
              <li v-for="l in linksMid" :key="l.to">
                <RouterLink :to="l.to" :class="navLink">
                  {{ l.label }}
                </RouterLink>
              </li>
            </ul>
          </nav>

          <div class="mb-6 flex items-center gap-4">
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

          <div class="text-white/90">
            © {{ year }} BRILLEX
          </div>
        </div>

        <!-- Право -->
        <address class="not-italic space-y-2 md:text-right">
          <div class="text-lg font-semibold md:text-xl">
            <a class="underline-offset-4 hover:underline" href="tel:+77052598888">
              +7 705 259 88 88
            </a>
          </div>

          <div class="text-white/90">
            <a class="underline-offset-4 hover:underline" href="mailto:zakaz@brillex.ru">
              zakaz@brillex.ru
            </a>
          </div>

          <div class="text-white/90">
            г. Алматы, ул. ……
          </div>
        </address>
      </div>
    </div>
  </footer>
</template>
