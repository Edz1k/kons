import type { DirectusListResponse, DirectusResponse } from '~/types/product'
import type { CreateReservationPayload, Reservation, ReservationStatus } from '~/types/reservation'
import { directusRequest } from '~/services/directus'

/**
 * Максимальный срок резерва. Directus дублирует это правило на своей стороне
 * (flow `reservations_set_expiry`), клиент значение `expires_at` не отправляет.
 */
export const RESERVATION_DAYS = 3
export const RESERVATION_MS = RESERVATION_DAYS * 24 * 60 * 60 * 1000

const RESERVATION_FIELDS = [
  'id',
  'status',
  'quantity',
  'reserved_at',
  'expires_at',
  'price_at_reserve',
  'customer_comment',
  'manager_note',
  'product.id',
  'product.title',
  'product.slug',
  'product.price',
  'product.images.directus_files_id',
  'product.images.sort',
  'variant.id',
  'variant.sku',
  'variant.stock',
  'variant.reserved_qty',
  'variant.color.name',
  'variant.color.hex',
  'variant.images.directus_files_id',
  'variant.images.sort',
].join(',')

export async function fetchMyReservations(
  token: string,
  statuses: ReservationStatus[] = [],
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    'fields': RESERVATION_FIELDS,
    'filter[user][_eq]': '$CURRENT_USER',
    'sort': '-reserved_at',
    'limit': '100',
  })

  if (statuses.length)
    query.set('filter[status][_in]', statuses.join(','))

  const response = await directusRequest<DirectusListResponse<Reservation[]>>(
    `/items/reservations?${query.toString()}`,
    { token, signal },
  )

  return response.data ?? []
}

export async function createReservation(
  token: string,
  payload: CreateReservationPayload,
) {
  const response = await directusRequest<DirectusResponse<Reservation>>(
    `/items/reservations?fields=${RESERVATION_FIELDS}`,
    {
      method: 'POST',
      token,
      body: {
        product: payload.product,
        variant: payload.variant ?? null,
        quantity: payload.quantity,
        price_at_reserve: payload.price_at_reserve ?? null,
        customer_comment: payload.customer_comment ?? '',
      },
    },
  )

  return response.data
}

export async function cancelReservation(token: string, id: number) {
  const response = await directusRequest<DirectusResponse<Reservation>>(
    `/items/reservations/${id}?fields=${RESERVATION_FIELDS}`,
    {
      method: 'PATCH',
      token,
      body: { status: 'cancelled' },
    },
  )

  return response.data
}
