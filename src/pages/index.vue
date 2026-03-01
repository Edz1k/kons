<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <!-- Фон слева -->
    <img
      src="/pictures/hudi.png"
      alt=""
      class="absolute left-[-10%] top-[50%] w-1/3"
    >
    <img
      src="/pictures/chain.png"
      alt=""
      class="absolute left-[-5%] top-[0%] w-1/3"
    >

    <!-- Контент -->
    <div class="relative z-10 text-center container">
      <h1 class="text-5xl font-extrabold leading-tight md:text-7xl">
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

      <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-500 md:text-xl">
        Полный цикл — от идеи до готовой коллекции.
        Мерч для компаний, брендов и мероприятий,
        который хочется носить и показывать.
      </p>

      <div class="mt-8">
        <button
          class="rounded-full bg-orange-500 px-8 py-4 text-lg text-white font-medium transition hover:bg-orange-600"
        >
          Заказать мерч →
        </button>
      </div>
    </div>
  </section>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
