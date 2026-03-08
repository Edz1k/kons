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
  <div class="absolute left-[5%] top-[-5%] w-[90%] overflow-hidden rounded-lg">
    <Swiper
      :modules="[Navigation, Pagination, Autoplay]"
      :slides-per-view="1"
      :space-between="20"
      :loop="true"
      :autoplay="{ delay: 3000 }"
      :s
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

<style scoped>
:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
  color: black !important;
  background: white; /* белый фон */
  border-radius: 50%;
  padding: 5px;
}
:deep(.swiper) {
  --swiper-navigation-size: 28px;
}

:deep(.swiper-pagination-bullet) {
  background: white;
}
</style>
