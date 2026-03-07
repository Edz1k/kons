<script setup lang="ts">
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

const slides = [
  '/carousel/1.jpg',
  '/carousel/7.jpg',
  '/carousel/10.jpg',
  '/carousel/11.jpg',
]
</script>

<template>
  <div class="mx-auto mt-12 w-[80%]">
    <Swiper
      :modules="[Navigation, Pagination, Autoplay]"
      :slides-per-view="1"
      :space-between="20"
      :loop="true"
      :autoplay="{ delay: 3000 }"
      navigation
      :pagination="{ clickable: true }"
      class="h-[600px] w-full"
    >
      <SwiperSlide
        v-for="(slide, index) in slides"
        :key="index"
      >
        <img
          :src="slide"
          class="h-[600px] w-full object-cover"
        >
      </SwiperSlide>
    </Swiper>
  </div>
</template>
