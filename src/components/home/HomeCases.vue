<script setup lang="ts">
import { casePhotos } from './content'
import HomeGallery from './HomeGallery.vue'
</script>

<template>
  <section class="py-20 md:py-28">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <h2 class="text-4xl font-black leading-none tracking-tight uppercase md:text-6xl">
        Реализованные идеи
      </h2>

      <div class="mt-10 md:mt-14">
        <HomeGallery
          :photos="casePhotos"
          item-class="basis-[85%] sm:basis-1/2 lg:basis-1/3"
          :delay="3000"
          label="Реализованные проекты"
        />
      </div>
    </div>
  </section>
</template>
