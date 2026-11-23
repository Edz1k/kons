<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <main>
    <div class="min-h-screen flex flex-col">
      <NavbarComponent />

      <main class="flex-1">
        <router-view />
      </main>
      <ContactForm v-if="!route.meta.hideContactForm" />
      <FooterComponent />
    </div>
  </main>
</template>
