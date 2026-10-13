<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'
import { printMethods } from './content'

/*
 * Feature Steps (21st.dev): методы нанесения переключаются сами,
 * полоска под активным показывает, сколько осталось до следующего.
 * Клик или наведение выбирает метод вручную и перезапускает отсчёт.
 */
const STEP_MS = 3500

const active = ref(0)
const current = computed(() => printMethods[active.value]!)
const reduceMotion = useReducedMotion()

const { pause, resume, isActive } = useIntervalFn(() => {
  active.value = (active.value + 1) % printMethods.length
}, STEP_MS)

function select(index: number) {
  active.value = index
  pause()
  resume()
}

// Пока курсор над списком, автосмена стоит — человек читает
function hover(index: number) {
  active.value = index
  pause()
}
</script>

<template>
  <section class="py-20 md:py-28">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <p class="text-sm text-primary font-semibold tracking-[0.25em] uppercase">
        Собственное производство в Алматы
      </p>

      <div class="grid mt-4 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <h2 class="text-3xl font-black leading-[0.95] tracking-tight uppercase md:text-6xl sm:text-4xl">
          10+ печатных станков.
          <span class="text-neutral-400">Ваша идея не обязана быть простой.</span>
        </h2>
        <div class="text-base text-neutral-600 leading-7 space-y-4 md:text-lg">
          <p>
            UV, DTF, UV DTF, лазер, шелкография, тиснение, сублимация, термотрансфер.
          </p>
          <p>
            Пластик, металл, текстиль, бумага. У каждого материала свои правила, но мы научились договариваться с каждым из них.
          </p>
        </div>
      </div>

      <div class="grid mt-12 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:mt-16">
        <ol class="order-2 grid grid-cols-2 gap-2 lg:order-1 lg:grid-cols-1 sm:grid-cols-4" @mouseleave="resume">
          <li v-for="(method, index) in printMethods" :key="method.title">
            <button
              type="button"
              class="group relative w-full overflow-hidden rounded-2xl px-4 py-3 text-left transition-colors lg:px-6 lg:py-4"
              :class="active === index ? 'bg-black text-white' : 'bg-neutral-100 text-black ring-1 ring-black/5 ring-inset hover:bg-neutral-200'"
              :aria-pressed="active === index"
              @click="select(index)"
              @mouseenter="hover(index)"
            >
              <span class="flex items-baseline gap-3">
                <span class="hidden text-xs tabular-nums opacity-50 lg:inline">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="text-sm font-semibold lg:text-xl sm:text-base">{{ method.title }}</span>
              </span>
              <span
                v-if="active === index && isActive && !reduceMotion"
                :key="`bar-${active}`"
                class="progress absolute bottom-0 left-0 h-0.5 bg-primary"
                :style="{ animationDuration: `${STEP_MS}ms` }"
                aria-hidden="true"
              />
            </button>
          </li>
        </ol>

        <div class="relative order-1 aspect-[3/2] overflow-hidden rounded-3xl bg-neutral-100 lg:order-2 lg:aspect-auto lg:min-h-[520px]">
          <AnimatePresence>
            <motion.img
              :key="current.src"
              :src="current.src"
              :alt="current.alt"
              loading="lazy"
              decoding="async"
              class="absolute inset-0 size-full object-cover"
              :initial="{ opacity: 0, scale: 1.06 }"
              :animate="{ opacity: 1, scale: 1 }"
              :exit="{ opacity: 0 }"
              :transition="{ duration: 0.6, ease: 'easeOut' }"
            />
          </AnimatePresence>
          <div class="absolute inset-x-0 bottom-0 from-black/70 to-transparent bg-gradient-to-t p-6 md:p-8" aria-live="polite">
            <p class="text-2xl text-white font-bold uppercase md:text-4xl">
              {{ current.title }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.progress {
  animation-name: progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes progress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
</style>
