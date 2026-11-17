<script setup lang="ts">
import LandingPage from '~/components/landing/LandingPage.vue'
import { LANDINGS } from '~/data/landings'
</script>

<template>
  <LandingPage :landing="LANDINGS.merch" />
</template>

<route lang="yaml">
meta:
  layout: default
  hideContactForm: true
</route>
