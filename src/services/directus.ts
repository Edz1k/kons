import type {
  Category,
  DirectusListResponse,
  Product,
} from '~/types/product'

const BASE = import.meta.env.VITE_DIRECTUS_URL as string

const PRODUCT_FIELDS = [
  'id',
  'title',
  'slug',
  'description',
  'price',
  'images.directus_files_id',
  'category.id',
  'category.title',
  'category.slug',
  'product_variants.id',
  'product_variants.sku',
  'product_variants.stock',
  'product_variants.is_default',
  'product_variants.images.directus_files_id',
  'product_variants.color.id',
  'product_variants.color.name',
  'product_variants.color.slug',
  'product_variants.color.hex',
].join(',')

export interface FetchProductsParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  inStockOnly?: boolean
  sortBy?: 'default' | 'price-asc' | 'price-desc'
  signal?: AbortSignal
}

export interface FetchProductsResult {
  items: Product[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

export function fileUrl(fileId: string) {
  return `${BASE}/assets/${fileId}`
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!BASE)
    throw new Error('VITE_DIRECTUS_URL is not set')

  const response = await fetch(`${BASE}${path}`, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Directus ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}

function mapSort(sortBy: FetchProductsParams['sortBy']) {
  switch (sortBy) {
    case 'price-asc':
      return 'price'
    case 'price-desc':
      return '-price'
    default:
      return '-id'
  }
}

function hasStock(product: Product): boolean {
  return (product.product_variants ?? []).some(variant => variant.stock > 0)
}

function matchesSearch(product: Product, search: string): boolean {
  const normalized = search.trim().toLowerCase()

  if (!normalized)
    return true

  const inTitle = product.title.toLowerCase().includes(normalized)
  const inVariants = (product.product_variants ?? []).some(variant =>
    variant.sku.toLowerCase().includes(normalized),
  )

  return inTitle || inVariants
}

export async function fetchProducts(
  params: FetchProductsParams = {},
): Promise<FetchProductsResult> {
  const {
    page = 1,
    limit = 12,
    category = '',
    search = '',
    inStockOnly = false,
    sortBy = 'default',
    signal,
  } = params

  const query = new URLSearchParams({
    fields: PRODUCT_FIELDS,
    page: String(page),
    limit: String(limit),
    sort: mapSort(sortBy),
    meta: 'filter_count',
  })

  if (category)
    query.set('filter[category][slug][_eq]', category)

  const json = await getJSON<DirectusListResponse<Product[]>>(
    `/items/products?${query.toString()}`,
    signal,
  )

  let items = json.data ?? []

  const normalizedSearch = search.trim()

  if (normalizedSearch)
    items = items.filter(product => matchesSearch(product, normalizedSearch))

  if (inStockOnly)
    items = items.filter(product => hasStock(product))

  const total = items.length
  const hasMore = page * limit < total

  return {
    items,
    total,
    hasMore,
    page,
    limit,
  }
}

export async function fetchProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Product | null> {
  const query = new URLSearchParams({
    'fields': PRODUCT_FIELDS,
    'filter[slug][_eq]': slug,
    'limit': '1',
  })

  const json = await getJSON<DirectusListResponse<Product[]>>(
    `/items/products?${query.toString()}`,
    signal,
  )

  return json.data?.[0] ?? null
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const query = new URLSearchParams({
    fields: 'id,title,slug',
    sort: 'title',
    limit: '-1',
  })

  const json = await getJSON<DirectusListResponse<Category[]>>(
    `/items/Categories?${query.toString()}`,
    signal,
  )

  return json.data ?? []
}
