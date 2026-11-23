import type { AuthUser } from '~/types/auth'
import type { Product, ProductVariant } from '~/types/product'

export type ReservationStatus = 'active' | 'confirmed' | 'cancelled' | 'expired'

export interface Reservation {
  id: number

  status: ReservationStatus

  user: string | AuthUser
  product: number | string | Product | null
  variant?: number | string | ProductVariant | null

  quantity: number

  reserved_at: string
  expires_at: string

  price_at_reserve?: number | null
  customer_comment?: string | null
  manager_note?: string | null
}

export interface CreateReservationPayload {
  product: number | string
  variant?: number | string | null
  quantity: number
  price_at_reserve?: number | null
  customer_comment?: string
}
