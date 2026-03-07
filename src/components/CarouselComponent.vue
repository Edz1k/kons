<script setup lang="ts">
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

const slides = [
  '/pictures/hudi.png',
  '/pictures/chain.png',
  '/pictures/hudi.png',
]
</script>

<template>
  <div class="mx-auto max-w-5xl w-full">
    <Swiper
      :modules="[Navigation, Pagination, Autoplay]"
      :slides-per-view="1"
      :space-between="20"
      :loop="true"
      :autoplay="{ delay: 3000 }"
      navigation
      :pagination="{ clickable: true }"
      class="rounded-xl"
    >
      <SwiperSlide
        v-for="(slide, index) in slides"
        :key="index"
      >
        <img
          :src="slide"
          class="h-[400px] w-full rounded-xl object-cover"
        >
      </SwiperSlide>
    </Swiper>
  </div>
</template>
