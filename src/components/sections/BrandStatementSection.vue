<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const scrollY = ref(0)

function handleScroll() {
  scrollY.value = window.scrollY
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

// crocs — сильный уход вверх
const crocsStyle = computed(() => {
  const y = scrollY.value * -0.15 // чем больше — тем сильнее уходит вверх

  return {
    transform: `translate3d(0, ${y}px, 0)`,
  }
})

// sumka — слабый уход вверх (в 2 раза меньше)
const sumkaStyle = computed(() => {
  const y = scrollY.value * -0.07

  return {
    transform: `translate3d(0, ${y}px, 0) rotate(-20deg)`,
  }
})
</script>

<template>
  <section class="overflow-hidden py-12">
    <div class="mx-auto max-w-7xl px-4 text-center lg:px-8 sm:px-6">
      <h2 class="font-bold leading-[0.95] tracking-tight uppercase">
        <FadeComponent>
          <span class="z-10 block text-5xl text-black lg:text-8xl md:text-7xl">
            СДЕЛАЕМ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="z-10 block text-5xl text-secondary lg:text-8xl md:text-7xl">
            БРЕНД ОДЕЖДЫ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="z-10 block text-5xl text-secondary lg:text-8xl md:text-7xl">
            ВНУТРИ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="z-10 block text-5xl text-secondary lg:text-8xl md:text-7xl">
            ВАШЕЙ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="z-10 block text-5xl text-secondary lg:text-8xl md:text-7xl">
            КОМПАНИИ
          </span>
        </FadeComponent>
      </h2>
    </div>

    <div class="pointer-events-none relative">
      <FadeComponent>
        <img
          src="/pictures/crocs.webp"
          alt=""
          :style="crocsStyle"
          class="parallax-item absolute bottom-[-70px] left-0 z-1 w-[30%] object-contain"
        >
      </FadeComponent>

      <FadeComponent>
        <img
          src="/pictures/sumka.webp"
          alt=""
          :style="sumkaStyle"
          class="parallax-item absolute bottom-0 right-0 z-1 w-[35%] object-contain"
        >
      </FadeComponent>
    </div>
  </section>
</template>

<style scoped>
.parallax-item {
  will-change: transform;
  transition: transform 0.1s linear; /* можно 0.15 для мягче */
}
</style>
