<script setup>
import { ref } from 'vue'
import CartButton from './CartButton.vue'

const isOpen = ref(false)
const cartCount = ref(3)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

const links = [
  { label: 'Идея для мерча', to: '/ideas' },
  { label: 'Портфолио', to: '/portfolio' },
  { label: 'Услуги', to: '/#services' },
  { label: 'О нас', to: '/about' },
  { label: 'Контакты', to: '/contacts' },
]
</script>

<template>
  <nav class="bg-primary text-white">
    <div class="mx-auto flex items-center justify-between px-6 py-4 container lg:py-5">
      <!-- Logo -->
      <h1 class="text-2xl font-bold tracking-wide lg:text-3xl">
        brillex
      </h1>

      <!-- Catalog (with arrow rotate + underline on hover) -->
      <RouterLink
        to="/market"
        class="group hidden items-center gap-1 text-base font-semibold opacity-90 transition md:flex lg:text-lg hover:opacity-100"
      >
        <span class="relative">
          Каталог
          <!-- underline -->
          <span
            class="absolute left-0 h-[2px] w-0 bg-secondary transition-all duration-200 -bottom-1 group-hover:w-full"
          />
        </span>

        <span
          class="i-mdi:chevron-down text-lg transition-transform duration-200 group-hover:rotate-180"
        />
      </RouterLink>

      <!-- Desktop menu -->
      <ul class="hidden items-center gap-6 text-base font-medium md:flex lg:gap-8 lg:text-lg">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="group relative inline-flex items-center opacity-90 transition hover:opacity-100"
          >
            {{ link.label }}
            <!-- underline -->
            <span
              class="absolute left-0 h-[2px] w-0 bg-secondary transition-all duration-200 -bottom-1 group-hover:w-full"
            />
          </RouterLink>
        </li>
      </ul>

      <!-- Right block -->
      <div class="flex items-center gap-4 lg:gap-6">
        <!-- Contacts (desktop only) -->
        <div class="hidden flex-col text-right text-sm opacity-80 lg:flex">
          <span class="cursor-default transition hover:opacity-100">+7 (999) 999-99-99</span>
          <span class="cursor-default transition hover:opacity-100">zakaz@brillex.kz</span>
        </div>

        <!-- Icons -->
        <div class="flex items-center gap-2 lg:gap-3">
          <!-- Search -->
          <button
            class="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 transition lg:h-11 lg:w-11 xl:h-12 xl:w-12 active:scale-[0.98] hover:scale-[1.03] hover:bg-white/20"
            aria-label="Поиск"
          >
            <span class="i-mdi:magnify text-xl lg:text-2xl" />
          </button>

          <!-- Cart -->
          <div
            class="transition active:scale-[0.98] hover:scale-[1.03]"
            aria-label="Корзина"
          >
            <CartButton :count="cartCount" />
          </div>

          <!-- Burger (mobile only) -->
          <button
            class="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 transition md:hidden lg:h-11 lg:w-11 active:scale-[0.98] hover:scale-[1.03] hover:bg-white/20"
            aria-label="Меню"
            @click="toggleMenu"
          >
            <span v-if="!isOpen" class="i-ph-list text-2xl" />
            <span v-else class="i-ph-x text-2xl" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="border-t border-white/10 bg-primary/95 px-6 py-4 backdrop-blur md:hidden"
      >
        <ul class="flex flex-col gap-4 text-base font-medium">
          <li v-for="link in links" :key="link.to" @click="closeMenu">
            <RouterLink
              :to="link.to"
              class="group relative w-fit inline-flex items-center opacity-90 transition hover:opacity-100"
            >
              {{ link.label }}
              <span
                class="absolute left-0 h-[2px] w-0 bg-secondary transition-all duration-200 -bottom-1 group-hover:w-full"
              />
            </RouterLink>
          </li>
        </ul>

        <!-- Contacts mobile -->
        <div class="mt-6 text-base opacity-80">
          <div class="transition hover:opacity-100">
            +7 (999) 999-99-99
          </div>
          <div class="transition hover:opacity-100">
            zakaz@brillex.kz
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>
