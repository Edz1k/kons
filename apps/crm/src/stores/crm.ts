import type { Client, Deal, Lead, Notification, Staff } from '~/types/crm'
import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { balance, personName } from '~/utils/crm'

const CLIENT_FIELDS = 'id,user,company_name,contact_name,phone,instagram,email,manager,discount_percent,price_group,crm_note,date_created'
const STAFF_FIELDS = 'id,first_name,last_name,role,status'

/**
 * Данные CRM на сессию. Источник правды — Directus: права там же решают, кто что видит
 * (менеджер — свои сделки, цех — заказы в работе без денег). Обновления приходят по WebSocket (useRealtime).
 */
export const useCrmStore = defineStore('crm', () => {
  const session = useSessionStore()

  const deals = ref<Deal[]>([])
  const clients = ref<Client[]>([])
  const leads = ref<Lead[]>([])
  const notifications = ref<Notification[]>([])
  const staff = ref<Staff[]>([])
  const loaded = ref(false)

  const dealById = computed(() => new Map(deals.value.map(d => [d.id, d])))
  const clientById = computed(() => new Map(clients.value.map(c => [c.id, c])))
  const staffById = computed(() => new Map(staff.value.map(u => [u.id, u])))

  const clientName = (id: number | null | undefined) => (id ? clientById.value.get(id)?.company_name || `Клиент #${id}` : 'Без клиента')
  const staffName = (id: string | null | undefined) => (id ? personName(staffById.value.get(id) ?? null) : '—')
  /** менеджеры, которым можно назначать сделки и заявки */
  const managers = computed(() => staff.value.filter(u => u.status === 'active' && u.role !== ROLE_PRODUCTION))

  async function loadDeals() {
    deals.value = await api<Deal[]>('/items/crm_deals', {
      // цеху поля денег запрещены правами: '*' вернёт только разрешённое, а payments он не просит
      query: { fields: session.isProd ? '*,items.*' : '*,items.*,payments.*', sort: '-number', limit: -1, deep: JSON.stringify({ items: { _sort: ['sort', 'id'] } }) },
    })
  }

  async function loadClients() {
    clients.value = await api<Client[]>('/items/customer_profiles', {
      query: { fields: session.isProd ? 'id,company_name' : CLIENT_FIELDS, sort: 'company_name', limit: -1 },
    })
  }

  async function loadLeads() {
    if (session.isProd)
      return
    leads.value = await api<Lead[]>('/items/crm_leads', { query: { fields: '*', sort: '-date_created', limit: 300 } })
  }

  async function loadNotifications() {
    if (session.isProd)
      return
    notifications.value = await api<Notification[]>('/items/crm_notifications', {
      query: { fields: '*', filter: JSON.stringify({ recipient: { _eq: session.me?.id } }), sort: '-date_created', limit: 100 },
    })
  }

  async function loadStaff() {
    staff.value = await api<Staff[]>('/users', { query: { fields: STAFF_FIELDS, sort: 'first_name', limit: -1 } })
  }

  async function loadAll() {
    try {
      await Promise.all([loadStaff(), loadClients(), loadDeals(), loadLeads(), loadNotifications()])
      loaded.value = true
    }
    catch (error) {
      toast.error((error as Error).message)
    }
  }

  /** Перечитать одну сделку (после правки) и подменить в списке. */
  async function refreshDeal(id: number) {
    const fresh = await api<Deal[]>('/items/crm_deals', {
      query: { fields: session.isProd ? '*,items.*' : '*,items.*,payments.*', filter: JSON.stringify({ id: { _eq: id } }), limit: 1, deep: JSON.stringify({ items: { _sort: ['sort', 'id'] } }) },
    }).then(r => r[0]).catch(() => null)
    const i = deals.value.findIndex(d => d.id === id)
    if (!fresh) {
      if (i >= 0)
        deals.value.splice(i, 1)
      return null
    }
    if (i >= 0)
      deals.value.splice(i, 1, fresh)
    else
      deals.value.unshift(fresh)
    return fresh
  }

  const unread = computed(() => notifications.value.filter(n => !n.read_at))
  const openLeads = computed(() => leads.value.filter(l => l.status === 'new'))
  const debtors = computed(() => deals.value.filter(d => ['ready', 'done'].includes(d.stage) && balance(d) > 0))

  async function markRead(ids: number[]) {
    if (!ids.length)
      return
    const now = new Date().toISOString()
    for (const n of notifications.value) {
      if (ids.includes(n.id))
        n.read_at = now
    }
    await api('/items/crm_notifications', { method: 'PATCH', body: { keys: ids, data: { read_at: now } } }).catch(() => {})
  }

  function $reset() {
    deals.value = []
    clients.value = []
    leads.value = []
    notifications.value = []
    staff.value = []
    loaded.value = false
  }

  return {
    deals,
    clients,
    leads,
    notifications,
    staff,
    loaded,
    dealById,
    clientById,
    staffById,
    clientName,
    staffName,
    managers,
    unread,
    openLeads,
    debtors,
    loadDeals,
    loadClients,
    loadLeads,
    loadNotifications,
    loadStaff,
    loadAll,
    refreshDeal,
    markRead,
    $reset,
  }
})
