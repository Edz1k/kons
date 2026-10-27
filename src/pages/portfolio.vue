<script setup lang="ts">
// Реальные заказы клиентов
const orderPhotos = [
  { src: '/pictures/portfolio/sds.webp', alt: 'Мерч для SDS: рюкзак, шопер, блокнот и поло' },
  { src: '/pictures/portfolio/laska.webp', alt: 'Набор для «Ласки»: термос, кружка, блокнот и ручка' },
  { src: '/pictures/portfolio/russkiy-dom.webp', alt: 'Набор для «Русского дома»: термос, блокнот, повербанк, флешка и ручка' },
  { src: '/pictures/portfolio/bosch.webp', alt: 'Мерч для Bosch: зонт, кружка, бутылка и термокружка' },
]

// Работы с нанесением — исходники маленькие (320px по высоте), только для небольших плиток
const works = [
  { src: '/pictures/works/toyota.webp', alt: 'Кружка и ручка Toyota Material Handling' },
  { src: '/pictures/works/bosch-thermos.webp', alt: 'Термос Bosch' },
  { src: '/pictures/works/garanti-leasing.webp', alt: 'Сумка Garanti Leasing' },
  { src: '/pictures/works/disney-pandora.webp', alt: 'Ланьярды Disney × Pandora' },
  { src: '/pictures/works/jacobs.webp', alt: 'Блокнот Jacobs с тиснением' },
  { src: '/pictures/works/pwc.webp', alt: 'Блокноты PwC' },
  { src: '/pictures/works/rokos.webp', alt: 'Термосы Rokos' },
  { src: '/pictures/works/brillex-pens.webp', alt: 'Ручки Brillex' },
  { src: '/pictures/works/ukkz.webp', alt: 'Папка Усть-Каменогорского конденсаторного завода' },
]
</script>

<template>
  <main class="bg-white text-navy">
    <!-- страница начинается сразу с фото реальных заказов, без вступительного текста -->
    <h1 class="sr-only">
      Портфолио Brillex
    </h1>

    <FadeComponent>
      <section class="mx-auto max-w-7xl px-6 pb-10 pt-6 md:px-10 md:pb-16 md:pt-10">
        <div class="grid grid-cols-2 items-start gap-3 md:grid-cols-4 md:gap-5">
          <div
            v-for="(photo, index) in orderPhotos"
            :key="photo.src"
            class="group overflow-hidden rounded-3xl bg-gray-50"
            :class="index % 2 === 1 ? 'md:mt-10' : ''"
          >
            <img
              :src="photo.src"
              :alt="photo.alt"
              loading="lazy"
              decoding="async"
              class="h-[240px] w-full object-cover transition duration-700 sm:h-[340px] md:h-[420px] group-hover:scale-105"
            >
          </div>
        </div>
      </section>
    </FadeComponent>

    <!-- WORKS: лента работ (Marquee, 21st.dev). Исходники маленькие, поэтому плитки небольшие -->
    <section class="overflow-hidden pb-10 md:pb-16" aria-label="Наши работы">
      <p class="mx-auto max-w-7xl px-6 text-sm text-primary font-semibold tracking-[0.2em] uppercase md:px-10">
        Наши работы
      </p>
      <div
        class="group mt-5 flex [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [--duration:50s] [--gap:0.75rem]"
        style="gap: var(--gap)"
      >
        <ul
          v-for="copy in 2"
          :key="copy"
          class="flex shrink-0 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style="gap: var(--gap)"
          :aria-hidden="copy > 1"
        >
          <li v-for="work in works" :key="work.src" class="shrink-0">
            <img
              :src="work.src"
              :alt="work.alt"
              loading="lazy"
              decoding="async"
              class="h-40 w-auto rounded-2xl object-cover"
            >
          </li>
        </ul>
      </div>
    </section>

    <!-- LARGE TEXT BLOCK -->
    <FadeComponent>
      <section class="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-16">
        <div class="text-center">
          <h2 class="text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">
            Мы не стремимся
            <span class="text-primary">к лишнему</span>
          </h2>

          <p class="mx-auto mt-6 max-w-3xl text-base text-slate-400 leading-8 md:text-lg md:leading-7">
            Нам ближе продуманный минимализм, в котором каждая вещь выглядит уместно,
            современно и уверенно. Brillex — это про стиль без шума, про детали без
            перегруза и про образ, который работает каждый день.
          </p>
        </div>
      </section>
    </FadeComponent>

    <!-- CTA -->
    <FadeComponent>
      <section class="mx-auto max-w-7xl px-6 pb-18 pt-8 md:px-10 md:pb-24 md:pt-12">
        <div class="relative overflow-hidden rounded-[36px] bg-navy px-6 py-12 text-white md:px-12 md:py-16">
          <div class="relative z-2 max-w-3xl">
            <p class="text-sm text-white/70 font-semibold tracking-[0.2em] uppercase">
              Explore Brillex
            </p>

            <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">
              Соберите мерч,
              <span class="text-primary">который отражает Вашу компанию</span>
            </h2>

            <p class="mt-6 text-sm text-white/70 leading-8 md:text-lg md:leading-7">
              Перейди в каталог и посмотри актуальную подборку продукцию Brillex —
              от базовых футболок до выразительных деталей образа.
            </p>

            <div class="mt-8 flex flex-col gap-4 sm:flex-row">
              <RouterLink
                to="/market"
                class="inline-flex items-center justify-center rounded-2xl bg-primary px-7 py-3.5 text-sm text-white font-semibold transition duration-300 hover:-translate-y-1 md:text-base hover:opacity-95"
              >
                Открыть каталог
              </RouterLink>

              <RouterLink
                to="/contacts"
                class="inline-flex items-center justify-center border border-white/15 rounded-2xl px-7 py-3.5 text-sm text-white font-semibold transition duration-300 hover:border-white/30 hover:bg-white/5 md:text-base"
              >
                Связаться с нами
              </RouterLink>
            </div>
          </div>

          <div
            class="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 rounded-full bg-primary/20 blur-3xl -translate-y-1/2"
          />
          <div
            class="pointer-events-none absolute left-10 top-0 h-40 w-40 rounded-full bg-white/8 blur-3xl"
          />
        </div>
      </section>
    </FadeComponent>
  </main>
</template>
