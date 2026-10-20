<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { animate, useReducedMotion } from 'motion-v'
import { ref } from 'vue'

/** Number Ticker (Magic UI, 21st.dev): число докручивается, когда попадает в экран. */
const props = withDefaults(defineProps<{
  value: number
  duration?: number
  delay?: number
}>(), {
  duration: 1.6,
  delay: 0,
})

const el = ref<HTMLElement | null>(null)
const reduceMotion = useReducedMotion()

const formatter = new Intl.NumberFormat('ru-RU')
// До старта показываем финальное число: так оно есть в SSG-разметке и без JS
const display = ref(formatter.format(props.value))

const { stop } = useIntersectionObserver(el, ([entry]) => {
  if (!entry?.isIntersecting)
    return
  stop()
  if (reduceMotion.value)
    return

  display.value = formatter.format(0)
  animate(0, props.value, {
    duration: props.duration,
    delay: props.delay,
    ease: [0.16, 1, 0.3, 1],
    onUpdate: (latest) => {
      display.value = formatter.format(Math.round(latest))
    },
  })
}, { threshold: 0.4 })
</script>

<template>
  <span ref="el" class="tabular-nums">{{ display }}</span>
</template>
