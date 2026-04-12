<script setup lang="ts">
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

// crocs: старт снизу -> едет вверх
const crocsStyle = computed(() => {
  const startY = 350
  const endY = -180
  const y = startY + (endY - startY) * scrollProgress.value

  return {
    transform: `translate3d(0, ${y}px, 0)`,
  }
})

// sumka: старт сверху -> едет вниз
const sumkaStyle = computed(() => {
  const startY = -150
  const endY = 240
  const y = startY + (endY - startY) * scrollProgress.value

  return {
    transform: `translate3d(0, ${y}px, 0) rotate(-20deg)`,
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
    class="relative isolate overflow-hidden py-16 lg:py-24 md:py-20"
  >
    <!-- Декоративные картинки -->
    <div class="pointer-events-none absolute inset-0 z-0">
      <FadeComponent>
        <img
          src="/pictures/crocs.webp"
          alt=""
          :style="crocsStyle"
          class="parallax-item absolute bottom-[-20px] left-[-40px] max-w-[240px] w-[52vw] object-contain md:bottom-[0] md:left-0 sm:left-[-20px] md:max-w-none md:w-[30%] sm:max-w-[280px] sm:w-[42vw]"
        >
      </FadeComponent>

      <FadeComponent>
        <img
          src="/pictures/sumka.webp"
          alt=""
          :style="sumkaStyle"
          class="parallax-item absolute right-[-30px] top-[80px] max-w-[260px] w-[56vw] object-contain md:right-0 md:top-[120px] sm:right-[-10px] md:max-w-none md:w-[35%] sm:max-w-[300px] sm:w-[44vw]"
        >
      </FadeComponent>
    </div>

    <!-- Текст -->
    <div class="relative z-20 mx-auto max-w-7xl px-4 text-center lg:px-8 sm:px-6">
      <h2 class="font-bold leading-[0.95] tracking-tight uppercase">
        <FadeComponent>
          <span class="block text-5xl text-black lg:text-8xl md:text-7xl">
            СДЕЛАЕМ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            БРЕНД ОДЕЖДЫ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            ВНУТРИ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            ВАШЕЙ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            КОМПАНИИ
          </span>
        </FadeComponent>
      </h2>
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
