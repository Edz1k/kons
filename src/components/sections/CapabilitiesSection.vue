<script setup lang="ts">
import { computed, ref } from 'vue'

interface FeatureItem {
  id: number
  title: string
  text: string
  image: string
  imageAlt: string
}

const items: FeatureItem[] = [
  {
    id: 1,
    title: 'Полный цикл производства',
    text: 'От идеи и разработки дизайна до упаковки и доставки готовой продукции. Все этапы выполняются внутри компании, что позволяет контролировать качество и сроки.',
    image: '/pictures/disclo/1.webp',
    imageAlt: 'Полный цикл производства мерча',
  },
  {
    id: 2,
    title: 'Более 10 технологий брендирования',
    text: 'Шелкография, лазерная гравировка, УФ-печать, DTF, UV DTF, вышивка, тиснение, сублимация, термотрансфер, гравировка по металлу, дереву и стеклу. Подбираем технологию под материал, тираж и задачи проекта.',
    image: '/pictures/disclo/2.webp',
    imageAlt: 'Технологии брендирования',
  },
  {
    id: 3,
    title: 'Производство без посредников',
    text: 'Собственный цех позволяет оперативно запускать заказы в работу, контролировать качество на каждом этапе и предлагать выгодные цены без лишних наценок.',
    image: '/pictures/disclo/3.webp',
    imageAlt: 'Производство без посредников',
  },
  {
    id: 4,
    title: 'Корпоративный мерч под ключ',
    text: 'Разрабатываем сувенирную продукцию, одежду, подарочные наборы и промо-материалы для компаний любого масштаба. Помогаем подобрать продукцию, создать дизайн и реализовать проект от первой идеи до готового результата.',
    image: '/pictures/disclo/4.webp',
    imageAlt: 'Корпоративный мерч под ключ',
  },
]

const activeId = ref<number>(items[0]?.id ?? 1)

const activeItem = computed(() => {
  return items.find(item => item.id === activeId.value) ?? items[0]
})

function toggleItem(id: number) {
  activeId.value = id
}
</script>

<template>
  <section id="services" class="py-10 md:py-16">
    <div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
      <!-- Заголовок -->
      <div class="grid mb-8 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <h2 class="m-0 text-4xl font-black leading-none tracking-tight uppercase md:text-6xl">
            Возможности
          </h2>
        </div>

        <div class="max-w-2xl lg:pt-2">
          <p class="m-0 text-base text-neutral-700 leading-7 md:text-lg">
            Более 10 лет создаём продукцию, которая работает на бренд наших клиентов.
            Собственное производство позволяет гарантировать качество, соблюдать сроки
            и подбирать оптимальную технологию нанесения для каждого проекта.
          </p>
        </div>
      </div>

      <!-- Основной блок -->
      <div class="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-stretch">
        <!-- Левая колонка -->
        <div class="space-y-3">
          <article
            v-for="item in items"
            :key="item.id"
            class="overflow-hidden rounded-3xl transition-all duration-200"
            :class="[
              activeId === item.id
                ? 'bg-[#ededed]'
                : 'bg-[#f5f5f5] hover:bg-[#f1f1f1]',
            ]"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between gap-4 px-5 py-5 text-left md:px-7 md:py-6"
              :aria-expanded="activeId === item.id"
              :aria-controls="`feature-panel-${item.id}`"
              @click="toggleItem(item.id)"
            >
              <span class="text-xl font-semibold leading-tight lg:text-3xl md:text-2xl">
                {{ item.title }}
              </span>

              <span
                class="h-12 w-12 flex shrink-0 items-center justify-center text-3xl text-black leading-none"
                aria-hidden="true"
              >
                {{ activeId === item.id ? '×' : '+' }}
              </span>
            </button>

            <transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[460px] opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="max-h-[460px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div
                v-show="activeId === item.id"
                :id="`feature-panel-${item.id}`"
                role="region"
                class="overflow-hidden px-5 pb-5 md:px-7 md:pb-7"
              >
                <p class="m-0 max-w-2xl text-base text-neutral-700 leading-7 md:text-lg">
                  {{ item.text }}
                </p>
              </div>
            </transition>
          </article>
        </div>

        <!-- Правая колонка -->
        <div class="h-full">
          <div class="h-full overflow-hidden rounded-3xl bg-[#f5f5f5]">
            <transition name="fade" mode="out-in">
              <img
                :key="activeItem.image"
                :src="activeItem.image"
                :alt="activeItem.imageAlt"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover object-center"
              >
            </transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
