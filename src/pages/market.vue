<script setup lang="ts">
import type { Product } from '~/services/directus'
import { onMounted, ref } from 'vue'
import { fetchProducts, fileUrl } from '~/services/directus'

const items = ref<Product[]>([])
const error = ref('')
const loading = ref(true)

function formatPrice(v?: string | number) {
  if (v === undefined || v === null || v === '')
    return ''
  const n = typeof v === 'string' ? Number(v) : v
  if (Number.isNaN(n))
    return String(v)
  return new Intl.NumberFormat('ru-RU').format(n)
}

onMounted(async () => {
  loading.value = true
  try {
    items.value = await fetchProducts()
  }
  catch (e: any) {
    error.value = e?.message ?? String(e)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          Каталог
        </h1>
        <p class="mt-1 text-sm opacity-70">
          Выберите товар — откроется страница с деталями.
        </p>
      </div>

      <div class="text-sm opacity-60">
        <span v-if="!loading && !error">{{ items.length }} шт.</span>
      </div>
    </div>

    <p v-if="error" class="border border-red-500/30 rounded-xl bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </p>

    <div v-else-if="loading" class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2">
      <div
        v-for="i in 6"
        :key="i"
        class="animate-pulse overflow-hidden border border-white/10 rounded-2xl bg-white/5"
      >
        <div class="h-56 w-full bg-white/10" />
        <div class="p-4 space-y-2">
          <div class="h-4 w-2/3 rounded bg-white/10" />
          <div class="h-3 w-1/3 rounded bg-white/10" />
          <div class="h-4 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2">
      <RouterLink
        v-for="p in items"
        :key="p.id"
        :to="`/product/${p.slug}`"
        class="group relative overflow-hidden border border-white/10 rounded-2xl bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1"
      >
        <!-- Верхний градиент + бейдж -->
        <div class="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
          <div class="absolute inset-0 from-black/30 via-transparent to-transparent bg-gradient-to-t" />
        </div>

        <div class="absolute left-3 top-3 z-10">
          <span
            class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md"
            :class="p.in_stock
              ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
              : 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30'"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="p.in_stock ? 'bg-emerald-300' : 'bg-rose-300'"
            />
            {{ p.in_stock ? 'В наличии' : 'Нет в наличии' }}
          </span>
        </div>

        <!-- Картинка -->
        <div class="relative h-56 w-full overflow-hidden">
          <img
            v-if="p.images?.[0]?.directus_files_id"
            :src="fileUrl(p.images[0].directus_files_id)"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt=""
            loading="lazy"
          >
          <div v-else class="h-full w-full flex items-center justify-center bg-white/5">
            <div class="text-center">
              <div class="text-sm font-semibold opacity-80">
                Нет фото
              </div>
              <div class="mt-1 text-xs opacity-50">
                {{ p.slug }}
              </div>
            </div>
          </div>
        </div>

        <!-- Контент -->
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <h3 class="line-clamp-2 text-lg font-semibold leading-snug">
              {{ p.title }}
            </h3>

            <span class="mt-1 shrink-0 text-xs opacity-50 transition group-hover:opacity-80">
              →
            </span>
          </div>

          <div class="mt-2 flex items-center justify-between">
            <div class="text-sm opacity-70">
              Артикул: <span class="opacity-90">{{ p.slug }}</span>
            </div>

            <div v-if="p.price !== undefined" class="text-base font-bold tracking-tight">
              {{ formatPrice(p.price) }} ₸
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <div class="text-xs opacity-60">
              Нажмите, чтобы открыть
            </div>

            <div
              class="inline-flex items-center gap-2 border border-white/10 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold opacity-80 transition group-hover:border-white/20 group-hover:bg-white/10 group-hover:opacity-100"
            >
              Подробнее
              <span class="transition group-hover:translate-x-0.5">→</span>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
