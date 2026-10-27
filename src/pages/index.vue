<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <!-- первый экран: чёрная сцена с анимацией при заходе -->
  <HeroCinematic />

  <TickerSection />
  <StockSection />

  <section class="pt-12">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <CarouselComponent />
    </div>
  </section>

  <BrandStatementSection />
  <StickyFeatureSection />
  <StepsSection />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
