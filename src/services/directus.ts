import type {
  Category,
  Color,
  DirectusListResponse,
  Product,
  ProductVariant,
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

const PARTNER_PRODUCT_FIELDS = [
  'id',
  'title',
  'slug',
  'description',
  'category.id',
  'category.title',
  'category.slug',
  'external_id',
  'source_type',
  'price_from',
  'in_stock',
  'preview_image',
  'payload',
].join(',')

interface PartnerPayloadVariant {
  sku?: string
  external_id?: string
  external_sku?: string
  stock?: number
  full_stock?: number
  price?: number
  color?: string
  size?: string
  images?: string[]
  variation_description?: string
  brand?: string
  url?: string
  notes?: string
  modified?: string
}

interface PartnerPayload {
  title?: string
  slug?: string
  description?: string
  external_id?: string
  source_type?: string
  variants?: PartnerPayloadVariant[]
}

interface PartnerProductRaw {
  id: number
  title: string
  slug: string
  description?: string
  category?: Category
  external_id?: string
  source_type?: string
  price_from?: number
  in_stock?: boolean
  preview_image?: string
  payload?: PartnerPayload
}

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

function createPartnerColor(colorName?: string): Color | undefined {
  if (!colorName)
    return undefined

  return {
    id: `partner-color-${colorName.toLowerCase().replace(/\s+/g, '-')}`,
    name: colorName,
    slug: colorName.toLowerCase().replace(/\s+/g, '-'),
    hex: '#cccccc',
  }
}

function normalizePartnerVariant(
  variant: PartnerPayloadVariant,
  index: number,
): ProductVariant {
  return {
    id: `partner-variant-${variant.external_id ?? variant.external_sku ?? variant.sku ?? index}`,
    sku: variant.sku ?? variant.external_sku ?? '',
    stock: Number(variant.stock ?? 0),
    is_default: index === 0,
    external_images_urls: variant.images ?? [],
    external_id: variant.external_id,
    external_sku: variant.external_sku,
    full_stock: variant.full_stock,
    price: typeof variant.price === 'number' ? variant.price : Number(variant.price ?? 0),
    variation_description: variant.variation_description,
    size_range: variant.size,
    color: createPartnerColor(variant.color),
  }
}

function normalizePartnerProduct(raw: PartnerProductRaw): Product {
  const variants = (raw.payload?.variants ?? []).map(normalizePartnerVariant)

  return {
    id: `partner-${raw.id}`,
    title: raw.title,
    slug: raw.slug,
    description: raw.description ?? raw.payload?.description ?? '',
    price: Number(raw.price_from ?? variants[0]?.price ?? 0),
    category: raw.category,
    product_variants: variants,
    images: [],
    external_id: raw.external_id,
    source_type: raw.source_type,
    preview_image: raw.preview_image,
    in_stock: raw.in_stock,
    is_partner: true,
  }
}

function matchesSearch(product: Product, search: string): boolean {
  const normalized = search.trim().toLowerCase()

  if (!normalized)
    return true

  const inTitle = product.title.toLowerCase().includes(normalized)
  const inCategory = product.category?.title?.toLowerCase().includes(normalized)
  const inExternalId = product.external_id?.toLowerCase().includes(normalized)

  const inVariants = (product.product_variants ?? []).some((variant) => {
    const inSku = variant.sku?.toLowerCase().includes(normalized)
    const inColor = variant.color?.name?.toLowerCase().includes(normalized)
    return Boolean(inSku || inColor)
  })

  return Boolean(inTitle || inCategory || inExternalId || inVariants)
}

function hasStock(product: Product): boolean {
  if (product.product_variants?.length)
    return product.product_variants.some(variant => variant.stock > 0)

  return Boolean(product.in_stock)
}

function sortProducts(items: Product[], sortBy: FetchProductsParams['sortBy']) {
  const result = [...items]

  if (sortBy === 'price-asc')
    return result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))

  if (sortBy === 'price-desc')
    return result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))

  return result.sort((a, b) => String(b.id).localeCompare(String(a.id)))
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

  const ownQuery = new URLSearchParams({
    fields: PRODUCT_FIELDS,
    limit: '-1',
    sort: mapSort(sortBy),
  })

  if (category)
    ownQuery.set('filter[category][slug][_eq]', category)

  const partnerQuery = new URLSearchParams({
    'fields': PARTNER_PRODUCT_FIELDS,
    'limit': '-1',
    'filter[is_active][_eq]': 'true',
  })

  if (category)
    partnerQuery.set('filter[category][slug][_eq]', category)

  const [ownJson, partnerJson] = await Promise.all([
    getJSON<DirectusListResponse<Product[]>>(
      `/items/products?${ownQuery.toString()}`,
      signal,
    ),
    getJSON<DirectusListResponse<PartnerProductRaw[]>>(
      `/items/partner_products?${partnerQuery.toString()}`,
      signal,
    ),
  ])

  let items: Product[] = [
    ...(ownJson.data ?? []),
    ...((partnerJson.data ?? []).map(normalizePartnerProduct)),
  ]

  if (search.trim())
    items = items.filter(product => matchesSearch(product, search))

  if (inStockOnly)
    items = items.filter(product => hasStock(product))

  items = sortProducts(items, sortBy)

  const total = items.length
  const start = (page - 1) * limit
  const end = start + limit

  return {
    items: items.slice(start, end),
    total,
    hasMore: end < total,
    page,
    limit,
  }
}

export async function fetchProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Product | null> {
  const ownQuery = new URLSearchParams({
    'fields': PRODUCT_FIELDS,
    'filter[slug][_eq]': slug,
    'limit': '1',
  })

  const ownJson = await getJSON<DirectusListResponse<Product[]>>(
    `/items/products?${ownQuery.toString()}`,
    signal,
  )

  const ownProduct = ownJson.data?.[0]
  if (ownProduct)
    return ownProduct

  const partnerQuery = new URLSearchParams({
    'fields': PARTNER_PRODUCT_FIELDS,
    'filter[slug][_eq]': slug,
    'filter[is_active][_eq]': 'true',
    'limit': '1',
  })

  const partnerJson = await getJSON<DirectusListResponse<PartnerProductRaw[]>>(
    `/items/partner_products?${partnerQuery.toString()}`,
    signal,
  )

  const partnerProduct = partnerJson.data?.[0]
  return partnerProduct ? normalizePartnerProduct(partnerProduct) : null
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
