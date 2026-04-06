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
  stock: number
  is_default: boolean
  images?: ProductImage[]
  color: Color
}

export interface Product {
  id: number
  title: string
  slug: string
  description?: string
  images?: ProductImage[]
  price: number
  category: Category
  product_variants?: ProductVariant[]
}
