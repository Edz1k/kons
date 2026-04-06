export interface DirectusResponse<T> {
  data: T
}

export interface DirectusListMeta {
  filter_count?: number
  total_count?: number
}

export interface DirectusListResponse<T> {
  data: T
  meta?: DirectusListMeta
}

export interface Category {
  id: string
  title: string
  slug: string
}

export interface ProductImage {
  directus_files_id: string
}

export interface Color {
  id: number
  name: string
  slug: string
  hex: string
}

export interface ProductVariant {
  id: number

  sku: string
  external_id?: string
  external_sku?: string

  stock: number
  full_stock?: number

  is_default: boolean

  // твои картинки (Directus)
  images?: ProductImage[]

  // 🔥 партнёрские картинки
  external_images_urls?: string[]

  color?: Color

  size_range?: string
  variation_description?: string

  price?: number
}

export interface Product {
  id: number

  title: string
  slug: string
  description?: string

  price: number

  category?: Category

  product_variants?: ProductVariant[]

  // твои картинки
  images?: ProductImage[]

  // 🔥 партнёрские поля
  external_id?: string
  source_type?: string
  external_url?: string

  last_synced_at?: string
}
