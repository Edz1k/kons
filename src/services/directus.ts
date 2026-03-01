const BASE = import.meta.env.VITE_DIRECTUS_URL as string

interface DirectusResponse<T> { data: T }

export interface Product {
  id: number
  title: string
  slug: string
  description?: string
  in_stock: boolean
  images?: { directus_files_id: string }[]
  price: string
  category: {
    id: string
    title: string
    slug: string
  }

}

export function fileUrl(fileId: string) {
  return `${BASE}/assets/${fileId}`
}

async function getJSON<T>(path: string): Promise<T> {
  if (!BASE)
    throw new Error('VITE_DIRECTUS_URL is not set')
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok)
    throw new Error(`Directus ${res.status}: ${await res.text()}`)

  return res.json()
}

export async function fetchProducts(): Promise<Product[]> {
  const q = new URLSearchParams({
    fields: '*.*',
    sort: '-id',
  })
  const json = await getJSON<DirectusResponse<Product[]>>(`/items/products?${q.toString()}`)
  return json.data
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const q = new URLSearchParams({
    'fields': 'id,title,slug,description,in_stock,images.directus_files_id',
    'filter[slug][_eq]': slug,
    'limit': '1',
  })
  const json = await getJSON<DirectusResponse<Product[]>>(`/items/products?${q.toString()}`)
  return json.data[0] ?? null
}
