export type Role = 'admin' | 'staff'

export interface Me {
  id: string
  first_name: string | null
  last_name: string | null
  role: Role
}

export type MovementType = 'receipt' | 'issue' | 'return' | 'cancel_in' | 'cancel_out' | 'adjust_in' | 'adjust_out'
export type OpType = 'receipt' | 'issue' | 'return'
export type ProductStatus = 'published' | 'draft'

/** Товар сайта (products) — то, что складу нужно знать о нём. */
export interface ProductRef {
  id: number
  title: string
  status: ProductStatus
  /** цена на сайте, ₸ */
  price: number | null
}

/**
 * Позиция склада = вариант товара сайта (product_variants) в той форме, в какой его отдаёт Directus.
 * Остаток — stock, тот же, что видит сайт.
 */
export interface Variant {
  id: number
  barcode: string
  sku: string | null
  stock: number | null
  min_quantity: number | null
  /** null — «висячий» вариант без товара (остался от удалённого товара) */
  product: ProductRef | null
  color: { id: number, name: string } | null
}

/** Вариант внутри журнала и заявок: только то, что нужно для подписи. */
export type VariantRef = Pick<Variant, 'id' | 'barcode' | 'sku'> & {
  product: Pick<ProductRef, 'title'> | null
  color: Pick<NonNullable<Variant['color']>, 'name'> | null
}

export interface UserRef {
  id: string
  first_name: string | null
  last_name: string | null
}

export interface Movement {
  id: number
  type: MovementType
  quantity: number
  balance_after: number | null
  note: string | null
  deal_ref: string | null
  reverses: number | null
  date_created: string
  variant: VariantRef
  user_created: UserRef | null
  /** проставляем на клиенте: есть ли отмена этой операции */
  cancelled?: boolean
}

export interface RequestLine {
  id: number
  quantity: number
  variant: VariantRef & Pick<Variant, 'stock'>
}

export interface StockRequest {
  id: number
  deal_ref: string
  client_name: string | null
  manager_name: string | null
  note: string | null
  status: 'new' | 'done' | 'cancelled'
  date_created: string
  completed_at: string | null
  completed_by: UserRef | null
  lines: RequestLine[]
}

export interface Overview {
  variant_count: number
  total_quantity: number
  total_value: number
  out_count: number
  low_count: number
  unknown_count: number
  draft_count: number
  open_requests: number
}

export interface StaffUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: string
  status: string
  last_access: string | null
}

export interface Color {
  id: number
  name: string
  hex: string | null
}
