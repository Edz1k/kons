import type { Color, Overview, Variant } from '~/types/warehouse'
import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'

/** Поля варианта для склада. Цена товара — цена сайта, её видят и кладовщики (она и так публичная). */
export const VARIANT_FIELDS = 'id,barcode,sku,stock,min_quantity,product.id,product.title,product.status,product.price,color.id,color.name'

/**
 * Склад = варианты товаров сайта (product_variants). Источник правды — Directus;
 * здесь только то, что уже пришло с сервера, на время сессии.
 */
export const useWarehouseStore = defineStore('warehouse', () => {
  const session = useSessionStore()

  const variants = ref<Variant[]>([])
  const loaded = ref(false)
  const overview = ref<Overview | null>(null)
  const openRequests = ref(0)
  const colors = ref<Color[]>([])

  async function load(force = false) {
    if (loaded.value && !force)
      return variants.value
    variants.value = await api<Variant[]>('/items/product_variants', {
      query: { fields: VARIANT_FIELDS, sort: 'barcode', limit: -1 },
    })
    loaded.value = true
    return variants.value
  }

  const byBarcode = (barcode: string) => variants.value.find(v => v.barcode.toLowerCase() === barcode.trim().toLowerCase())

  function patch(barcode: string, changes: Partial<Variant>) {
    const v = byBarcode(barcode)
    if (v)
      Object.assign(v, changes)
    return v
  }

  async function loadColors() {
    if (!colors.value.length)
      colors.value = await api<Color[]>('/items/colors', { query: { fields: 'id,name,hex', sort: 'name', limit: -1 } })
    return colors.value
  }

  async function loadOverview() {
    if (!session.isAdmin)
      return
    try {
      overview.value = await api<Overview>('/warehouse/overview')
    }
    catch {}
  }

  async function pollRequests() {
    if (!session.me)
      return
    try {
      const rows = await api<{ id: number }[]>('/items/wh_requests', {
        query: { fields: 'id', filter: JSON.stringify({ status: { _eq: 'new' } }), limit: -1 },
      })
      if (rows.length > openRequests.value && openRequests.value !== 0)
        toast.info('Новая заявка на выдачу')
      openRequests.value = rows.length
    }
    catch {}
  }

  /** После операции: обновить сводку (у админа). */
  function afterChange() {
    if (session.isAdmin)
      loadOverview()
  }

  function $reset() {
    variants.value = []
    loaded.value = false
    overview.value = null
    openRequests.value = 0
  }

  return { variants, loaded, overview, openRequests, colors, load, byBarcode, patch, loadColors, loadOverview, pollRequests, afterChange, $reset }
})
