<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useProductsStore } from '~/stores/product'

const isOpen = ref(false)
const isCatalogOpen = ref(false)

const productsStore = useProductsStore()
const { categories, loadingCategories } = storeToRefs(productsStore)

const links = [
  { label: 'Идея для мерча', to: '/ideas' },
  { label: 'Портфолио', to: '/portfolio' },
  { label: 'Услуги', to: { path: '/', hash: '#services' } },
  { label: 'О нас', to: '/about' },
  { label: 'Контакты', to: '/contacts' },
] as const

function toggleMenu() {
  isOpen.value = !isOpen.value

  if (!isOpen.value)
    isCatalogOpen.value = false
}

function closeMenu() {
  isOpen.value = false
  isCatalogOpen.value = false
}

function toggleCatalog() {
  isCatalogOpen.value = !isCatalogOpen.value
}

function categoryLink(slug: string) {
  return {
    path: '/market',
    query: { category: slug },
  }
}

onMounted(() => {
  productsStore.loadCategories()
})
</script>

<template>
  <nav
    class="sticky top-0 z-50 border-b border-white/10 bg-primary text-white backdrop-blur-lg"
  >
    <div class="mx-auto flex items-center justify-between px-6 py-4 container lg:py-5">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center" @click="closeMenu">
        <img
          src="/logo.svg"
          alt="Brillex logo"
          class="h-20 w-auto scale-150 object-contain brightness-0 invert"
        >
      </RouterLink>

      <!-- Desktop menu -->
      <div class="hidden items-center gap-8 md:flex">
        <RouterLink
          to="/market"
          class="group relative inline-flex items-center text-base font-semibold opacity-90 transition lg:text-lg hover:opacity-100"
        >
          Каталог
          <span
            class="absolute left-0 h-[2px] w-0 bg-secondary transition-all duration-200 -bottom-1 group-hover:w-full"
          />
        </RouterLink>

        <ul class="flex items-center gap-6 text-base font-medium lg:gap-8 lg:text-lg">
          <li v-for="link in links" :key="link.label">
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
      </div>

      <!-- Right block -->
      <div class="flex items-center gap-4 lg:gap-6">
        <div class="hidden flex-col text-right text-sm opacity-80 lg:flex">
          <span class="transition hover:opacity-100">zakaz@brillex.kz</span>
          <span class="transition hover:opacity-100">+7 (705) 259 88-88</span>
        </div>

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
        class="border-t border-white/10 bg-primary/90 backdrop-blur-lg md:hidden"
      >
        <div class="max-h-[calc(100dvh-88px)] overflow-y-auto px-6 py-4">
          <ul class="flex flex-col gap-4 text-base font-medium">
            <!-- Mobile catalog -->
            <li class="border-b border-white/10 pb-3">
              <div class="flex items-center justify-between gap-3">
                <RouterLink
                  to="/market"
                  class="group relative w-fit inline-flex items-center opacity-90 transition hover:opacity-100"
                  @click="closeMenu"
                >
                  Каталог
                  <span
                    class="absolute left-0 h-[2px] w-0 bg-secondary transition-all duration-200 -bottom-1 group-hover:w-full"
                  />
                </RouterLink>

                <button
                  type="button"
                  class="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                  aria-label="Открыть категории"
                  @click="toggleCatalog"
                >
                  <span
                    class="i-mdi:chevron-down text-xl transition-transform duration-300"
                    :class="{ 'rotate-180': isCatalogOpen }"
                  />
                </button>
              </div>

              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-[1000px]"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 max-h-[1000px]"
                leave-to-class="opacity-0 max-h-0"
              >
                <div v-if="isCatalogOpen" class="overflow-hidden">
                  <ul class="mt-4 flex flex-col gap-3 pl-3">
                    <li>
                      <RouterLink
                        to="/market"
                        class="text-white/80 transition hover:text-secondary"
                        @click="closeMenu"
                      >
                        Все товары
                      </RouterLink>
                    </li>

                    <li v-if="loadingCategories" class="text-white/50">
                      Загрузка...
                    </li>

                    <template v-else>
                      <li v-for="category in categories" :key="category.id">
                        <RouterLink
                          :to="categoryLink(category.slug)"
                          class="text-white/80 transition hover:text-secondary"
                          @click="closeMenu"
                        >
                          {{ category.title }}
                        </RouterLink>
                      </li>
                    </template>
                  </ul>
                </div>
              </transition>
            </li>

            <!-- Main links -->
            <li v-for="link in links" :key="link.label" @click="closeMenu">
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
          <div class="mt-6 border-t border-white/10 pt-4 text-base opacity-80">
            <div class="transition hover:opacity-100">
              +7 (705) 259 88-88
            </div>
            <div class="transition hover:opacity-100">
              zakaz@brillex.kz
            </div>
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>
