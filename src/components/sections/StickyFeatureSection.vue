<script setup lang="ts">
const photos = [
  {
    src: '/pictures/disclo/Group1.webp',
    alt: 'card 1',
    desktopClass: 'left-0 top-10 w-[58%] rotate-[-4deg] z-10',
  },
  {
    src: '/pictures/disclo/Group2.webp',
    alt: 'card 2',
    desktopClass: 'right-0 top-0 w-[42%] rotate-[6deg] z-20',
  },
  {
    src: '/pictures/disclo/Group3.webp',
    alt: 'card 3',
    desktopClass: 'left-[18%] top-[420px] w-[60%] rotate-[10deg] z-30',
  },
  {
    src: '/pictures/disclo/Group4.webp',
    alt: 'card 4',
    desktopClass: 'left-0 top-[980px] w-[46%] rotate-[-8deg] z-10',
  },
  {
    src: '/pictures/disclo/Group5.webp',
    alt: 'card 5',
    desktopClass: 'right-[4%] top-[1180px] w-[52%] rotate-[8deg] z-20',
  },
]

// На телефоне фото идут лентой со свайпом, а не столбиком: иначе блок занимает 2,5 экрана
const mobileRotations = [-3, 2, -2, 3, -1]
</script>

<template>
  <section class="w-full py-10 lg:py-20">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <div class="flex flex-col lg:flex-row lg:gap-10">
        <!-- Левая колонка -->
        <div class="w-full lg:w-1/2">
          <div class="border-b border-gray-200 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
            <div class="flex flex-col gap-4 lg:gap-10">
              <FadeComponent>
                <h2 class="max-w-[520px] text-2xl font-semibold leading-tight lg:text-5xl sm:text-3xl lg:leading-none sm:leading-9">
                  Бренд одежды внутри компании
                </h2>
              </FadeComponent>

              <!-- Мобильная версия: лента со свайпом -->
              <FadeComponent class="lg:hidden">
                <div class="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4 -mx-4 sm:px-6 sm:-mx-6">
                  <div
                    v-for="(photo, i) in photos"
                    :key="photo.src"
                    class="w-[min(56vw,27svh)] shrink-0 snap-center"
                    :style="{ transform: `rotate(${mobileRotations[i] ?? 0}deg)` }"
                  >
                    <img
                      :src="photo.src"
                      :alt="photo.alt"
                      loading="lazy"
                      class="block w-full rounded-xl bg-white p-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                    >
                  </div>
                </div>
              </FadeComponent>

              <!-- Десктопная версия -->
              <div class="relative hidden w-full lg:block lg:min-h-[1800px] md:min-h-[1400px]">
                <FadeComponent
                  v-for="photo in photos"
                  :key="photo.src"
                  class="absolute"
                  :class="photo.desktopClass"
                >
                  <img
                    :src="photo.src"
                    :alt="photo.alt"
                    class="block w-full object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
                  >
                </FadeComponent>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка -->
        <div class="w-full pt-6 lg:w-1/2 lg:pt-0">
          <div class="lg:sticky lg:top-24 lg:min-h-[calc(100vh-6rem)] lg:flex lg:items-center">
            <div class="w-full rounded-3xl bg-black p-6 text-white lg:p-10 sm:p-8">
              <span class="text-xs text-white/50 font-semibold tracking-[0.2em] uppercase">
                Brillex
              </span>
              <p class="mt-5 text-xl font-bold leading-tight uppercase lg:text-4xl sm:text-3xl lg:leading-10 sm:leading-9">
                Если вещь не хочется носить —
                <span class="text-primary">она не работает на ваш бренд.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
