<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({
  name: 'IndexPage',
})

const mouseX = ref(0)
const mouseY = ref(0)
const scrollY = ref(0)
const isMobile = ref(false)

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
  <section class="relative min-h-[90vh] overflow-hidden">
    <div class="pointer-events-none absolute inset-0">
      <!-- hudi -->
      <img
        src="/pictures/hudi.webp"
        alt=""
        :style="hudiStyle"
        class="parallax-item absolute bottom-[-70px] left-[-60px] w-[240px] lg:bottom-[-120px] lg:left-[-80px] md:bottom-[-90px] md:left-[-60px] sm:bottom-[-60px] sm:left-[-40px] lg:w-[360px] md:w-[280px] sm:w-[250px]"
      >

      <!-- chain -->
      <img
        src="/pictures/chain.webp"
        alt=""
        :style="chainStyle"
        class="parallax-item absolute left-[-40px] top-[0px] w-[190px] lg:left-[-40px] lg:top-[0px] md:left-[-30px] md:top-[10px] sm:left-[-20px] sm:top-[0px] lg:w-[320px] md:w-[240px] sm:w-[200px]"
      >

      <!-- dog -->
      <img
        src="/pictures/sobaka.png"
        alt=""
        :style="dogStyle"
        class="parallax-item absolute bottom-[-40px] right-[-35px] w-[240px] lg:bottom-[-80px] lg:right-[-40px] md:bottom-[-50px] md:right-[-30px] sm:bottom-[-30px] sm:right-[-20px] lg:w-[340px] md:w-[260px] sm:w-[220px]"
      >
    </div>

    <div class="relative z-10 mx-auto min-h-[90vh] flex items-center justify-center px-4 container">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl">
          <span class="text-secondary">
            МЫ СОЗДАЕМ МЕРЧ,
          </span>
          <br>
          КОТОРЫЙ ВДОХНОВЛЯЕТ
          <br>
          СТАТЬ АМБАССАДОРОМ
          <br>
          ВАШЕГО БРЕНДА
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-base text-gray-500 md:text-xl sm:text-lg">
          Полный цикл — от идеи до готовой коллекции.
          Мерч для компаний, брендов и мероприятий,
          который хочется носить и показывать.
        </p>

        <div class="mt-8">
          <RouterLink
            to="/contacts"
            class="rounded-full bg-secondary px-6 py-3 text-base text-white font-medium transition hover:bg-orange-600 md:px-8 md:py-4 md:text-lg"
          >
            Заказать мерч →
          </RouterLink>
        </div>
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
