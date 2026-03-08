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
  <div class="w-full overflow-hidden rounded-lg">
    <Swiper
      :modules="[Navigation, Pagination, Autoplay]"
      :slides-per-view="1"
      :space-between="20"
      :loop="true"
      :autoplay="{ delay: 3000 }"
      navigation
      :pagination="{ clickable: true }"
      class="aspect-16/9 w-full"
    >
      <SwiperSlide
        v-for="(slide, index) in slides"
        :key="index"
      >
        <img
          :src="slide"
          class="h-full w-full object-cover"
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
