<script setup lang="ts">
import type { Product } from '~/services/directus'
import { onMounted, ref } from 'vue'
import { fetchProductBySlug, fileUrl } from '~/services/directus'

const props = defineProps<{ slug: string }>()
const item = ref<Product | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    item.value = await fetchProductBySlug(props.slug)
  }
  catch (e: any) {
    error.value = e?.message ?? String(e)
  }
})
</script>

<template>
  <div class="p-6">
    <p v-if="error" class="text-red-500">
      {{ error }}
    </p>
    <div v-if="!item && !error">
      Загрузка…
    </div>

    <div v-else-if="item">
      <h1 class="mb-2 text-2xl font-bold">
        {{ item.title }}
      </h1>
      <div class="mb-4 opacity-70">
        {{ item.in_stock ? 'В наличии' : 'Нет в наличии' }}
      </div>

      <div class="grid grid-cols-2 mb-6 gap-3 md:grid-cols-3">
        <img
          v-for="img in (item.images ?? [])"
          :key="img.directus_files_id"
          :src="fileUrl(img.directus_files_id)"
          class="h-40 w-full rounded-lg object-cover"
          alt=""
        >
      </div>

      <div class="max-w-none prose" v-html="item.description" />
    </div>
  </div>
</template>
