<script setup lang="ts">
import CarouselComponent from '~/components/CarouselComponent.vue'

defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <main>
    <HeroSection />
    <section class="pt-12 -mt-12 lg:-mt-24 md:-mt-16">
      <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
        <CarouselComponent />
      </div>
    </section>
    <BrandStatementSection />
    <StickyFeatureSection />
    <CapabilitiesSection />
  </main>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
