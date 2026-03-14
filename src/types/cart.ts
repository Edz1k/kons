export interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  sku?: string
  image?: string | null
  stock_quantity?: number
}
