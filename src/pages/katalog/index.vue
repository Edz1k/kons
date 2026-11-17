<script setup lang="ts">
import { usePageSeo } from '~/composables/usePageSeo'
import { CATALOG_SECTIONS } from '~/data/catalogSections'

usePageSeo({
  title: 'Сувенирная продукция с логотипом: каталог по категориям',
  description: 'Ручки, термосы, термокружки, ежедневники, шопперы, одежда, ланьярды и подарочные наборы с логотипом. Склад и производство нанесения в Алматы.',
})
</script>

<template>
  <section class="bg-white px-4 py-6 lg:px-8 md:px-6">
    <div class="mx-auto max-w-7xl">
      <h1 class="text-3xl text-navy font-black tracking-tight md:text-5xl">
        Каталог по категориям
      </h1>
      <p class="mt-3 max-w-2xl text-base text-slate-500 leading-7">
        Всё, на что наносим логотип: в наличии на складе в Алматы и под заказ.
      </p>

      <ul class="grid mt-8 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="section in CATALOG_SECTIONS" :key="section.slug">
          <RouterLink
            :to="`/katalog/${section.slug}`"
            class="group h-full flex flex-col rounded-3xl bg-neutral-100 p-6 transition hover:-translate-y-1 hover:bg-neutral-200/70"
          >
            <span class="text-xl font-bold">{{ section.h1 }}</span>
            <span class="mt-2 text-sm text-neutral-600 leading-6">{{ section.lead }}</span>
            <span class="mt-4 inline-flex items-center gap-2 text-sm text-primary font-semibold">
              Смотреть
              <span class="icon-[mdi--arrow-right] size-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
