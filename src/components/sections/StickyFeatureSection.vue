<script setup lang="ts">
const photos = [
  {
    src: '/pictures/disclo/Group_124.jpg.webp',
    alt: 'card 1',
    class: 'left-0 top-10 w-[58%] rotate-[-4deg] z-10',
  },
  {
    src: '/pictures/disclo/Group_124.jpg.webp',
    alt: 'card 2',
    class: 'right-0 top-0 w-[42%] rotate-[6deg] z-20',
  },
  {
    src: '/pictures/disclo/Group_124.jpg.webp',
    alt: 'card 3',
    class: 'left-[18%] top-[420px] w-[60%] rotate-[10deg] z-30',
  },
  {
    src: '/pictures/disclo/Group_124.jpg.webp',
    alt: 'card 4',
    class: 'left-0 top-[980px] w-[46%] rotate-[-8deg] z-10',
  },
  {
    src: '/pictures/disclo/Group_124.jpg.webp',
    alt: 'card 5',
    class: 'right-[4%] top-[1180px] w-[52%] rotate-[8deg] z-20',
  },
]
</script>

<template>
  <section class="w-full py-12 lg:py-20">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <div class="flex flex-col lg:flex-row lg:gap-10">
        <!-- Левая колонка -->
        <div class="w-full lg:w-1/2">
          <div class="border-b border-gray-200 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
            <div class="space-y-10">
              <FadeComponent>
                <h2 class="max-w-[520px] text-3xl font-semibold leading-tight lg:text-5xl">
                  Бренд одежды внутри компании
                </h2>
              </FadeComponent>

              <div class="relative min-h-[1200px] w-full lg:min-h-[1800px] md:min-h-[1400px]">
                <FadeComponent
                  v-for="photo in photos"
                  :key="photo.src"
                  class="absolute"
                  :class="photo.class"
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
            <div class="w-full rounded-3xl bg-black p-8 text-white lg:p-10">
              <h3 class="text-3xl font-semibold lg:text-5xl">
                Brillex
              </h3>
              <p class="mt-4 leading-7 opacity-80">
                Здесь может быть текст, изображение, мокап, видео или карточка товара.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
