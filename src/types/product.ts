export interface DirectusResponse<T> {
  data: T
}

export interface Category {
  id: string
  title: string
  slug: string
}

export interface ProductImage {
  directus_files_id: string
}

export interface Product {
  id: number
  title: string
  slug: string
  description?: string
  images?: ProductImage[]
  price: string
  category: Category
  sku: string
  stock_quantity: number
}
