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
  in_stock: boolean
  images?: ProductImage[]
  price: string
  category: Category
}
