<script setup lang="ts">
const phone = '+7 (705) 259-88-88'
const cleanPhone = phone.replace(/\D/g, '')

const whatsappLink = `https://wa.me/${cleanPhone}`
const instagram = 'https://instagram.com/brillex.kz'
</script>

<template>
  <section class="w-full py-16 md:py-20 xl:py-24">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <!-- Заголовок -->
      <div class="mb-12 md:mb-16">
        <p class="text-sm text-secondary font-800 tracking-[0.25em] uppercase">
          Контакты
        </p>

        <h1 class="mt-4 text-4xl font-900 leading-[0.95] md:text-6xl">
          Свяжитесь с нами
        </h1>

        <p class="mt-5 max-w-2xl text-base text-slate-600 leading-7 md:text-lg">
          Мы всегда на связи — напишите нам в WhatsApp, Instagram или приезжайте к нам.
        </p>
      </div>

      <!-- Контент -->
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <!-- Левая часть -->
        <div class="flex flex-col gap-5">
          <!-- WhatsApp -->
          <a
            :href="whatsappLink"
            target="_blank"
            class="group flex items-center gap-4 rounded-3xl bg-[#25D366] px-6 py-5 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div class="i-mdi:whatsapp text-3xl" />
            <div>
              <p class="text-sm opacity-80">Написать</p>
              <p class="text-lg font-semibold">WhatsApp</p>
            </div>
          </a>

          <!-- Instagram -->
          <a
            :href="instagram"
            target="_blank"
            class="group flex items-center gap-4 rounded-3xl from-pink-500 via-red-500 to-yellow-500 bg-gradient-to-r px-6 py-5 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div class="i-mdi:instagram text-3xl" />
            <div>
              <p class="text-sm opacity-80">Наш профиль</p>
              <p class="text-lg font-semibold">Instagram</p>
            </div>
          </a>

          <!-- Телефон -->
          <div class="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200">
            <p class="text-sm text-slate-500">
              Телефон
            </p>
            <a
              :href="`tel:${cleanPhone}`"
              class="mt-1 block text-lg text-black font-semibold"
            >
              {{ phone }}
            </a>
          </div>

          <!-- Адрес -->
          <div class="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200">
            <p class="text-sm text-slate-500">
              Адрес
            </p>
            <p class="mt-1 text-lg text-black font-semibold">
              Казахстан, Алматы, ул. Радостовца 158
            </p>
          </div>
        </div>

        <!-- Правая часть (карта) -->
        <div class="relative overflow-hidden rounded-[32px] shadow-lg ring-1 ring-slate-200">
          <!-- iframe -->
          <iframe
            class="h-full w-full rounded-lg shadow-md"
            src="https://yandex.kz/map-widget/v1/-/CPV3IZMt--e"
            frameborder="0"
            allowfullscreen
          />
        </div>
      </div>
    </div>
  </section>
</template>
