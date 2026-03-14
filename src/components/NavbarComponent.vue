<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

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
] as const
</script>

<template>
  <nav
    class="sticky top-0 z-50 border-b border-white/10 bg-primary text-white backdrop-blur-lg"
  >
    <div class="mx-auto flex items-center justify-between px-6 py-4 container lg:py-5">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center">
        <img
          src="/logo.svg"
          alt="Brillex logo"
          class="h-20 w-auto scale-150 object-contain brightness-0 invert"
        >
      </RouterLink>

      <!-- Catalog (desktop) -->
      <RouterLink
        to="/market"
        class="group hidden items-center gap-1 text-base font-semibold opacity-90 transition md:flex lg:text-lg hover:opacity-100"
      >
        <div class="relative hidden md:block">
          <div class="group">
            <RouterLink
              to="/market"
              class="flex items-center gap-1 text-base font-semibold opacity-90 transition lg:text-lg hover:opacity-100"
            >
              <span class="relative">
                Каталог

                <span
                  class="i-mdi:chevron-down text-lg transition-transform duration-300 group-hover:rotate-180"
                />
              </span>
            </RouterLink>

            <!-- DROPDOWN -->
            <div
              class="invisible absolute left-0 top-full translate-y-2 pt-4 opacity-0 transition-all duration-300 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
            >
              <div
                class="w-72 border border-white/10 rounded-2xl bg-primary/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
              >
                <ul class="flex flex-col gap-3 text-base">
                  <li>
                    <RouterLink :to="{ path: '/market' }" class="transition hover:text-secondary">
                      Все товары
                    </RouterLink>
                  </li>
                  <li>
                    <RouterLink :to="{ path: '/market', query: { category: 'tshirt' } }" class="transition hover:text-secondary">
                      Футболки
                    </RouterLink>
                  </li>
                  <li>
                    <RouterLink :to="{ path: '/market', query: { category: 'hoodie' } }" class="transition hover:text-secondary">
                      Худи
                    </RouterLink>
                  </li>
                  <li>
                    <RouterLink :to="{ path: '/market', query: { category: 'caps' } }" class="transition hover:text-secondary">
                      Кепки
                    </RouterLink>
                  </li>
                  <li>
                    <RouterLink :to="{ path: '/market', query: { category: 'custom' } }" class="transition hover:text-secondary">
                      Кастом
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

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
          <span class="transition hover:opacity-100">zakaz@brillex.kz</span>
          <span class="transition hover:opacity-100">+7 (705) 259 88-88</span>
        </div>

        <!-- Burger (mobile only) -->
        <button
          class="h-10 w-10 inline-flex items-center justify-center rounded-full bg-white/10 transition md:hidden lg:h-11 lg:w-11 active:scale-[0.98] hover:scale-[1.03] hover:bg-white/20"
          aria-label="Меню"
          @click="toggleMenu"
        >
          <span v-if="!isOpen" class="i-mdi:menu text-2xl" />
          <span v-else class="i-mdi:close text-2xl" />
        </button>
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
        class="border-t border-white/10 bg-primary/85 px-6 py-4 backdrop-blur-lg md:hidden"
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
            +7 (705) 259 88-88
          </div>
          <div class="transition hover:opacity-100">
            zakaz@brillex.kz
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>
