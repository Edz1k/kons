<script setup lang="ts">
interface Props {
  imageHeightClass?: string
}

withDefaults(defineProps<Props>(), {
  imageHeightClass: 'h-72',
})
</script>

<template>
  <div
    class="overflow-hidden border border-black/10 rounded-2xl bg-white shadow-sm"
    aria-hidden="true"
  >
    <!-- image -->
    <div
      class="skeleton relative w-full"
      :class="imageHeightClass"
    >
      <!-- badge -->
      <div class="skeleton absolute left-4 top-4 h-6 w-20 rounded-full" />
    </div>

    <!-- content -->
    <div class="p-4 space-y-3">
      <!-- title -->
      <div class="skeleton h-5 w-2/3 rounded-lg" />

      <!-- article -->
      <div class="skeleton h-4 w-1/2 rounded-lg" />

      <!-- bottom -->
      <div class="flex items-center justify-between pt-2">
        <div class="skeleton h-5 w-20 rounded-lg" />
        <div class="skeleton h-5 w-5 rounded-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background: #f1f5f9;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%);
  animation: shimmer 1.3s linear infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
