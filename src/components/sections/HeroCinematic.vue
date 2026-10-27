<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { WHATSAPP_LINK } from '~/constants/contacts'

/*
 * Экспериментальный «кинематографичный» первый экран (идеи с 21st.dev: Spotlight, Blur Text Reveal,
 * Scroll Zoom Hero, Grain). Тексты, кнопки и картинки — те же, что в обычном первом экране.
 *
 * 1. Интро-шторка: при первом заходе за сессию чёрный экран с BRILLEX уезжает вверх и открывает сцену.
 * 2. Заголовок проявляется по словам из размытия.
 * 3. Прожектор: мягкое оранжевое пятно света идёт за курсором (на телефоне медленно плавает само).
 * 4. Сцена на прокрутке: экран «залипает», текст уходит вверх с размытием, шоппер и блокнот выезжают
 *    из углов к центру и растут, веер отлетает, огромный контурный BRILLEX на фоне едет вбок.
 * 5. Зерно плёнки и виньетка поверх всего.
 * При «уменьшении движения» остаётся статичный экран без шторки и залипания.
 */

const titleLines = [
  { words: ['МЕРЧ', 'ДЛЯ', 'СИЛЬНЫХ'] },
  { words: ['БРЕНДОВ'], accent: true },
]

const calcLink = `${WHATSAPP_LINK}?text=${encodeURIComponent('Здравствуйте! Хочу получить расчёт на мерч.')}`

const sectionRef = ref<HTMLElement | null>(null)
const navHeight = ref(113)
const progress = ref(0)
const isMobile = ref(false)
const reducedMotion = ref(false)
const showCurtain = ref(false)
const curtainOpen = ref(false)
const revealed = ref(false)

const mouseX = ref(0.5)
const mouseY = ref(0.4)
let idleT = 0
let rafId = 0
let ticking = false

// после шторки элементы сцены стартуют с задержкой
const introDelay = computed(() => (showCurtain.value ? 1.25 : 0))

function clamp(v: number, min = 0, max = 1) {
  return Math.min(Math.max(v, min), max)
}

// плавный участок прогресса: 0 до from, 1 после to, между — ease-in-out
function phase(from: number, to: number) {
  const t = clamp((progress.value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

const pinned = computed(() => !reducedMotion.value)

const sectionStyle = computed(() => (pinned.value
  ? { height: isMobile.value ? '175svh' : '210vh' }
  : {}))

const stageStyle = computed(() => ({
  top: `${navHeight.value}px`,
  height: `calc(100svh - ${navHeight.value}px)`,
}))

const copyStyle = computed(() => {
  const e = phase(0.12, 0.5)
  return {
    opacity: String(1 - e),
    transform: `translate3d(0, ${-90 * e}px, 0) scale(${1 - 0.08 * e})`,
    filter: `blur(${10 * e}px)`,
    pointerEvents: e > 0.6 ? 'none' : 'auto',
  } as Record<string, string>
})

// шоппер и блокнот едут из углов к центру и растут
const shopperScrollStyle = computed(() => {
  const e = phase(0.2, 0.85)
  // на телефоне оба предмета почти во всю ширину — растут меньше и почти не сдвигаются вбок, чтобы не наехать друг на друга
  const x = isMobile.value ? 6 : 26
  const y = isMobile.value ? 22 : 22
  const s = 1 + e * (isMobile.value ? 0.45 : 0.35)
  return { transform: `translate3d(${x * e}vw, ${-y * e}svh, 0) scale(${s})` }
})

const notebookScrollStyle = computed(() => {
  const e = phase(0.24, 0.88)
  const x = isMobile.value ? 4 : 24
  const y = isMobile.value ? 22 : 24
  const s = 1 + e * (isMobile.value ? 0.5 : 0.4)
  return { transform: `translate3d(${-x * e}vw, ${-y * e}svh, 0) scale(${s}) rotate(${-6 * e}deg)` }
})

const fanScrollStyle = computed(() => {
  const e = phase(0.05, 0.6)
  return { transform: `translate3d(${-12 * e}vw, ${-14 * e}svh, 0) rotate(${-28 * e}deg)` }
})

const watermarkStyle = computed(() => {
  const e = phase(0, 1)
  return {
    transform: `translate3d(${8 - 30 * e}%, -50%, 0)`,
    opacity: String(0.5 + 0.5 * phase(0.3, 0.9)),
  }
})

const scrollHintStyle = computed(() => ({ opacity: String(1 - phase(0, 0.06)) }))

// мышь (на телефоне — медленный «дрейф») двигает свет и чуть-чуть предметы
const spotlightStyle = computed(() => ({
  background: `radial-gradient(${isMobile.value ? 420 : 720}px circle at ${mouseX.value * 100}% ${mouseY.value * 100}%, rgba(254, 72, 25, 0.13), transparent 62%)`,
}))

function parallax(strength: number, invert = false) {
  return computed(() => {
    if (isMobile.value)
      return {}
    const k = invert ? -1 : 1
    return { transform: `translate3d(${(mouseX.value - 0.5) * strength * k}px, ${(mouseY.value - 0.5) * strength * 0.7}px, 0)` }
  })
}

const fanMouse = parallax(38, true)
const shopperMouse = parallax(44)
const notebookMouse = parallax(34, true)

function measure() {
  isMobile.value = window.innerWidth < 768
  const nav = document.querySelector('nav') as HTMLElement | null
  navHeight.value = nav?.offsetHeight ?? navHeight.value
}

function updateProgress() {
  ticking = false
  const el = sectionRef.value
  if (!el || !pinned.value)
    return
  const rect = el.getBoundingClientRect()
  const distance = el.offsetHeight - (window.innerHeight - navHeight.value)
  progress.value = clamp((navHeight.value - rect.top) / Math.max(distance, 1))
}

function onScroll() {
  if (ticking)
    return
  ticking = true
  requestAnimationFrame(updateProgress)
}

function onResize() {
  measure()
  onScroll()
}

function onMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX / window.innerWidth
  mouseY.value = e.clientY / window.innerHeight
}

// на телефоне мыши нет — свет медленно плавает по кругу
function drift() {
  idleT += 0.006
  mouseX.value = 0.5 + Math.cos(idleT) * 0.28
  mouseY.value = 0.42 + Math.sin(idleT * 1.3) * 0.18
  rafId = requestAnimationFrame(drift)
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  measure()
  updateProgress()

  let seen = true
  try {
    seen = sessionStorage.getItem('brillex-hero-intro') === '1'
    sessionStorage.setItem('brillex-hero-intro', '1')
  }
  catch {}

  if (!seen && !reducedMotion.value) {
    showCurtain.value = true
    window.setTimeout(() => (curtainOpen.value = true), 650)
    window.setTimeout(() => (showCurtain.value = false), 1800)
    window.setTimeout(() => (revealed.value = true), 1000)
  }
  else {
    window.setTimeout(() => (revealed.value = true), 60)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  if (!isMobile.value)
    window.addEventListener('mousemove', onMouseMove)
  else if (!reducedMotion.value)
    rafId = requestAnimationFrame(drift)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
})

function wordIndex(line: number, word: number) {
  return titleLines.slice(0, line).reduce((n, l) => n + l.words.length, 0) + word
}
</script>

<template>
  <section ref="sectionRef" class="relative bg-white" :style="sectionStyle">
    <div
      class="relative overflow-hidden bg-white"
      :class="pinned ? 'sticky' : 'min-h-[calc(100svh-113px)] lg:min-h-[90vh]'"
      :style="pinned ? stageStyle : {}"
    >
      <!-- прожектор за курсором -->
      <div class="pointer-events-none absolute inset-0 transition-[background] duration-300 ease-out" :style="spotlightStyle" aria-hidden="true" />

      <!-- огромный контурный BRILLEX на фоне -->
      <div
        class="pointer-events-none absolute left-0 top-1/2 select-none whitespace-nowrap text-[34vw] text-transparent font-black leading-none tracking-tighter [-webkit-text-stroke:1px_rgba(0,0,0,0.07)] lg:text-[24vw]"
        :style="watermarkStyle"
        aria-hidden="true"
      >
        BRILLEX
      </div>

      <div class="pointer-events-none absolute inset-0">
        <motion.div
          class="absolute left-[calc(-1*clamp(34px,6.2vw,150px))] top-[clamp(4px,1.2vh,18px)] w-[clamp(140px,27vw,540px)]"
          :initial="{ opacity: 0, x: -90, y: -58, rotate: -14, scale: 0.88 }"
          :animate="{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }"
          :transition="{ type: 'spring', stiffness: 62, damping: 17, delay: introDelay + 0.14 }"
        >
          <div class="will-change-transform" :style="fanScrollStyle">
            <img src="/pictures/pantone-fan.webp" alt="" :style="fanMouse" class="hero-parallax w-full drop-shadow-[0_28px_44px_rgba(15,23,42,0.18)]">
          </div>
        </motion.div>

        <!-- термостакан с шоппером — левый нижний угол -->
        <motion.div
          class="absolute bottom-[-6px] left-[10px] w-[88px] min-[393px]:w-[130px] lg:bottom-0 md:bottom-2 lg:left-[-30px] md:left-[-24px] lg:w-[min(22vw,320px)] md:w-[220px]"
          :initial="{ opacity: 0, x: -120, y: 90, rotate: -12, scale: 0.8 }"
          :animate="{ opacity: 1, x: 0, y: 0, rotate: -4, scale: 1 }"
          :transition="{ type: 'spring', stiffness: 74, damping: 15, delay: introDelay + 0.24 }"
        >
          <div class="origin-bottom-left will-change-transform" :style="shopperScrollStyle">
            <img src="/pictures/hero-shopper.webp" alt="" :style="shopperMouse" class="hero-parallax w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.16)]">
          </div>
        </motion.div>

        <!-- блокнот с ручкой — правый нижний угол -->
        <motion.div
          class="absolute bottom-[-6px] right-[20px] w-[62px] min-[393px]:w-[88px] lg:bottom-2 md:bottom-3 lg:right-[1%] md:right-[0px] lg:w-[min(14vw,210px)] md:w-[150px]"
          :initial="{ opacity: 0, x: 120, y: 90, rotate: 14, scale: 0.8 }"
          :animate="{ opacity: 1, x: 0, y: 0, rotate: 4, scale: 1 }"
          :transition="{ type: 'spring', stiffness: 82, damping: 16, delay: introDelay + 0.32 }"
        >
          <div class="origin-bottom-right will-change-transform" :style="notebookScrollStyle">
            <img src="/pictures/hero-notebook-pen.webp" alt="" :style="notebookMouse" class="hero-parallax w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.16)]">
          </div>
        </motion.div>
      </div>

      <div
        class="absolute inset-0 z-10 mx-auto flex items-center justify-center px-4 container will-change-transform"
        :style="copyStyle"
      >
        <div class="text-left md:text-center">
          <p
            class="hero-reveal mx-auto mb-5 w-fit flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[10px] text-neutral-600 font-semibold tracking-[0.03em] uppercase backdrop-blur-xs sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.12em] md:mb-7 md:inline-flex md:text-sm"
            :class="{ 'is-in': revealed }"
          >
            <span class="size-1.5 shrink-0 rounded-full bg-primary sm:size-2" aria-hidden="true" />
            <span>Из семейного дела — в новый <span class="text-primary">масштаб</span></span>
          </p>

          <h1 class="text-[min(1.875rem,8vw)] font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl lg:leading-none md:leading-none sm:leading-10">
            <span v-for="(line, li) in titleLines" :key="li" class="block whitespace-nowrap">
              <span
                v-for="(word, wi) in line.words"
                :key="word"
                class="hero-word inline-block"
                :class="[line.accent ? 'text-primary' : 'text-black', { 'is-in': revealed }]"
                :style="{ transitionDelay: `${0.08 + wordIndex(li, wi) * 0.09}s` }"
              >{{ word }}</span>
            </span>
          </h1>

          <p
            class="hero-reveal mx-auto mt-6 max-w-2xl text-base text-gray-500 md:text-xl sm:text-lg"
            :class="{ 'is-in': revealed }"
            style="transition-delay: 0.55s"
          >
            Корпоративный мерч с нанесением логотипа. Свой склад
            и производство в Алматы — тысячи товаров уже в наличии.
          </p>

          <div
            class="hero-reveal mt-8 flex flex-wrap items-center justify-center gap-3 min-[393px]:flex-nowrap min-[393px]:justify-start min-[393px]:gap-2 sm:gap-3 md:justify-center"
            :class="{ 'is-in': revealed }"
            style="transition-delay: 0.7s"
          >
            <RouterLink
              to="/market"
              class="group inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-base text-white font-medium shadow-[0_18px_36px_rgba(230,87,35,0.28)] transition min-[393px]:gap-2 min-[393px]:px-3.5 min-[393px]:text-[13px] hover:bg-orange-600 sm:gap-3 sm:px-6 sm:text-base md:px-8 md:py-4 md:text-lg"
            >
              <span class="transition-transform group-hover:-translate-x-0.5">Смотреть товары</span>
              <span class="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/18 transition-transform min-[393px]:h-7 min-[393px]:w-7 group-hover:translate-x-1 sm:h-8 sm:w-8">→</span>
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
          </div>
        </div>
      </div>

      <!-- подсказка «листайте» — пропадает с первой прокруткой -->
      <div
        v-if="pinned"
        class="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden flex-col items-center gap-2 text-[10px] text-neutral-400 font-semibold tracking-[0.25em] uppercase -translate-x-1/2 md:flex"
        :style="scrollHintStyle"
        aria-hidden="true"
      >
        Листайте
        <span class="relative h-8 w-px overflow-hidden bg-black/10">
          <span class="hero-scroll-dot absolute left-0 top-0 h-3 w-px bg-primary" />
        </span>
      </div>

      <!-- зерно плёнки и виньетка -->
      <div class="hero-grain pointer-events-none absolute inset-0 z-20 opacity-[0.07] mix-blend-multiply" aria-hidden="true" />
      <div class="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.07))]" aria-hidden="true" />

      <!-- интро-шторка -->
      <div
        v-if="showCurtain"
        class="hero-curtain absolute inset-0 z-30 flex flex-col items-center justify-center bg-black"
        :class="{ 'is-open': curtainOpen }"
        aria-hidden="true"
      >
        <span class="hero-curtain-word text-4xl text-white font-black tracking-[0.3em] md:text-7xl">BRILLEX</span>
        <span class="hero-curtain-line mt-5 h-px bg-primary" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-parallax {
  will-change: transform;
  transition: transform 0.12s linear;
}

/* текстовые блоки: снизу и из размытия */
.hero-reveal,
.hero-word {
  opacity: 0;
  filter: blur(12px);
  transform: translate3d(0, 28px, 0);
  transition:
    opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-word {
  margin-right: 0.25em;
}

.hero-word:last-child {
  margin-right: 0;
}

.hero-reveal.is-in,
.hero-word.is-in {
  opacity: 1;
  filter: blur(0);
  transform: none;
}

/* шторка уезжает вверх */
.hero-curtain {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1.1s cubic-bezier(0.77, 0, 0.18, 1);
}

.hero-curtain.is-open {
  clip-path: inset(0 0 100% 0);
}

.hero-curtain-word {
  animation: curtain-word 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-curtain-line {
  width: 0;
  animation: curtain-line 0.6s 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes curtain-word {
  from {
    opacity: 0;
    letter-spacing: 0.6em;
    filter: blur(10px);
  }
}

@keyframes curtain-line {
  to {
    width: 6rem;
  }
}

.hero-scroll-dot {
  animation: scroll-dot 1.6s ease-in-out infinite;
}

@keyframes scroll-dot {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(300%);
  }
}

/* зерно: SVG-шум */
.hero-grain {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

@media (prefers-reduced-motion: reduce) {
  .hero-reveal,
  .hero-word {
    opacity: 1;
    filter: none;
    transform: none;
    transition: none;
  }
}
</style>
