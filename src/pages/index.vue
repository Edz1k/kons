<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { WHATSAPP_LINK } from '~/constants/contacts'

defineOptions({
  name: 'IndexPage',
})

const mouseX = ref(0)
const mouseY = ref(0)
const scrollY = ref(0)
const isMobile = ref(false)

const titleLines = [
  { text: 'МЕРЧ ДЛЯ СИЛЬНЫХ' },
  { text: 'БРЕНДОВ', accent: true },
]

const calcLink = `${WHATSAPP_LINK}?text=${encodeURIComponent('Здравствуйте! Хочу получить расчёт на мерч.')}`

const heroAssets = {
  fan: {
    initial: { opacity: 0, x: -90, y: -58, rotate: -14, scale: 0.88 },
    animate: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 62, damping: 17, delay: 0.14 },
  },
  set: {
    initial: { opacity: 0, y: 40, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 80, damping: 16, delay: 0.7 },
  },
}

/**
 * Веер держится угла на любом экране: размер и вылет считаем от окна,
 * иначе на большом мониторе он сползает к середине левого края и мельчает.
 * Крепление уводим за угол — в кадр заходят только карточки.
 */
const fanBoxStyle = {
  width: 'clamp(140px, 27vw, 540px)',
  left: 'calc(-1 * clamp(34px, 6.2vw, 150px))',
  top: 'clamp(4px, 1.2vh, 18px)',
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

const fanStyle = createParallaxStyle({
  strengthX: 38,
  strengthY: 38,
  invertX: true,
  invertY: false,
  mobileScrollX: 0,
  mobileScrollY: 0.05,
})

const setStyle = createParallaxStyle({
  strengthX: 30,
  strengthY: 18,
  invertX: true,
  invertY: false,
  mobileScrollX: 0,
  mobileScrollY: -0.04,
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
  <!-- на телефоне первый экран = экран минус навбар (113px), чтобы кнопка не уходила под край -->
  <section class="relative min-h-[calc(100svh-113px)] overflow-hidden bg-white lg:min-h-[90vh]">
    <div class="pointer-events-none absolute inset-0">
      <motion.div
        class="absolute"
        :style="fanBoxStyle"
        :initial="heroAssets.fan.initial"
        :animate="heroAssets.fan.animate"
        :transition="heroAssets.fan.transition"
      >
        <img
          src="/pictures/pantone-fan.webp"
          alt=""
          :style="fanStyle"
          class="parallax-item w-full drop-shadow-[0_28px_44px_rgba(15,23,42,0.18)]"
        >
      </motion.div>

      <!-- набор (термостакан, сумка, блокнот) внизу по центру, над бегущей строкой -->
      <motion.div
        class="absolute bottom-2 left-1/2 w-[min(44vw,230px)] -translate-x-1/2 min-[393px]:bottom-3 min-[393px]:w-[min(56vw,230px)] lg:bottom-8 md:bottom-6 lg:w-[min(28vw,380px)] md:w-[min(42vw,340px)]"
        :initial="heroAssets.set.initial"
        :animate="heroAssets.set.animate"
        :transition="heroAssets.set.transition"
      >
        <img
          src="/pictures/hero-set.webp"
          alt=""
          :style="setStyle"
          class="parallax-item w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.14)]"
        >
      </motion.div>
    </div>

    <!-- с планшета снизу оставляем место под набор, чтобы текст и кнопки центрировались над ним -->
    <div class="relative z-10 mx-auto min-h-[calc(100svh-113px)] flex items-center justify-center px-4 container lg:min-h-[90vh] lg:pb-60 md:pb-52">
      <div class="text-left md:text-center">
        <motion.p
          class="mx-auto mb-5 w-fit flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[10px] text-neutral-600 font-semibold tracking-[0.03em] uppercase backdrop-blur-xs sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.12em] md:mb-7 md:inline-flex md:text-sm"
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <span class="size-1.5 shrink-0 rounded-full bg-primary sm:size-2" aria-hidden="true" />
          <span>Из семейного дела — в новый <span class="text-primary">масштаб</span></span>
        </motion.p>

        <h1 class="text-[min(1.875rem,8vw)] font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl lg:leading-none md:leading-none sm:leading-10">
          <motion.span
            v-for="(line, index) in titleLines"
            :key="line.text"
            class="block overflow-hidden whitespace-nowrap"
            :initial="{ opacity: 0, y: 64, rotateX: -20 }"
            :animate="{ opacity: 1, y: 0, rotateX: 0 }"
            :transition="{ ...heroCopyTransition, delay: 0.1 + index * 0.08 }"
            style="transform-origin: left bottom;"
          >
            <span :class="line.accent ? 'text-primary' : 'text-black'">
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
          Корпоративный мерч с нанесением логотипа. Свой склад
          и производство в Алматы — тысячи товаров уже в наличии.
        </motion.p>

        <motion.div
          class="mt-8 flex flex-wrap items-center justify-center gap-3 min-[393px]:flex-nowrap min-[393px]:justify-start min-[393px]:gap-2 sm:gap-3 md:justify-center"
          :initial="{ opacity: 0, y: 22, scale: 0.96 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :transition="{ ...heroCopyTransition, delay: 0.64 }"
        >
          <RouterLink
            to="/market"
            class="group inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-base text-white font-medium shadow-[0_18px_36px_rgba(230,87,35,0.28)] transition min-[393px]:gap-2 min-[393px]:px-3.5 min-[393px]:text-[13px] hover:bg-orange-600 sm:gap-3 sm:px-6 sm:text-base md:px-8 md:py-4 md:text-lg"
          >
            <motion.span
              :while-hover="{ x: -2 }"
              :transition="{ type: 'spring', stiffness: 420, damping: 24 }"
            >
              Смотреть товары
            </motion.span>
            <motion.span
              class="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/18 min-[393px]:h-7 min-[393px]:w-7 sm:h-8 sm:w-8"
              :while-hover="{ x: 5, scale: 1.08 }"
              :while-tap="{ scale: 0.94 }"
              :transition="{ type: 'spring', stiffness: 420, damping: 20 }"
            >
              →
            </motion.span>
          </RouterLink>

          <a
            :href="calcLink"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-black/15 rounded-full bg-white/80 px-6 py-3 text-base text-black font-medium backdrop-blur-xs transition min-[393px]:gap-1.5 min-[393px]:px-3.5 min-[393px]:text-[13px] sm:gap-2 sm:px-6 sm:text-base md:px-8 md:py-4 md:text-lg hover:border-black hover:bg-white"
          >
            <span class="icon-[mdi--whatsapp] text-xl text-[#25D366]" aria-hidden="true" />
            Получить расчёт
          </a>
        </motion.div>
      </div>
    </div>
  </section>

  <TickerSection />
  <StockSection />

  <section class="pt-12">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <CarouselComponent />
    </div>
  </section>

  <BrandStatementSection />
  <StickyFeatureSection />
  <StepsSection />
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
