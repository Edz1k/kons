<script setup lang="ts">
const portfolioItems = [
  {
    id: 1,
    title: 'Minimal Tees',
    subtitle: 'Чистый силуэт и уверенная простота',
    description:
      'Футболки Brillex созданы для тех, кто ценит минимализм, комфорт и универсальность. Они легко становятся основой повседневного образа и сохраняют характер бренда в каждой детали.',
    image: '/image.webp',
    align: 'left',
  },
  {
    id: 2,
    title: 'Street Essentials',
    subtitle: 'Свобода, ритм города и комфорт',
    description:
      'Худи и базовые элементы коллекции объединяют удобство и современную уличную эстетику. Это вещи, которые органично вписываются в ритм города и подчеркивают индивидуальность.',
    image: '/image.webp',
    align: 'right',
  },
  {
    id: 3,
    title: 'Details Matter',
    subtitle: 'Образ формируется в мелочах',
    description:
      'Аксессуары и дополнительные элементы не перегружают стиль, а делают его цельным. В Brillex мы уделяем внимание тем деталям, которые создают ощущение завершенности и вкуса.',
    image: '/image.webp',
    align: 'left',
  },
]

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

const values = [
  {
    title: 'Минимализм',
    text: 'Чистые линии, спокойная композиция и визуальная простота, которая выглядит дорого.',
  },
  {
    title: 'Комфорт',
    text: 'Каждая вещь должна быть не только стильной, но и удобной в реальной повседневной жизни.',
  },
  {
    title: 'Характер',
    text: 'Brillex — это одежда и детали, которые подчеркивают уверенность и индивидуальность.',
  },
]
</script>

<template>
  <main class="bg-white text-navy">
    <!-- HERO -->
    <FadeComponent>
      <section class="relative overflow-hidden">
        <div class="mx-auto max-w-7xl px-6 pb-16 pt-18 md:px-10 md:pb-24 md:pt-28">
          <div class="mx-auto max-w-4xl text-center">
            <p
              class="inline-flex items-center border border-gray-200 rounded-full px-4 py-1.5 text-sm text-primary font-medium"
            >
              Brillex Портфолио
            </p>

            <h1 class="mt-6 text-4xl font-bold leading-[1.05] tracking-tight lg:text-7xl md:text-6xl lg:leading-none md:leading-none">
              Стиль,
              <span class="text-primary">который чувствуется</span>
              сразу
            </h1>

            <p class="mx-auto mt-6 max-w-2xl text-base text-slate-400 leading-8 md:text-lg md:leading-7">
              Brillex — это современный взгляд на повседневную одежду и детали образа.
              Мы создаём вещи, которые выглядят чисто, ощущаются уверенно и легко
              вписываются в ритм города.
            </p>

            <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <RouterLink
                to="/market"
                class="inline-flex items-center justify-center rounded-2xl bg-primary px-7 py-3.5 text-sm text-white font-semibold shadow-xs transition duration-300 hover:-translate-y-1 md:text-base hover:shadow-lg"
              >
                Перейти в каталог
              </RouterLink>

              <a
                href="#portfolio-showcase"
                class="inline-flex items-center justify-center border border-gray-200 rounded-2xl px-7 py-3.5 text-sm text-navy font-semibold transition duration-300 hover:border-primary md:text-base hover:text-primary"
              >
                Смотреть подборку
              </a>
            </div>
          </div>
        </div>

        <div
          class="pointer-events-none absolute left-1/2 top-0 h-80 w-80 rounded-full bg-primary/6 blur-3xl -translate-x-1/2"
        />
      </section>
    </FadeComponent>

    <!-- INTRO VISUAL STRIP: реальные заказы -->
    <FadeComponent>
      <section class="mx-auto max-w-7xl px-6 pb-10 md:px-10 md:pb-16">
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

    <!-- BRAND STATEMENT -->
    <FadeComponent>
      <section class="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-20">
        <div class="text-center">
          <p class="text-sm text-primary font-semibold tracking-[0.2em] uppercase">
            Our vision
          </p>

          <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">
            Не просто одежда,
            <br class="hidden md:block">
            а визуальный язык бренда
          </h2>

          <p class="mx-auto mt-6 max-w-3xl text-base text-slate-400 leading-8 md:text-lg md:leading-7">
            Для нас стиль — это не про перегруженность и не про случайные детали.
            Это про форму, настроение и ощущение цельности. Мы стремимся создавать
            вещи, которые смотрятся спокойно, но запоминаются сразу.
          </p>
        </div>
      </section>
    </FadeComponent>

    <!-- SHOWCASE -->
    <section id="portfolio-showcase" class="mx-auto max-w-7xl px-6 py-6 md:px-10 md:py-10">
      <div class="space-y-16 md:space-y-24">
        <FadeComponent
          v-for="item in portfolioItems"
          :key="item.id"
        >
          <div
            class="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14"
            :class="item.align === 'right' ? 'md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1' : ''"
          >
            <div class="group overflow-hidden rounded-[28px] bg-gray-50">
              <img
                :src="item.image"
                :alt="item.title"
                class="h-[360px] w-full object-cover transition duration-700 md:h-[560px] group-hover:scale-105"
              >
            </div>

            <div class="max-w-xl">
              <p class="text-sm text-primary font-semibold tracking-[0.2em] uppercase">
                {{ item.subtitle }}
              </p>

              <h3 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">
                {{ item.title }}
              </h3>

              <p class="mt-6 text-base text-slate-400 leading-8 md:text-lg md:leading-7">
                {{ item.description }}
              </p>

              <div class="mt-8 h-px w-24 bg-primary" />
            </div>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- VALUES -->
    <FadeComponent>
      <section class="mx-auto max-w-7xl px-6 py-18 md:px-10 md:py-24">
        <div class="border border-gray-100 rounded-[32px] bg-gray-50/70 px-6 py-8 md:px-10 md:py-12">
          <div class="max-w-2xl">
            <p class="text-sm text-primary font-semibold tracking-[0.2em] uppercase">
              Brillex identity
            </p>

            <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">
              Основа нашего визуального подхода
            </h2>
          </div>

          <div class="grid grid-cols-1 mt-10 gap-5 md:grid-cols-3 md:gap-6">
            <div
              v-for="value in values"
              :key="value.title"
              class="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-7"
            >
              <h3 class="text-xl font-semibold">
                {{ value.title }}
              </h3>

              <p class="mt-4 text-sm text-slate-400 leading-7 md:text-base md:leading-6">
                {{ value.text }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </FadeComponent>

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
              Собери образ,
              <span class="text-primary">который отражает тебя</span>
            </h2>

            <p class="mt-6 text-sm text-white/70 leading-8 md:text-lg md:leading-7">
              Перейди в каталог и посмотри актуальную подборку вещей Brillex —
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
