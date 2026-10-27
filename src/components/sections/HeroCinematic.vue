<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { WHATSAPP_LINK } from '~/constants/contacts'

/*
 * Экспериментальный первый экран на чёрном фоне. Вся «кинематографичная» часть играет при заходе
 * (2–3 секунды), дальше сцена живая и реагирует на курсор. Прокрутка обычная — без залипания.
 * Компоненты-идеи с 21st.dev:
 *  - Text Scramble — заголовок «дешифруется» слева направо;
 *  - Background Beams — тонкие световые лучи, по которым бегут оранжевые импульсы;
 *  - Spotlight — свет за курсором (на телефоне плавает сам);
 *  - 3D Card — шоппер и блокнот наклоняются в 3D за курсором;
 *  - Magnetic Button — кнопки притягиваются к курсору;
 *  - печатающая головка печатает логотип на шоппере (при наведении — ещё раз).
 * При «уменьшении движения» — всё сразу на месте, без анимаций.
 */

const titleLines = [
  { text: 'МЕРЧ ДЛЯ СИЛЬНЫХ' },
  { text: 'БРЕНДОВ', accent: true },
]

const calcLink = `${WHATSAPP_LINK}?text=${encodeURIComponent('Здравствуйте! Хочу получить расчёт на мерч.')}`

const reducedMotion = ref(false)
const isMobile = ref(false)
const scanning = ref(false)
const revealed = ref(false)
const printKey = ref(0)
const printing = ref(false)

const mouseX = ref(0.5)
const mouseY = ref(0.45)
let rafId = 0
let idleT = 0

// Text Scramble: пока символ не «встал», вместо него случайная буква
const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ#%/+*'
const scrambled = ref(titleLines.map(l => l.text))

function scrambleTitle() {
  const start = performance.now()
  const step = 38
  const total = titleLines.reduce((n, l) => n + l.text.length, 0)

  function frame(now: number) {
    const t = now - start
    let offset = 0
    scrambled.value = titleLines.map((line) => {
      const out = [...line.text].map((ch, i) => {
        const settleAt = 260 + (offset + i) * step
        if (ch === ' ' || t >= settleAt)
          return ch
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }).join('')
      offset += line.text.length
      return out
    })
    if (t < 260 + total * step + 40)
      requestAnimationFrame(frame)
    else
      scrambled.value = titleLines.map(l => l.text)
  }

  requestAnimationFrame(frame)
}

function runPrint() {
  if (reducedMotion.value || printing.value)
    return
  printing.value = true
  printKey.value++
  window.setTimeout(() => (printing.value = false), 1500)
}

// Spotlight и 3D-наклон
const spotlightStyle = computed(() => ({
  background: `radial-gradient(${isMobile.value ? 460 : 820}px circle at ${mouseX.value * 100}% ${mouseY.value * 100}%, rgba(254, 72, 25, 0.16), transparent 60%)`,
}))

function tilt(strength: number, invert = false) {
  return computed(() => {
    const k = invert ? -1 : 1
    const s = isMobile.value ? strength * 0.5 : strength
    return {
      transform: `rotateY(${(mouseX.value - 0.5) * s * k}deg) rotateX(${(0.5 - mouseY.value) * s * 0.6}deg) translate3d(${(mouseX.value - 0.5) * s * k}px, ${(mouseY.value - 0.5) * s * 0.6}px, 0)`,
    }
  })
}

const fanTilt = tilt(18, true)
const shopperTilt = tilt(22)
const notebookTilt = tilt(20, true)

// Magnetic Button: кнопка чуть тянется за курсором и возвращается
function magnet(e: MouseEvent) {
  if (isMobile.value)
    return
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const dx = e.clientX - (r.left + r.width / 2)
  const dy = e.clientY - (r.top + r.height / 2)
  el.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.32}px, 0)`
}

function unmagnet(e: MouseEvent) {
  (e.currentTarget as HTMLElement).style.transform = ''
}

function onMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX / window.innerWidth
  mouseY.value = e.clientY / window.innerHeight
}

function drift() {
  idleT += 0.006
  mouseX.value = 0.5 + Math.cos(idleT) * 0.3
  mouseY.value = 0.45 + Math.sin(idleT * 1.3) * 0.2
  rafId = requestAnimationFrame(drift)
}

function onResize() {
  isMobile.value = window.innerWidth < 768
}

// Background Beams: изогнутые лучи из-за левого верхнего угла
const beams = [
  'M-120 120 C 260 160, 520 420, 980 380 S 1500 560, 1700 640',
  'M-140 260 C 220 300, 600 520, 1020 500 S 1480 700, 1720 760',
  'M-100 -20 C 300 40, 700 260, 1120 220 S 1500 300, 1740 420',
  'M-160 420 C 260 460, 640 660, 1060 640 S 1460 820, 1720 900',
  'M-80 560 C 320 600, 680 780, 1100 760 S 1500 900, 1700 1000',
]

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  onResize()

  if (reducedMotion.value) {
    revealed.value = true
  }
  else {
    scanning.value = true
    window.setTimeout(() => (scanning.value = false), 1100)
    scrambleTitle()
    window.setTimeout(() => (revealed.value = true), 120)
    window.setTimeout(runPrint, 1300)
  }

  window.addEventListener('resize', onResize)
  if (!isMobile.value)
    window.addEventListener('mousemove', onMouseMove)
  else if (!reducedMotion.value)
    rafId = requestAnimationFrame(drift)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <!-- на телефоне первый экран = экран минус навбар (113px), чтобы кнопка не уходила под край -->
  <section class="relative min-h-[calc(100svh-113px)] overflow-hidden bg-black text-white lg:min-h-[90vh]">
    <!-- Spotlight -->
    <div class="pointer-events-none absolute inset-0 transition-[background] duration-300 ease-out" :style="spotlightStyle" aria-hidden="true" />

    <!-- Background Beams -->
    <svg
      class="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-beam" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#fe4819" stop-opacity="0" />
          <stop offset="0.5" stop-color="#fe4819" />
          <stop offset="1" stop-color="#ffb199" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-for="(d, i) in beams" :key="d">
        <path :d="d" stroke="white" stroke-opacity="0.05" stroke-width="1" />
        <path
          :d="d"
          class="hero-beam-pulse"
          stroke="url(#hero-beam)"
          stroke-width="1.5"
          stroke-linecap="round"
          :style="{ animationDelay: `${0.4 + i * 1.3}s`, animationDuration: `${6 + (i % 3) * 1.5}s` }"
        />
      </g>
    </svg>

    <div class="pointer-events-none absolute inset-0">
      <!-- веер — левый верхний угол -->
      <motion.div
        class="absolute left-[calc(-1*clamp(34px,6.2vw,150px))] top-[clamp(4px,1.2vh,18px)] w-[clamp(140px,27vw,540px)] [perspective:900px]"
        :initial="{ opacity: 0, x: -90, y: -58, rotate: -14, scale: 0.88 }"
        :animate="{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 62, damping: 17, delay: 0.5 }"
      >
        <img src="/pictures/pantone-fan.webp" alt="" :style="fanTilt" class="hero-tilt w-full drop-shadow-[0_28px_44px_rgba(0,0,0,0.6)]">
      </motion.div>

      <!-- термостакан с шоппером — левый нижний угол; на нём печатается логотип -->
      <motion.div
        class="pointer-events-auto absolute bottom-[-6px] left-[10px] w-[88px] min-[393px]:w-[130px] lg:bottom-0 md:bottom-2 lg:left-[-30px] md:left-[-24px] lg:w-[min(22vw,320px)] md:w-[220px] [perspective:1000px]"
        :initial="{ opacity: 0, x: -120, y: 90, rotate: -12, scale: 0.8 }"
        :animate="{ opacity: 1, x: 0, y: 0, rotate: -4, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 74, damping: 15, delay: 0.75 }"
        @mouseenter="runPrint"
      >
        <div class="hero-tilt relative [transform-style:preserve-3d]" :style="shopperTilt">
          <img src="/pictures/hero-shopper.webp" alt="" class="block w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]">
          <!-- зона печати — гладкий корпус термостакана (на сумке ровной ткани мало: мешают ручки) -->
          <div :key="printKey" class="absolute left-[69.5%] top-[66.5%] w-[22.5%]" :class="{ 'is-printing': printKey > 0 }">
            <img src="/pictures/print-logo.webp" alt="" class="hero-ink block w-full opacity-90 mix-blend-multiply">
            <!-- каретка УФ-принтера -->
            <div class="hero-carriage absolute -bottom-[30%] -top-[30%] w-[2px] bg-primary shadow-[0_0_14px_3px_rgba(254,72,25,0.8)]">
              <span class="absolute right-full top-0 h-full w-[260%] bg-gradient-to-l from-primary/35 to-primary/0" />
              <span class="absolute left-1/2 top-[-6px] h-[6px] w-[10px] rounded-[2px] bg-neutral-900 ring-1 ring-white/30 -translate-x-1/2" />
            </div>
            <!-- засветка после прохода -->
            <div class="hero-cure pointer-events-none absolute -inset-[40%] rounded-full bg-[radial-gradient(circle,rgba(255,170,130,0.9),rgba(254,72,25,0.35)_40%,transparent_70%)] mix-blend-screen" />
          </div>
        </div>
      </motion.div>

      <!-- блокнот с ручкой — правый нижний угол -->
      <motion.div
        class="absolute bottom-[-6px] right-[20px] w-[62px] min-[393px]:w-[88px] lg:bottom-2 md:bottom-3 lg:right-[1%] md:right-[0px] lg:w-[min(14vw,210px)] md:w-[150px] [perspective:1000px]"
        :initial="{ opacity: 0, x: 120, y: 90, rotate: 14, scale: 0.8 }"
        :animate="{ opacity: 1, x: 0, y: 0, rotate: 4, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 82, damping: 16, delay: 0.9 }"
      >
        <img src="/pictures/hero-notebook-pen.webp" alt="" :style="notebookTilt" class="hero-tilt block w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]">
      </motion.div>
    </div>

    <div class="relative z-10 mx-auto min-h-[calc(100svh-113px)] flex items-center justify-center px-4 container lg:min-h-[90vh]">
      <div class="text-left md:text-center">
        <p
          class="hero-reveal mx-auto mb-5 w-fit flex items-center gap-1.5 whitespace-nowrap border border-white/15 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/70 font-semibold tracking-[0.03em] uppercase backdrop-blur-xs sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.12em] md:mb-7 md:inline-flex md:text-sm"
          :class="{ 'is-in': revealed }"
          style="transition-delay: 0.15s"
        >
          <span class="size-1.5 shrink-0 rounded-full bg-primary sm:size-2" aria-hidden="true" />
          <span>Из семейного дела — в новый <span class="text-primary">масштаб</span></span>
        </p>

        <h1
          class="text-[min(1.875rem,8vw)] font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl lg:leading-none md:leading-none sm:leading-10"
          :aria-label="titleLines.map(l => l.text).join(' ')"
        >
          <span
            v-for="(line, i) in titleLines"
            :key="line.text"
            class="block whitespace-pre"
            :class="line.accent ? 'text-primary' : 'text-white'"
            aria-hidden="true"
          >{{ scrambled[i] }}</span>
        </h1>

        <p
          class="hero-reveal mx-auto mt-6 max-w-2xl text-base text-white/60 md:text-xl sm:text-lg"
          :class="{ 'is-in': revealed }"
          style="transition-delay: 0.9s"
        >
          Корпоративный мерч с нанесением логотипа. Свой склад
          и производство в Алматы — тысячи товаров уже в наличии.
        </p>

        <div
          class="hero-reveal mt-8 flex flex-wrap items-center justify-center gap-3 min-[393px]:flex-nowrap min-[393px]:justify-start min-[393px]:gap-2 sm:gap-3 md:justify-center"
          :class="{ 'is-in': revealed }"
          style="transition-delay: 1.1s"
        >
          <RouterLink
            to="/market"
            class="hero-magnet group inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-base text-white font-medium shadow-[0_18px_40px_rgba(254,72,25,0.4)] transition-colors min-[393px]:gap-2 min-[393px]:px-3.5 min-[393px]:text-[13px] hover:bg-orange-600 sm:gap-3 sm:px-6 sm:text-base md:px-8 md:py-4 md:text-lg"
            @mousemove="magnet"
            @mouseleave="unmagnet"
          >
            Смотреть товары
            <span class="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/18 transition-transform min-[393px]:h-7 min-[393px]:w-7 group-hover:translate-x-1 sm:h-8 sm:w-8">→</span>
          </RouterLink>

          <a
            :href="calcLink"
            target="_blank"
            rel="noopener noreferrer"
            class="hero-magnet inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/20 rounded-full bg-white/5 px-6 py-3 text-base text-white font-medium backdrop-blur-xs transition-colors min-[393px]:gap-1.5 min-[393px]:px-3.5 min-[393px]:text-[13px] sm:gap-2 sm:px-6 sm:text-base md:px-8 md:py-4 md:text-lg hover:border-white/50 hover:bg-white/10"
            @mousemove="magnet"
            @mouseleave="unmagnet"
          >
            <span class="icon-[mdi--whatsapp] text-xl text-[#25D366]" aria-hidden="true" />
            Получить расчёт
          </a>
        </div>
      </div>
    </div>

    <!-- скан-линия на старте -->
    <div v-if="scanning" class="hero-scan pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-primary shadow-[0_0_24px_6px_rgba(254,72,25,0.6)]" aria-hidden="true" />

    <!-- зерно плёнки и виньетка -->
    <div class="hero-grain pointer-events-none absolute inset-0 z-20 opacity-[0.12] mix-blend-overlay" aria-hidden="true" />
    <div class="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6))]" aria-hidden="true" />
  </section>
</template>

<style scoped>
.hero-tilt {
  will-change: transform;
  transition: transform 0.25s ease-out;
}

.hero-magnet {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    background-color 0.2s,
    border-color 0.2s;
}

.hero-reveal {
  opacity: 0;
  filter: blur(12px);
  transform: translate3d(0, 24px, 0);
  transition:
    opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-reveal.is-in {
  opacity: 1;
  filter: blur(0);
  transform: none;
}

/*
 * Печать как у УФ-принтера: каретка идёт слева направо, за ней логотип проявляется растром —
 * точки растут и сливаются в сплошной цвет, в конце краска «засвечивается» вспышкой.
 */
@property --sweep {
  syntax: '<percentage>';
  inherits: false;
  initial-value: -12%;
}

@property --dot {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

.hero-ink {
  --sweep: -12%;
  --dot: 0px;
  -webkit-mask-image: linear-gradient(to right, #000 var(--sweep), transparent calc(var(--sweep) + 8%)),
    radial-gradient(circle, #000 var(--dot), transparent calc(var(--dot) + 0.6px));
  mask-image: linear-gradient(to right, #000 var(--sweep), transparent calc(var(--sweep) + 8%)),
    radial-gradient(circle, #000 var(--dot), transparent calc(var(--dot) + 0.6px));
  -webkit-mask-size:
    100% 100%,
    5px 5px;
  mask-size:
    100% 100%,
    5px 5px;
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}

.hero-carriage,
.hero-cure {
  opacity: 0;
}

.hero-carriage {
  left: -4%;
}

.is-printing .hero-ink {
  animation:
    ink-sweep 1.1s cubic-bezier(0.45, 0, 0.55, 1) forwards,
    ink-dots 1.7s cubic-bezier(0.5, 0, 0.3, 1) forwards;
}

.is-printing .hero-carriage {
  animation: carriage 1.1s cubic-bezier(0.45, 0, 0.55, 1) forwards;
}

.is-printing .hero-cure {
  animation: cure 0.7s 1.1s ease-out forwards;
}

@keyframes ink-sweep {
  to {
    --sweep: 112%;
  }
}

@keyframes ink-dots {
  0% {
    --dot: 0.7px;
  }
  65% {
    --dot: 1.8px;
  }
  100% {
    --dot: 4px;
  }
}

@keyframes carriage {
  0% {
    left: -4%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: 104%;
    opacity: 0;
  }
}

@keyframes cure {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  35% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.15);
  }
}

/* Background Beams: короткий светящийся отрезок бежит по лучу */
.hero-beam-pulse {
  stroke-dasharray: 140 2400;
  stroke-dashoffset: 140;
  animation-name: beam;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  animation-iteration-count: infinite;
}

@keyframes beam {
  from {
    stroke-dashoffset: 140;
  }
  to {
    stroke-dashoffset: -2300;
  }
}

.hero-scan {
  animation: scan 1s cubic-bezier(0.77, 0, 0.18, 1) forwards;
}

@keyframes scan {
  from {
    top: 0;
    opacity: 1;
  }
  to {
    top: 100%;
    opacity: 0.2;
  }
}

.hero-grain {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

@media (prefers-reduced-motion: reduce) {
  .hero-reveal {
    opacity: 1;
    filter: none;
    transform: none;
    transition: none;
  }

  .hero-ink {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .hero-beam-pulse {
    animation: none;
    opacity: 0;
  }
}
</style>
