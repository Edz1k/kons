<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})

usePageSeo({
  title: 'Мерч и корпоративные подарки с логотипом в Алматы',
  description: 'Brillex. Мерч для брендов в Алматы: ручки, термокружки, ежедневники, шоперы и бейджи с нанесением логотипа. Товары в наличии, под заказ, доставка по Казахстану.',
})
</script>

<template>
  <!-- первый экран: чёрная сцена с анимацией при заходе -->
  <HeroCinematic />

  <TickerSection />
  <StockSection />

  <BrandStatementSection />
  <StickyFeatureSection />
  <PriceCalculatorSection />
  <StepsSection />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
