<script setup lang="ts">
import HomeBrief from '~/components/home/HomeBrief.vue'
import HomeCases from '~/components/home/HomeCases.vue'
import HomeCollection from '~/components/home/HomeCollection.vue'
import HomeHero from '~/components/home/HomeHero.vue'
import HomeImport from '~/components/home/HomeImport.vue'
import HomeProcess from '~/components/home/HomeProcess.vue'
import HomeProduction from '~/components/home/HomeProduction.vue'
import HomeStock from '~/components/home/HomeStock.vue'
import HomeTicker from '~/components/home/HomeTicker.vue'

defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <HomeHero />
  <HomeTicker />
  <HomeStock />
  <HomeCollection />
  <HomeImport />
  <HomeProduction />
  <HomeProcess />
  <HomeCases />
  <HomeBrief />
</template>

<route lang="yaml">
meta:
  layout: default
  # на главной своя форма заявки (блок 9), общая из шаблона не нужна
  hideContactForm: true
</route>
