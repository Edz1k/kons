<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import { motion } from 'motion-v'
import { Button } from '~/components/ui/button'
import { collectionPhotos, whatsappWith } from './content'
import HomeGallery from './HomeGallery.vue'
</script>

<template>
  <section class="bg-neutral-50 py-20 md:py-28">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <div class="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
        <motion.h2
          class="text-4xl font-black leading-none tracking-tight uppercase md:text-6xl"
          :initial="{ opacity: 0, y: 32 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6 }"
        >
          Мерч под ключ
        </motion.h2>
        <p class="max-w-xl text-base text-neutral-600 leading-7 md:text-lg">
          Соберём мерч в едином стиле — от текстиля и корпоративных подарков до полиграфии.
          Цвета, материалы и нанесение — ни один предмет не будет выглядеть случайным.
        </p>
      </div>

      <div class="grid mt-12 gap-1 text-2xl font-bold leading-tight tracking-tight uppercase md:mt-16 md:text-5xl sm:text-3xl">
        <motion.p
          :initial="{ opacity: 0, x: -40 }"
          :while-in-view="{ opacity: 1, x: 0 }"
          :viewport="{ once: true, amount: 0.6 }"
          :transition="{ duration: 0.6 }"
          class="text-neutral-400"
        >
          По отдельности — просто вещи.
        </motion.p>
        <motion.p
          :initial="{ opacity: 0, x: 40 }"
          :while-in-view="{ opacity: 1, x: 0 }"
          :viewport="{ once: true, amount: 0.6 }"
          :transition="{ duration: 0.6, delay: 0.15 }"
          class="text-black md:text-right"
        >
          Вместе — <span class="text-primary">коллекция бренда.</span>
        </motion.p>
      </div>

      <div class="mx-auto mt-12 max-w-5xl md:mt-16">
        <HomeGallery :photos="collectionPhotos" fade label="Коллекции мерча" />
      </div>

      <div class="mt-10 flex justify-center">
        <Button as-child size="lg" class="h-12 rounded-full px-7 text-base">
          <a :href="whatsappWith('Здравствуйте! Хочу собрать свой мерч.')" target="_blank" rel="noopener noreferrer">
            <MessageCircle class="size-5" />
            Собрать свой мерч
          </a>
        </Button>
      </div>
    </div>
  </section>
</template>
