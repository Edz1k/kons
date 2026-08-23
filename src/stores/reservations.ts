import type { CreateReservationPayload, Reservation } from '~/types/reservation'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  cancelReservation,
  createReservation,
  fetchMyReservations,
} from '~/services/reservations'
import { useAuthStore } from '~/stores/auth'

function relationId(value: unknown): string {
  if (value === null || value === undefined)
    return ''

  if (typeof value === 'object')
    return String((value as { id?: number | string }).id ?? '')

  return String(value)
}

export function isReservationExpired(reservation: Reservation, now = Date.now()) {
  const expiresAt = new Date(reservation.expires_at).getTime()

  if (Number.isNaN(expiresAt))
    return false

  return expiresAt <= now
}

export function isReservationActive(reservation: Reservation, now = Date.now()) {
  return reservation.status === 'active' && !isReservationExpired(reservation, now)
}

export const useReservationsStore = defineStore('reservations', () => {
  const authStore = useAuthStore()

  const items = ref<Reservation[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const initialized = ref(false)
  const error = ref('')

  /** Тикает раз в минуту, чтобы таймеры и статусы пересчитывались сами. */
  const now = ref(Date.now())
  let ticker: ReturnType<typeof setInterval> | null = null

  function startTicker() {
    if (ticker || typeof window === 'undefined')
      return

    ticker = setInterval(() => {
      now.value = Date.now()
    }, 60_000)
  }

  const activeItems = computed(() =>
    items.value.filter(reservation => isReservationActive(reservation, now.value)),
  )

  const historyItems = computed(() =>
    items.value.filter(reservation => !isReservationActive(reservation, now.value)),
  )

  const activeByVariant = computed(() => {
    const map = new Map<string, Reservation>()

    activeItems.value.forEach((reservation) => {
      const variantKey = relationId(reservation.variant)

      if (variantKey)
        map.set(variantKey, reservation)
    })

    return map
  })

  const activeByProduct = computed(() => {
    const map = new Map<string, Reservation[]>()

    activeItems.value.forEach((reservation) => {
      const productKey = relationId(reservation.product)

      if (!productKey)
        return

      const bucket = map.get(productKey) ?? []
      bucket.push(reservation)
      map.set(productKey, bucket)
    })

    return map
  })

  function reservationForVariant(variantId: number | string | null | undefined) {
    if (variantId === null || variantId === undefined)
      return null

    return activeByVariant.value.get(String(variantId)) ?? null
  }

  function reservationsForProduct(productId: number | string | null | undefined) {
    if (productId === null || productId === undefined)
      return []

    return activeByProduct.value.get(String(productId)) ?? []
  }

  /** Сколько штук этого варианта держит сам пользователь. */
  function myReservedQty(variantId: number | string | null | undefined) {
    return reservationForVariant(variantId)?.quantity ?? 0
  }

  async function requireToken() {
    await authStore.init()

    if (!authStore.isAuthenticated)
      return ''

    await authStore.refreshSessionIfNeeded()

    return authStore.accessToken
  }

  function upsert(reservation: Reservation) {
    const index = items.value.findIndex(item => item.id === reservation.id)

    if (index === -1)
      items.value = [reservation, ...items.value]
    else
      items.value[index] = reservation
  }

  async function load(force = false) {
    if (loading.value)
      return

    if (initialized.value && !force)
      return

    const token = await requireToken()

    if (!token) {
      items.value = []
      initialized.value = true
      return
    }

    loading.value = true
    error.value = ''

    try {
      items.value = await fetchMyReservations(token)
      initialized.value = true
      now.value = Date.now()
      startTicker()
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
    finally {
      loading.value = false
    }
  }

  async function reserve(payload: CreateReservationPayload) {
    const token = await requireToken()

    if (!token)
      throw new Error('Войдите в аккаунт, чтобы зарезервировать товар')

    saving.value = true
    error.value = ''

    try {
      const reservation = await createReservation(token, payload)
      upsert(reservation)
      now.value = Date.now()
      startTicker()

      return reservation
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function cancel(id: number) {
    const token = await requireToken()

    if (!token)
      throw new Error('Войдите в аккаунт, чтобы отменить резерв')

    saving.value = true
    error.value = ''

    try {
      const reservation = await cancelReservation(token, id)
      upsert(reservation)

      return reservation
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
    finally {
      saving.value = false
    }
  }

  function reset() {
    items.value = []
    initialized.value = false
    error.value = ''
  }

  return {
    items,
    loading,
    saving,
    initialized,
    error,
    now,
    activeItems,
    historyItems,
    reservationForVariant,
    reservationsForProduct,
    myReservedQty,
    load,
    reserve,
    cancel,
    reset,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useReservationsStore as any, import.meta.hot))
