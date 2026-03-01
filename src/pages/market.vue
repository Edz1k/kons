<script setup lang="ts">
import type { Product } from '~/services/directus'
import { onMounted, ref } from 'vue'
import { fetchProducts, fileUrl } from '~/services/directus'

const items = ref<Product[]>([])
const error = ref('')

onMounted(async () => {
  try {
    items.value = await fetchProducts()
  }
  catch (e: any) {
    error.value = e?.message ?? String(e)
  }
})
</script>

<template>
  <div class="p-6 text-xl text-red-500 font-bold">
    MARKET PAGE LOADED
  </div>
  <div class="p-6">
    <h1 class="mb-4 text-2xl font-bold">
      Каталог
    </h1>

    <p v-if="error" class="text-red-500">
      {{ error }}
    </p>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2">
      <RouterLink
        v-for="p in items"
        :key="p.id"
        :to="`/product/${p.slug}`"
        class="border rounded-xl p-4 hover:opacity-80"
      >
        <img
          v-if="p.images?.[0]?.directus_files_id"
          :src="fileUrl(p.images[0].directus_files_id)"
          class="mb-3 h-48 w-full rounded-lg object-cover"
          alt=""
        >
        <div class="font-semibold">
          {{ p.title }}
        </div>
        <div class="text-sm opacity-70">
          {{ p.in_stock ? 'В наличии' : 'Нет в наличии' }}
        </div>
      </RouterLink>
    </div>
  </div>
</template>
