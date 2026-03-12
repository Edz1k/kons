<script setup lang="ts">
const modalRef = ref()
</script>

<template>
  <button
    class="rounded-xl bg-black px-6 py-3 text-white"
    @click="modalRef?.openModal()"
  >
    Оставить заявку
  </button>

  <LeadsComponent ref="modalRef" />
</template>
