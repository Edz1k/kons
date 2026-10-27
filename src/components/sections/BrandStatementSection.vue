<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Button } from '~/components/ui/button'
import { WHATSAPP_LINK } from '~/constants/contacts'

const orderLink = `${WHATSAPP_LINK}?text=${encodeURIComponent('Здравствуйте! Нужного товара нет в наличии — хочу подобрать под заказ.')}`

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

const bottlesStyle = computed(() => {
  const startY = 30
  const endY = -60
  const y = startY + (endY - startY) * scrollProgress.value

  return {
    transform: `translate3d(0, ${y}px, 0) rotate(4deg)`,
  }
})

// на телефоне бутылки в потоке текста: при прокрутке поднимаются и выпрямляются
const mobileBottlesStyle = computed(() => {
  const progress = scrollProgress.value
  const y = 60 - 120 * progress
  const rotate = 10 - 12 * progress

  return {
    transform: `translate3d(0, ${y}px, 0) rotate(${rotate}deg)`,
  }
})

// веер ручек держится угла: поворот уже в самой картинке, параллакс лёгкий
const pensStyle = computed(() => {
  const startY = -16
  const endY = 24
  const y = startY + (endY - startY) * scrollProgress.value

  return {
    transform: `translate3d(0, ${y}px, 0)`,
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
    class="relative isolate min-h-[540px] overflow-hidden py-16 sm:pb-36 lg:py-28 md:py-24"
  >
    <div class="pointer-events-none absolute inset-0 z-0">
      <!-- текст выровнен влево, поэтому с 640px бутылки стоят справа внизу, под веером ручек; на телефоне они в потоке текста -->
      <motion.div
        class="absolute bottom-[-40px] right-[3%] hidden max-w-[180px] w-[26vw] sm:block lg:bottom-[-70px] md:bottom-[-56px] lg:right-[12%] lg:max-w-[220px] lg:w-[16vw] md:max-w-[200px] md:w-[22vw]"
        :initial="{ opacity: 0, x: 60, y: 45, rotate: -6, scale: 0.9 }"
        :while-in-view="{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }"
        :viewport="{ once: true, amount: 0.35 }"
        :transition="{ type: 'spring', stiffness: 78, damping: 18 }"
      >
        <img
          src="/pictures/bottles.webp"
          alt=""
          :style="bottlesStyle"
          class="parallax-item w-full object-contain opacity-90 drop-shadow-[0_28px_48px_rgba(0,0,0,0.16)]"
        >
      </motion.div>

      <motion.div
        class="absolute right-[-20px] top-[-32px] max-w-[118px] w-[29vw] lg:right-[-30px] lg:top-[-40px] md:right-[-24px] md:top-[-32px] sm:right-[-20px] lg:max-w-[320px] lg:w-[20vw] md:max-w-[240px] md:w-[22vw] sm:w-[26vw]"
        :initial="{ opacity: 0, x: 24, y: -24, rotate: 6, scale: 0.9 }"
        :while-in-view="{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }"
        :viewport="{ once: true, amount: 0.1 }"
        :transition="{ type: 'spring', stiffness: 78, damping: 18, delay: 0.08 }"
      >
        <img
          src="/pictures/pens-fan.webp"
          alt=""
          :style="pensStyle"
          class="parallax-item w-full object-contain opacity-90 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)]"
        >
      </motion.div>
    </div>

    <div class="relative z-20 mx-auto max-w-7xl px-4 text-left lg:px-8 sm:px-6">
      <FadeComponent>
        <h2 class="whitespace-nowrap text-[min(2.25rem,6.8vw)] font-bold leading-[0.95] tracking-tight uppercase sm:text-[min(3rem,6.8vw)] md:text-[min(4.5rem,7vw)] lg:text-[min(6rem,6.4vw)]">
          Мерч <span class="text-primary">под ключ</span>
        </h2>
      </FadeComponent>

      <FadeComponent :delay="120">
        <p class="mt-6 max-w-2xl text-base text-neutral-600 leading-7 md:mt-8 md:text-xl sm:text-lg md:leading-8 sm:leading-7">
          Соберём мерч в едином стиле — от текстиля и корпоративных подарков
          до полиграфии. Цвета, материалы и нанесение — ни один предмет
          не будет выглядеть случайным.
        </p>
      </FadeComponent>

      <FadeComponent :delay="200">
        <p class="mt-6 text-base font-bold leading-snug tracking-tight uppercase md:mt-8 md:text-2xl sm:text-xl lg:text-3xl">
          <span class="block text-black">По отдельности&nbsp;— просто вещи.</span>
          <span class="block text-primary">Вместе&nbsp;— коллекция бренда.</span>
        </p>
      </FadeComponent>

      <!-- на телефоне бутылки между подписью и «Не нашли?» -->
      <div class="sm:hidden">
        <FadeComponent :delay="240">
          <img
            src="/pictures/bottles.webp"
            alt=""
            :style="mobileBottlesStyle"
            class="parallax-item mt-8 w-[48vw] max-w-[200px] -ml-6 drop-shadow-[0_28px_48px_rgba(0,0,0,0.16)]"
          >
        </FadeComponent>
      </div>

      <FadeComponent :delay="280">
        <div class="mt-8 max-w-xl border-t border-black/10 pt-6 sm:mt-10 md:mt-12 md:pt-8">
          <h3 class="text-xl font-bold tracking-tight md:text-2xl">
            Не нашли? <span class="text-primary">Привезём.</span>
          </h3>
          <p class="mt-2 text-sm text-neutral-600 leading-6 md:text-base md:leading-7">
            Если нужной позиции нет в&nbsp;наличии — найдём и&nbsp;привезём под заказ из&nbsp;Китая, России или Беларуси.
            Учтём тираж, бюджет и&nbsp;сроки.
          </p>
          <Button as-child size="lg" class="mt-5 h-12 rounded-full px-6 text-base shadow-[0_18px_36px_rgba(254,72,25,0.28)]">
            <a :href="orderLink" target="_blank" rel="noopener noreferrer">
              <span class="icon-[mdi--whatsapp] size-5" aria-hidden="true" />
              Подобрать товар под заказ
            </a>
          </Button>
        </div>
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
