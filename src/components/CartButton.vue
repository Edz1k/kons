<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
})

const displayCount = computed(() => {
  if (props.count <= 0)
    return null
  if (props.count > 99)
    return '99+'
  return String(props.count)
})
</script>

<template>
  <button
    class="relative h-10 w-10 flex items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
    aria-label="Корзина"
  >
    <span class="i-mdi:shopping-cart text-lg" />

    <span
      v-if="displayCount"
      class="absolute h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none -right-1 -top-1"
    >
      {{ displayCount }}
    </span>
  </button>
</template>
