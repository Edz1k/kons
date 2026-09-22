<script setup lang="ts">
import { WHATSAPP_LINK, WHATSAPP_PHONE } from '~/constants/contacts'
</script>

<template>
  <a
    :href="WHATSAPP_LINK"
    target="_blank"
    rel="noopener noreferrer"
    class="fixed bottom-5 right-5 z-50 h-14 w-14 inline-flex flex-none items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition duration-300 md:bottom-7 md:right-7 md:h-15 md:w-15 hover:scale-105 hover:shadow-2xl"
    :aria-label="`Написать в WhatsApp ${WHATSAPP_PHONE}`"
    title="Написать в WhatsApp"
  >
    <span class="i-mdi:whatsapp text-3xl md:text-4xl" aria-hidden="true" />
  </a>
</template>
