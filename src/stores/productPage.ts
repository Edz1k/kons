import type { Product } from '~/types/product'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Товары, загруженные при сборке страницы (SSG).
 * Состояние pinia сериализуется в HTML, поэтому в браузере страница товара
 * сразу показывает данные, а не крутилку, — и разметка совпадает с готовым HTML.
 * null — товар искали, но не нашли.
 */
export const useProductPageStore = defineStore('productPage', () => {
  const bySlug = ref<Record<string, Product | null>>({})

  function set(slug: string, product: Product | null) {
    bySlug.value[slug] = product
  }

  return { bySlug, set }
})
