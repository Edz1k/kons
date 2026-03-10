<script setup lang="ts">
import type { Product } from '~/types/product'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchProductBySlug, fileUrl } from '~/services/directus'

defineOptions({
  name: 'ProductDetailPage',
})

const route = useRoute()

const slug = computed(() => {
  const params = route.params

  if (!('slug' in params))
    return ''

  const value = params.slug
  return String(Array.isArray(value) ? value[0] : value ?? '')
})

const item = ref<Product | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  item.value = null

  try {
    if (!slug.value) {
      error.value = 'Некорректный slug товара'
      return
    }

    const product = await fetchProductBySlug(slug.value)

    if (!product) {
      error.value = 'Товар не найден'
      return
    }

    item.value = product
  }
  catch (e: any) {
    error.value = e?.message ?? 'Ошибка загрузки товара'
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
watch(slug, load)
</script>

<template>
  <section class="min-h-screen bg-white px-4 py-8 text-black lg:px-8 sm:px-6">
    <div class="mx-auto max-w-7xl">
      <!-- Хлебные крошки -->
      <div class="mb-8 flex items-center gap-2 text-sm text-black/50">
        <RouterLink
          to="/market"
          class="transition hover:text-black"
        >
          Каталог
        </RouterLink>
        <span>/</span>
        <span class="truncate text-black/80">
          {{ item?.title || 'Товар' }}
        </span>
      </div>

      <!-- loading -->
      <div v-if="loading" class="min-h-[60vh] flex items-center justify-center">
        <div class="text-sm text-black/40 tracking-[0.25em] uppercase">
          Загрузка товара...
        </div>
      </div>

      <!-- error -->
      <div
        v-else-if="error"
        class="min-h-[60vh] flex flex-col items-center justify-center text-center"
      >
        <p class="mb-4 text-lg text-red-500 font-medium">
          {{ error }}
        </p>

        <RouterLink
          to="/market"
          class="border border-black rounded-full px-6 py-3 text-sm font-medium transition hover:bg-black hover:text-white"
        >
          Вернуться в каталог
        </RouterLink>
      </div>

      <!-- content -->
      <div
        v-else-if="item"
        class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
      >
        <!-- Левая колонка -->
        <div>
          <div class="overflow-hidden rounded-[28px] bg-[#f5f5f5]">
            <img
              v-if="item.images?.[0]?.directus_files_id"
              :src="fileUrl(item.images[0].directus_files_id)"
              :alt="item.title"
              class="h-[420px] w-full object-cover lg:h-[720px] md:h-[560px]"
            >

            <div
              v-else
              class="h-[420px] flex items-center justify-center text-sm text-black/30 tracking-[0.2em] uppercase lg:h-[720px] md:h-[560px]"
            >
              Нет изображения
            </div>
          </div>
        </div>

        <!-- Правая колонка -->
        <div>
          <div class="border-b border-black/10 pb-6">
            <div class="mb-3 flex items-center justify-between gap-4">
              <p class="text-xs text-black/45 tracking-[0.3em] uppercase">
                Brillex
              </p>

              <div
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="item.in_stock
                  ? 'bg-black text-white'
                  : 'bg-black/8 text-black/55'"
              >
                {{ item.in_stock ? 'В наличии' : 'Нет в наличии' }}
              </div>
            </div>

            <h1 class="text-3xl font-bold leading-tight lg:text-5xl md:text-4xl">
              {{ item.title }}
            </h1>

            <div class="mt-5 text-2xl font-semibold md:text-3xl">
              {{ item.price }} ₸
            </div>

            <div
              v-if="item.category?.title"
              class="mt-4 text-sm text-black/55"
            >
              Категория: {{ item.category.title }}
            </div>
          </div>

          <!-- Характеристики -->
          <div class="grid gap-3 border-b border-black/10 py-6">
            <div class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4">
              <span class="text-sm text-black/50">Бренд</span>
              <span class="text-right text-sm font-medium">Brillex</span>
            </div>

            <div class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4">
              <span class="text-sm text-black/50">Статус</span>
              <span class="text-right text-sm font-medium">
                {{ item.in_stock ? 'Доступен к заказу' : 'Временно отсутствует' }}
              </span>
            </div>

            <div
              v-if="item.category?.title"
              class="flex items-start justify-between gap-4 rounded-2xl bg-black/[0.03] px-4 py-4"
            >
              <span class="text-sm text-black/50">Категория</span>
              <span class="text-right text-sm font-medium">
                {{ item.category.title }}
              </span>
            </div>
          </div>

          <!-- Описание -->
          <div class="pt-6">
            <h2 class="mb-4 text-lg font-semibold md:text-xl">
              Описание
            </h2>

            <div
              v-if="item.description"
              class="max-w-none prose prose-headings:font-semibold prose-p:leading-7"
              v-html="item.description"
            />
            <p v-else class="text-black/50 leading-7">
              Описание пока не добавлено.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
