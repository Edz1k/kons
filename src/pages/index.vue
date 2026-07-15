<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({
  name: 'IndexPage',
})

const mouseX = ref(0)
const mouseY = ref(0)
const scrollY = ref(0)
const isMobile = ref(false)

const titleLines = [
  { text: 'ЛЮДИ ЗАПОМИНАЮТ' },
  { text: 'НЕ РЕКЛАМУ.' },
  { text: 'ЛЮДИ ЗАПОМИНАЮТ' },
  { text: 'ЭМОЦИИ.', accent: true },
]

const heroAssets = {
  hudi: {
    initial: { opacity: 0, x: -140, y: 110, rotate: -20, scale: 0.72 },
    animate: { opacity: 1, x: 0, y: 0, rotate: -8, scale: 1 },
    transition: { type: 'spring', stiffness: 74, damping: 15, delay: 0.24 },
  },
  chain: {
    initial: { opacity: 0, x: -110, y: -90, rotate: -28, scale: 0.7 },
    animate: { opacity: 1, x: 0, y: 0, rotate: -10, scale: 1 },
    transition: { type: 'spring', stiffness: 88, damping: 14, delay: 0.12 },
  },
  dog: {
    initial: { opacity: 0, x: 140, y: 100, rotate: 18, scale: 0.72 },
    animate: { opacity: 1, x: 0, y: 0, rotate: 6, scale: 1 },
    transition: { type: 'spring', stiffness: 82, damping: 16, delay: 0.32 },
  },
}

const heroCopyTransition = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function handleMouseMove(e: MouseEvent) {
  const x = e.clientX / window.innerWidth - 0.5
  const y = e.clientY / window.innerHeight - 0.5

  mouseX.value = x
  mouseY.value = y
}

function handleScroll() {
  scrollY.value = window.scrollY
}

function createParallaxStyle(options: {
  strengthX: number
  strengthY: number
  invertX?: boolean
  invertY?: boolean
  mobileScrollX?: number
  mobileScrollY?: number
}) {
  return computed(() => {
    const {
      strengthX,
      strengthY,
      invertX = false,
      invertY = false,
      mobileScrollX = 0,
      mobileScrollY = 0,
    } = options

    if (isMobile.value) {
      const x = scrollY.value * mobileScrollX
      const y = scrollY.value * mobileScrollY

      return {
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }
    }

    const x = mouseX.value * strengthX * (invertX ? -1 : 1)
    const y = mouseY.value * strengthY * (invertY ? -1 : 1)

    return {
      transform: `translate3d(${x}px, ${y}px, 0)`,
    }
  })
}

const hudiStyle = createParallaxStyle({
  strengthX: 50,
  strengthY: 50,
  invertX: false,
  invertY: false,
  mobileScrollX: 0,
  mobileScrollY: -0.08,
})

const chainStyle = createParallaxStyle({
  strengthX: 38,
  strengthY: 38,
  invertX: true,
  invertY: false,
  mobileScrollX: 0,
  mobileScrollY: 0.05,
})

const dogStyle = createParallaxStyle({
  strengthX: 60,
  strengthY: 30,
  invertX: true,
  invertY: false,
  mobileScrollX: 0,
  mobileScrollY: -0.12,
})

onMounted(() => {
  checkMobile()
  handleScroll()

  window.addEventListener('resize', checkMobile)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <section class="relative min-h-[90vh] overflow-hidden bg-white">
    <div class="pointer-events-none absolute inset-0">
      <motion.div
        class="absolute bottom-[-88px] left-[-72px] w-[250px] lg:bottom-[-135px] lg:left-[-80px] md:bottom-[-98px] md:left-[-60px] sm:bottom-[-72px] sm:left-[-42px] lg:w-[390px] md:w-[300px] sm:w-[255px]"
        :initial="heroAssets.hudi.initial"
        :animate="heroAssets.hudi.animate"
        :transition="heroAssets.hudi.transition"
      >
        <img
          src="/pictures/hudi.webp"
          alt=""
          :style="hudiStyle"
          class="parallax-item w-full drop-shadow-[0_32px_54px_rgba(0,0,0,0.2)]"
        >
      </motion.div>

      <motion.div
        class="absolute left-[-58px] top-[-28px] w-[210px] lg:left-[-50px] lg:top-[-20px] md:left-[-38px] md:top-[-8px] sm:left-[-28px] sm:top-[-8px] lg:w-[350px] md:w-[255px] sm:w-[210px]"
        :initial="heroAssets.chain.initial"
        :animate="heroAssets.chain.animate"
        :transition="heroAssets.chain.transition"
      >
        <img
          src="/pictures/chain.webp"
          alt=""
          :style="chainStyle"
          class="parallax-item w-full drop-shadow-[0_26px_42px_rgba(0,0,0,0.17)]"
        >
      </motion.div>

      <motion.div
        class="absolute bottom-[-62px] right-[-52px] w-[255px] lg:bottom-[-105px] lg:right-[-44px] md:bottom-[-68px] md:right-[-34px] sm:bottom-[-42px] sm:right-[-24px] lg:w-[375px] md:w-[280px] sm:w-[230px]"
        :initial="heroAssets.dog.initial"
        :animate="heroAssets.dog.animate"
        :transition="heroAssets.dog.transition"
      >
        <img
          src="/pictures/sobaka.png"
          alt=""
          :style="dogStyle"
          class="parallax-item w-full drop-shadow-[0_32px_52px_rgba(0,0,0,0.2)]"
        >
      </motion.div>
    </div>

    <div class="relative z-10 mx-auto min-h-[90vh] flex items-center justify-center px-4 container">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl">
          <motion.span
            v-for="(line, index) in titleLines"
            :key="line.text"
            class="block overflow-hidden"
            :initial="{ opacity: 0, y: 64, rotateX: -20 }"
            :animate="{ opacity: 1, y: 0, rotateX: 0 }"
            :transition="{ ...heroCopyTransition, delay: 0.1 + index * 0.08 }"
            style="transform-origin: center bottom;"
          >
            <span :class="line.accent ? 'text-secondary' : 'text-black'">
              {{ line.text }}
            </span>
          </motion.span>
        </h1>

        <motion.p
          class="mx-auto mt-6 max-w-2xl text-base text-gray-500 md:text-xl sm:text-lg"
          :initial="{ opacity: 0, y: 24 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.65, delay: 0.5, ease: [0.16, 1, 0.3, 1] }"
        >
          Мы создаём мерч, который вызывает эмоции
          и делает ваш бренд частью повседневной
          жизни клиентов и сотрудников.
        </motion.p>

        <motion.div
          class="mt-8"
          :initial="{ opacity: 0, y: 22, scale: 0.96 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :transition="{ ...heroCopyTransition, delay: 0.64 }"
        >
          <RouterLink
            to="/contacts"
            class="group inline-flex items-center gap-3 rounded-full bg-secondary px-6 py-3 text-base text-white font-medium shadow-[0_18px_36px_rgba(230,87,35,0.28)] transition hover:bg-orange-600 md:px-8 md:py-4 md:text-lg"
          >
            <motion.span
              :while-hover="{ x: -2 }"
              :transition="{ type: 'spring', stiffness: 420, damping: 24 }"
            >
              Создать коллекцию
            </motion.span>
            <motion.span
              class="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/18"
              :while-hover="{ x: 5, scale: 1.08 }"
              :while-tap="{ scale: 0.94 }"
              :transition="{ type: 'spring', stiffness: 420, damping: 20 }"
            >
              →
            </motion.span>
          </RouterLink>
        </motion.div>
      </div>
    </div>
  </section>

  <section class="pt-12 -mt-12 lg:-mt-24 md:-mt-16">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <CarouselComponent />
    </div>
  </section>

  <BrandStatementSection />
  <StickyFeatureSection />
  <CapabilitiesSection />
</template>

<route lang="yaml">
meta:
  layout: default
</route>

<style scoped>
.parallax-item {
  will-change: transform;
  transition: transform 0.18s ease-out;
}
</style>
