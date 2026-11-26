/**
 * Действия над сделкой. Каждое изменение сразу уходит в Directus; правила (стадии, цех, отказ, история)
 * проверяет сервер (directus-extension-crm-rules). После любого ответа — свежая сделка с сервера,
 * чтобы увидеть то, что сервер дописал сам (очередь цеха, история, переход в «Отгрузку»).
 */
import type { Deal, DealItem } from '~/types/crm'
import { toast } from 'vue-sonner'
import { accessToken, api, API_BASE } from '~/api/directus'

export function useDealActions() {
  const crm = useCrmStore()

  async function run<T>(dealId: number, request: () => Promise<T>, success?: string) {
    try {
      const result = await request()
      if (success)
        toast.success(success)
      return result
    }
    catch (error) {
      toast.error((error as Error).message)
      return null
    }
    finally {
      await crm.refreshDeal(dealId)
    }
  }

  const patchDeal = (id: number, data: Partial<Deal>, success?: string) =>
    run(id, () => api(`/items/crm_deals/${id}`, { method: 'PATCH', body: data }), success)

  async function createDeal(data: Partial<Deal>) {
    try {
      const deal = await api<{ id: number }>('/items/crm_deals', { method: 'POST', body: data, query: { fields: 'id' } })
      await crm.refreshDeal(deal.id)
      return deal.id
    }
    catch (error) {
      toast.error((error as Error).message)
      return null
    }
  }

  const addItem = (deal: Deal) => run(deal.id, () => api('/items/crm_deal_items', {
    method: 'POST',
    body: { deal: deal.id, sort: (deal.items?.length ?? 0) + 1, name: '', quantity: 1, price: 0, technique_price: 0 },
  }))

  const patchItem = (dealId: number, id: number, data: Partial<DealItem>) =>
    run(dealId, () => api(`/items/crm_deal_items/${id}`, { method: 'PATCH', body: data }))

  const deleteItem = (dealId: number, id: number) =>
    run(dealId, () => api(`/items/crm_deal_items/${id}`, { method: 'DELETE' }))

  const addPayment = (dealId: number, data: { amount: number, paid_on: string, note: string }) =>
    run(dealId, () => api('/items/crm_payments', { method: 'POST', body: { deal: dealId, ...data } }), 'Оплата внесена')

  const deletePayment = (dealId: number, id: number) =>
    run(dealId, () => api(`/items/crm_payments/${id}`, { method: 'DELETE' }), 'Платёж удалён')

  const addComment = (dealId: number, text: string) =>
    run(dealId, () => api('/items/crm_deal_log', { method: 'POST', body: { deal: dealId, text } }))

  /** Фото готового заказа в файлы Directus. */
  async function uploadPhoto(file: File) {
    const form = new FormData()
    form.append('title', file.name)
    form.append('file', file)
    const token = await accessToken()
    const response = await fetch(`${API_BASE}/files`, { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!response.ok)
      throw new Error('Не удалось загрузить фото')
    return (await response.json()).data.id as string
  }

  return { patchDeal, createDeal, addItem, patchItem, deleteItem, addPayment, deletePayment, addComment, uploadPhoto }
}
