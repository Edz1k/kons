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

export type CatalogType = 'own' | 'partner'

export interface Category {
  id: string | number
  title: string
  slug: string
}

export interface ProductImage {
  directus_files_id: string
}

export interface Color {
  id: number | string
  name: string
  slug: string
  hex: string
}

export interface ProductVariant {
  id: number | string

  sku?: string
  stock: number
  is_default: boolean

  images?: ProductImage[]
  color?: Color

  external_images_urls?: string[]
  external_id?: string
  external_sku?: string
  full_stock?: number
  price?: number
  variation_description?: string
  size_range?: string
}

export interface Product {
  id: number | string

  title: string
  slug: string
  description?: string

  price: number

  category?: Category

  product_variants?: ProductVariant[]
  images?: ProductImage[]

  external_id?: string
  source_type?: string
  external_url?: string
  preview_image?: string
  in_stock?: boolean
  is_partner?: boolean
}
