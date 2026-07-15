<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const sectionRef = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const ticking = ref(false)

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

function updateProgress() {
  if (!sectionRef.value) {
    ticking.value = false
    return
  }

  const rect = sectionRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  // progress от 0 до 1 на протяжении прохождения секции
  const total = rect.height + viewportHeight
  const passed = viewportHeight - rect.top
  const progress = clamp(passed / total)

  scrollProgress.value = progress
  ticking.value = false
}

function handleScroll() {
  if (ticking.value)
    return

  ticking.value = true
  requestAnimationFrame(updateProgress)
}

const crocsStyle = computed(() => {
  const startY = 150
  const endY = -135
  const y = startY + (endY - startY) * scrollProgress.value

  return {
    transform: `translate3d(0, ${y}px, 0) rotate(4deg)`,
  }
})

const sumkaStyle = computed(() => {
  const startY = -120
  const endY = 135
  const y = startY + (endY - startY) * scrollProgress.value

  return {
    transform: `translate3d(0, ${y}px, 0) rotate(-7deg)`,
  }
})

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <section
    ref="sectionRef"
    class="relative isolate min-h-[540px] overflow-hidden py-16 lg:py-28 md:py-24"
  >
    <div class="pointer-events-none absolute inset-0 z-0">
      <motion.div
        class="absolute bottom-[-48px] left-[-72px] max-w-[300px] w-[58vw] lg:bottom-[-92px] lg:left-[-26px] md:bottom-[-72px] md:left-[-36px] sm:left-[-42px] lg:max-w-[450px] lg:w-[27vw] md:max-w-[390px] md:w-[30vw] sm:w-[42vw]"
        :initial="{ opacity: 0, x: -60, y: 45, rotate: -6, scale: 0.9 }"
        :while-in-view="{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }"
        :viewport="{ once: true, amount: 0.35 }"
        :transition="{ type: 'spring', stiffness: 78, damping: 18 }"
      >
        <img
          src="/pictures/crocs.webp"
          alt=""
          :style="crocsStyle"
          class="parallax-item w-full object-contain opacity-90 drop-shadow-[0_28px_48px_rgba(0,0,0,0.16)]"
        >
      </motion.div>

      <motion.div
        class="absolute right-[-78px] top-[8px] max-w-[320px] w-[62vw] lg:right-[-26px] lg:top-[-28px] md:right-[-42px] md:top-[-12px] sm:right-[-42px] lg:max-w-[470px] lg:w-[29vw] md:max-w-[430px] md:w-[32vw] sm:w-[46vw]"
        :initial="{ opacity: 0, x: 64, y: -44, rotate: 7, scale: 0.9 }"
        :while-in-view="{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }"
        :viewport="{ once: true, amount: 0.35 }"
        :transition="{ type: 'spring', stiffness: 78, damping: 18, delay: 0.08 }"
      >
        <img
          src="/pictures/sumka.webp"
          alt=""
          :style="sumkaStyle"
          class="parallax-item w-full object-contain opacity-90 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)]"
        >
      </motion.div>
    </div>

    <div class="relative z-20 mx-auto max-w-7xl px-4 text-center lg:px-8 sm:px-6">
      <h2 class="font-bold leading-[0.95] tracking-tight uppercase">
        <FadeComponent>
          <span class="block text-4xl text-black lg:text-8xl md:text-7xl sm:text-5xl">
            МЫ СОЗДАЕМ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-4xl text-black lg:text-8xl md:text-7xl sm:text-5xl">
            НЕ ВЕЩИ.
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-4xl text-black lg:text-8xl md:text-7xl sm:text-5xl">
            МЫ СОЗДАЕМ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-4xl text-secondary lg:text-8xl md:text-7xl sm:text-5xl">
            ВПЕЧАТЛЕНИЕ.
          </span>
        </FadeComponent>
      </h2>

      <FadeComponent :delay="120">
        <p class="mx-auto mt-8 max-w-2xl text-base text-neutral-600 leading-7 md:mt-10 md:text-xl sm:text-lg">
          Каждое изделие — это продуманный дизайн, качественные материалы и
          внимание к деталям. Мы создаём мерч, который не просто выглядит красиво,
          а помогает бренду выделяться, запоминаться и вызывать доверие.
        </p>
      </FadeComponent>
    </div>
  </section>
</template>

<style scoped>
.parallax-item {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

@media (min-width: 768px) {
  .parallax-item {
    transition: transform 0.08s linear;
  }
}

@media (max-width: 767px) {
  .parallax-item {
    transition: none;
  }
}
</style>
