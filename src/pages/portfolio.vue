<script setup lang="ts">
const portfolioItems = [
  {
    id: 1,
    title: 'Minimal Tees',
    subtitle: 'Чистый силуэт и уверенная простота',
    description:
      'Футболки Brillex созданы для тех, кто ценит минимализм, комфорт и универсальность. Они легко становятся основой повседневного образа и сохраняют характер бренда в каждой детали.',
    image: '/image.png',
    align: 'left',
  },
  {
    id: 2,
    title: 'Street Essentials',
    subtitle: 'Свобода, ритм города и комфорт',
    description:
      'Худи и базовые элементы коллекции объединяют удобство и современную уличную эстетику. Это вещи, которые органично вписываются в ритм города и подчеркивают индивидуальность.',
    image: '/image.png',
    align: 'right',
  },
  {
    id: 3,
    title: 'Details Matter',
    subtitle: 'Образ формируется в мелочах',
    description:
      'Аксессуары и дополнительные элементы не перегружают стиль, а делают его цельным. В Brillex мы уделяем внимание тем деталям, которые создают ощущение завершенности и вкуса.',
    image: '/image.png',
    align: 'left',
  },
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
  <main class="bg-white text-primary">
    <!-- HERO -->
    <FadeComponent>
      <section class="relative overflow-hidden">
        <div class="mx-auto max-w-7xl px-6 pb-16 pt-18 md:px-10 md:pb-24 md:pt-28">
          <div class="mx-auto max-w-4xl text-center">
            <p
              class="inline-flex items-center border border-gray-200 rounded-full px-4 py-1.5 text-sm text-secondary font-medium"
            >
              Brillex Портфолио
            </p>

            <h1 class="mt-6 text-4xl font-bold leading-[1.05] tracking-tight lg:text-7xl md:text-6xl">
              Стиль,
              <span class="text-secondary">который чувствуется</span>
              сразу
            </h1>

            <p class="mx-auto mt-6 max-w-2xl text-base text-muted leading-8 md:text-lg">
              Brillex — это современный взгляд на повседневную одежду и детали образа.
              Мы создаём вещи, которые выглядят чисто, ощущаются уверенно и легко
              вписываются в ритм города.
            </p>

            <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <RouterLink
                to="/market"
                class="inline-flex items-center justify-center rounded-2xl bg-secondary px-7 py-3.5 text-sm text-white font-semibold shadow-sm transition duration-300 hover:translate-y--1 md:text-base hover:shadow-lg"
              >
                Перейти в каталог
              </RouterLink>

              <a
                href="#portfolio-showcase"
                class="inline-flex items-center justify-center border border-gray-200 rounded-2xl px-7 py-3.5 text-sm text-primary font-semibold transition duration-300 hover:border-secondary md:text-base hover:text-secondary"
              >
                Смотреть подборку
              </a>
            </div>
          </div>
        </div>

        <div
          class="pointer-events-none absolute left-1/2 top-0 h-80 w-80 rounded-full bg-secondary/6 blur-3xl -translate-x-1/2"
        />
      </section>
    </FadeComponent>

    <!-- INTRO VISUAL STRIP -->
    <FadeComponent>
      <section class="mx-auto max-w-7xl px-6 pb-10 md:px-10 md:pb-16">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div class="group overflow-hidden rounded-3xl bg-gray-50">
            <img
              src="/image.png"
              alt="Brillex portfolio image 1"
              class="h-[340px] w-full object-cover transition duration-700 md:h-[420px] group-hover:scale-105"
            >
          </div>

          <div class="group overflow-hidden rounded-3xl bg-gray-50 md:mt-10">
            <img
              src="/image.png "
              alt="Brillex portfolio image 2"
              class="h-[340px] w-full object-cover transition duration-700 md:h-[420px] group-hover:scale-105"
            >
          </div>

          <div class="group overflow-hidden rounded-3xl bg-gray-50">
            <img
              src="/image.png"
              alt="Brillex portfolio image 3"
              class="h-[340px] w-full object-cover transition duration-700 md:h-[420px] group-hover:scale-105"
            >
          </div>
        </div>
      </section>
    </FadeComponent>

    <!-- BRAND STATEMENT -->
    <FadeComponent>
      <section class="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-20">
        <div class="text-center">
          <p class="text-sm text-secondary font-semibold tracking-[0.2em] uppercase">
            Our vision
          </p>

          <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Не просто одежда,
            <br class="hidden md:block">
            а визуальный язык бренда
          </h2>

          <p class="mx-auto mt-6 max-w-3xl text-base text-muted leading-8 md:text-lg">
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
              <p class="text-sm text-secondary font-semibold tracking-[0.2em] uppercase">
                {{ item.subtitle }}
              </p>

              <h3 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                {{ item.title }}
              </h3>

              <p class="mt-6 text-base text-muted leading-8 md:text-lg">
                {{ item.description }}
              </p>

              <div class="mt-8 h-px w-24 bg-secondary" />
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
            <p class="text-sm text-secondary font-semibold tracking-[0.2em] uppercase">
              Brillex identity
            </p>

            <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
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

              <p class="mt-4 text-sm text-muted leading-7 md:text-base">
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
          <h2 class="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Мы не стремимся
            <span class="text-secondary">к лишнему</span>
          </h2>

          <p class="mx-auto mt-6 max-w-3xl text-base text-muted leading-8 md:text-lg">
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
        <div class="relative overflow-hidden rounded-[36px] bg-primary px-6 py-12 text-white md:px-12 md:py-16">
          <div class="relative z-2 max-w-3xl">
            <p class="text-sm text-white/70 font-semibold tracking-[0.2em] uppercase">
              Explore Brillex
            </p>

            <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Собери образ,
              <span class="text-secondary">который отражает тебя</span>
            </h2>

            <p class="mt-6 text-sm text-white/70 leading-8 md:text-lg">
              Перейди в каталог и посмотри актуальную подборку вещей Brillex —
              от базовых футболок до выразительных деталей образа.
            </p>

            <div class="mt-8 flex flex-col gap-4 sm:flex-row">
              <RouterLink
                to="/market"
                class="inline-flex items-center justify-center rounded-2xl bg-secondary px-7 py-3.5 text-sm text-white font-semibold transition duration-300 hover:translate-y--1 md:text-base hover:opacity-95"
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
            class="pointer-events-none absolute right--10 top-1/2 h-64 w-64 rounded-full bg-secondary/20 blur-3xl -translate-y-1/2"
          />
          <div
            class="pointer-events-none absolute left-10 top-0 h-40 w-40 rounded-full bg-white/8 blur-3xl"
          />
        </div>
      </section>
    </FadeComponent>
  </main>
</template>
