<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { ref } from 'vue'

const el = ref(null)
const visible = ref(false)

useIntersectionObserver(
  el,
  ([{ isIntersecting }]) => {
    if (isIntersecting)
      visible.value = true
  },
  { threshold: 0.2 },
)
</script>

<template>
  <div
    ref="el"
    class="transition-all duration-700 ease-out" :class="[
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
    ]"
  >
    <slot />
  </div>
</template>
