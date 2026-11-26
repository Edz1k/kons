/**
 * Живые обновления CRM через WebSocket Directus: подписка на сделки, позиции, оплаты, заявки, клиентов
 * и уведомления. Права Directus действуют и здесь — сотрудник получает события только по тому, что видит.
 * Обрыв связи — переподключение с паузой; на всякий случай раз в минуту данные перечитываются целиком.
 */
import { toast } from 'vue-sonner'
import { accessToken, WS_URL } from '~/api/directus'

type Collection = 'crm_deals' | 'crm_deal_items' | 'crm_payments' | 'crm_leads' | 'customer_profiles' | 'crm_notifications'

export function useRealtime() {
  const crm = useCrmStore()
  const session = useSessionStore()
  const connected = ref(false)

  let ws: WebSocket | null = null
  let retry = 0
  let stopped = false
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  const pending = new Set<Collection>()
  let flushTimer: ReturnType<typeof setTimeout> | undefined

  const collections = computed<Collection[]>(() => session.isProd
    ? ['crm_deals', 'crm_deal_items']
    : ['crm_deals', 'crm_deal_items', 'crm_payments', 'crm_leads', 'customer_profiles', 'crm_notifications'])

  /** События приходят пачками — перечитываем коллекцию не чаще раза в 400 мс. */
  function schedule(collection: Collection) {
    pending.add(collection)
    clearTimeout(flushTimer)
    flushTimer = setTimeout(async () => {
      const todo = new Set(pending)
      pending.clear()
      if (todo.has('crm_deals') || todo.has('crm_deal_items') || todo.has('crm_payments'))
        await crm.loadDeals().catch(() => {})
      if (todo.has('crm_leads'))
        await crm.loadLeads().catch(() => {})
      if (todo.has('customer_profiles'))
        await crm.loadClients().catch(() => {})
      if (todo.has('crm_notifications')) {
        const before = new Set(crm.notifications.map(n => n.id))
        await crm.loadNotifications().catch(() => {})
        for (const n of crm.notifications) {
          if (!before.has(n.id) && !n.read_at)
            n.warn ? toast.warning(n.text) : toast(n.text)
        }
      }
    }, 400)
  }

  async function connect() {
    if (stopped)
      return
    const token = await accessToken()
    if (!token)
      return
    ws = new WebSocket(WS_URL)
    ws.onopen = () => ws?.send(JSON.stringify({ type: 'auth', access_token: token }))
    ws.onmessage = (event) => {
      let msg: { type?: string, status?: string, uid?: string, event?: string }
      try {
        msg = JSON.parse(String(event.data))
      }
      catch {
        return
      }
      if (msg.type === 'ping') {
        ws?.send(JSON.stringify({ type: 'pong' }))
        return
      }
      if (msg.type === 'auth' && msg.status === 'ok') {
        connected.value = true
        retry = 0
        for (const collection of collections.value)
          ws?.send(JSON.stringify({ type: 'subscribe', collection, uid: collection, query: { fields: ['id'] } }))
        return
      }
      if (msg.type === 'subscription' && msg.event && msg.event !== 'init' && msg.uid)
        schedule(msg.uid as Collection)
    }
    ws.onclose = () => {
      connected.value = false
      ws = null
      if (stopped)
        return
      retry = Math.min(retry + 1, 6)
      reconnectTimer = setTimeout(connect, 1000 * 2 ** retry)
    }
    ws.onerror = () => ws?.close()
  }

  const poll = useIntervalFn(() => crm.loadAll(), 60_000, { immediate: false })

  function start() {
    stopped = false
    connect()
    poll.resume()
  }

  function stop() {
    stopped = true
    clearTimeout(reconnectTimer)
    poll.pause()
    ws?.close()
  }

  // вернулись в приложение (телефон из фона) — сразу свежие данные
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible' && session.me) {
      crm.loadAll()
      if (!ws)
        connect()
    }
  })

  return { connected, start, stop }
}
