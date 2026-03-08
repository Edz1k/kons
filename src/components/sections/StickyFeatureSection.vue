<script setup lang="ts">
interface DetailItem {
  id: number
  title: string
  text: string
}

const details: DetailItem[] = [
  {
    id: 1,
    title: 'Деталь 1',
    text: 'Описание первой детали.',
  },
  {
    id: 2,
    title: 'Деталь 2',
    text: 'Описание второй детали.',
  },
  {
    id: 3,
    title: 'Деталь 3',
    text: 'Описание третьей детали.',
  },
  {
    id: 4,
    title: 'Деталь 4',
    text: 'Описание четвертой детали.',
  },
]
</script>

<template>
  <section class="w-full py-12 lg:py-20">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <div class="flex flex-col lg:flex-row lg:gap-10">
        <div class="w-full lg:w-1/2">
          <div class="border-b border-gray-200 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
            <div class="space-y-24 lg:space-y-32">
              <FadeComponent>
                <h2 class="text-3xl font-semibold lg:text-5xl">
                  Бренд одежды внутри компании
                </h2>
              </FadeComponent>

              <FadeComponent
                v-for="detail in details"
                :key="detail.id"
              >
                <article class="space-y-4">
                  <h3 class="text-2xl font-semibold lg:text-4xl">
                    {{ detail.title }}
                  </h3>
                  <p class="leading-7 opacity-80">
                    {{ detail.text }}
                  </p>
                </article>
              </FadeComponent>
            </div>
          </div>
        </div>

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
