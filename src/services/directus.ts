import type { DirectusResponse, Product } from '~/types/product'

const BASE = import.meta.env.VITE_DIRECTUS_URL as string

export function fileUrl(fileId: string) {
  return `${BASE}/assets/${fileId}`
}

async function getJSON<T>(path: string): Promise<T> {
  if (!BASE)
    throw new Error('VITE_DIRECTUS_URL is not set')

  const res = await fetch(`${BASE}${path}`)

  if (!res.ok) {
    throw new Error(`Directus ${res.status}: ${await res.text()}`)
  }

  return res.json()
}

export async function fetchProducts(): Promise<Product[]> {
  const q = new URLSearchParams({
    fields: 'id,title,slug,description,in_stock,price,images.directus_files_id,category.id,category.title,category.slug',
    sort: '-id',
  })

  const json = await getJSON<DirectusResponse<Product[]>>(`/items/products?${q.toString()}`)
  return json.data
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const q = new URLSearchParams({
    'fields': 'id,title,slug,description,in_stock,price,images.directus_files_id,category.id,category.title,category.slug',
    'filter[slug][_eq]': slug,
    'limit': '1',
  })

  const json = await getJSON<DirectusResponse<Product[]>>(`/items/products?${q.toString()}`)
  return json.data[0] ?? null
}
