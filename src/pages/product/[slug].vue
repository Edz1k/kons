<script setup lang="ts">
import type { Product } from '~/types/product'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchProductBySlug, fileUrl } from '~/services/directus'

const route = useRoute()
const slug = computed(() => {
  const params = route.params
  if (!('slug' in params))
    return ''

  const value = params.slug
  return String(Array.isArray(value) ? value[0] : value ?? '')
})

const item = ref<Product | null>(null)
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  item.value = null

  try {
    const res = await fetchProductBySlug(slug.value)
    if (!res)
      error.value = 'Товар не найден'
    else
      item.value = res
  }
  catch (e: any) {
    error.value = e?.message ?? String(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
watch(slug, load) // если меняешь /product/:slug без перезагрузки
</script>

<template>
  <div class="p-6">
    <p v-if="error" class="text-red-500">
      {{ error }}
    </p>
    <div v-else-if="loading">
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
