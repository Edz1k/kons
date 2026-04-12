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

function getMobileStyle(index: number) {
  const rotations = [-6, 5, -8, 7, -4]
  const offsets = [-10, 10, -6, 8, 0]

  return {
    transform: `rotate(${rotations[index] ?? 0}deg) translateX(${offsets[index] ?? 0}px)`,
    zIndex: 10 + index,
  }
}
</script>

<template>
  <section class="w-full py-12 lg:py-20">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <div class="flex flex-col lg:flex-row lg:gap-10">
        <!-- Левая колонка -->
        <div class="w-full lg:w-1/2">
          <div class="border-b border-gray-200 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
            <div class="space-y-8 lg:space-y-10">
              <FadeComponent>
                <h2 class="max-w-[520px] text-2xl font-semibold leading-tight lg:text-5xl sm:text-3xl">
                  Бренд одежды внутри компании
                </h2>
              </FadeComponent>

              <!-- Мобильная версия: коллаж -->
              <div class="flex flex-col items-center px-2 lg:hidden">
                <FadeComponent
                  v-for="(photo, i) in photos"
                  :key="photo.src"
                  class="relative mb-[-36px] w-[85%] last:mb-0"
                  :style="getMobileStyle(i)"
                >
                  <img
                    :src="photo.src"
                    :alt="photo.alt"
                    class="block w-full rounded-xl bg-white p-2 shadow-[0_18px_35px_rgba(0,0,0,0.18)] transition-transform duration-300"
                  >
                </FadeComponent>
              </div>

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
        <div class="w-full pt-8 lg:w-1/2 lg:pt-0">
          <div class="lg:sticky lg:top-24 lg:min-h-[calc(100vh-6rem)] lg:flex lg:items-center">
            <div class="w-full rounded-3xl bg-black p-6 text-white lg:p-10 sm:p-8">
              <h3 class="text-2xl font-semibold lg:text-5xl sm:text-3xl">
                Brillex
              </h3>
              <p class="mt-4 text-sm leading-6 opacity-80 sm:text-base sm:leading-7">
                Здесь может быть текст, изображение, мокап, видео или карточка товара.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
