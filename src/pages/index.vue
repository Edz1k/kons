<script setup lang="ts">
import CarouselComponent from '~/components/CarouselComponent.vue'

defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <section class="relative min-h-[90vh] overflow-hidden">
    <!-- Декоративные картинки -->
    <div class="pointer-events-none absolute inset-0">
      <!-- hudi -->
      <img
        src="/pictures/hudi.png"
        alt=""
        class="absolute bottom-[-50px] left-[-40px] w-[180px] lg:bottom-[-120px] lg:left-[-80px] md:bottom-[-90px] md:left-[-60px] sm:bottom-[-50px] sm:left-[-30px] lg:w-[360px] md:w-[280px] sm:w-[220px]"
      >

      <!-- chain -->
      <img
        src="/pictures/chain.png"
        alt=""
        class="absolute left-[-20px] top-[10px] w-[140px] lg:left-[-40px] lg:top-[0px] md:left-[-30px] md:top-[10px] sm:left-[-10px] sm:top-[0px] lg:w-[320px] md:w-[240px] sm:w-[180px]"
      >
    </div>

    <!-- Контент -->
    <div class="relative z-10 mx-auto min-h-[90vh] flex items-center justify-center px-4 container">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl">
          <span class="text-orange-500">
            МЫ СОЗДАЕМ МЕРЧ,
          </span>
          <br>
          КОТОРЫЙ ВДОХНОВЛЯЕТ
          <br>
          СТАТЬ АМБАССАДОРОМ
          <br>
          ВАШЕГО БРЕНДА
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-base text-gray-500 md:text-xl sm:text-lg">
          Полный цикл — от идеи до готовой коллекции.
          Мерч для компаний, брендов и мероприятий,
          который хочется носить и показывать.
        </p>

        <div class="mt-8">
          <button
            class="rounded-full bg-orange-500 px-6 py-3 text-base text-white font-medium transition hover:bg-orange-600 md:px-8 md:py-4 md:text-lg"
          >
            Заказать мерч →
          </button>
        </div>
      </div>
    </div>
  </section>
  <section>
    <h2 class="mb-4 text-2xl font-bold">
      Наши услуги
    </h2>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="border border-white/10 rounded-xl p-6">
        <h3 class="mb-2 text-xl font-semibold">
          Консультация и идеи
        </h3>
        <p class="text-sm text-gray-400">
          Поможем с выбором концепции, материалов и дизайна.
        </p>
      </div>

      <div class="border border-white/10 rounded-xl p-6">
        <h3 class="mb-2 text-xl font-semibold">
          Производство мерча
        </h3>
        <p class="text-sm text-gray-400">
          Изготовим качественный мерч по вашему дизайну.
        </p>
      </div>

      <div class="border border-white/10 rounded-xl p-6">
        <h3 class="mb-2 text-xl font-semibold">
          Доставка и логистика
        </h3>
        <p class="text-sm text-gray-400">
          Организуем доставку мерча вашим клиентам.
        </p>
      </div>
    </div>
  </section>
  <section class="mx-auto py-12 container">
    <CarouselComponent />
  </section>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
