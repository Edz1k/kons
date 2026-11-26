export type Role = 'head' | 'mgr' | 'prod'
export type Stage = 'new' | 'calc' | 'mock' | 'pay' | 'prod' | 'ready' | 'done' | 'lost'
export type Source = 'wa' | 'ig' | 'tg' | 'site' | 'call'
export type Mockup = 'none' | 'wait' | 'ok'
export type PrState = 'queue' | 'work' | 'done'

export interface Me {
  id: string
  first_name: string | null
  last_name: string | null
  role: Role
}

export interface UserRef {
  id: string
  first_name: string | null
  last_name: string | null
}

export interface Staff extends UserRef {
  role: string | null
  status: string
  email?: string
  last_access?: string | null
}

/** Клиент = customer_profiles (общий с сайтом). */
export interface Client {
  id: number
  user: string | null
  company_name: string | null
  contact_name: string | null
  phone: string | null
  instagram: string | null
  email: string | null
  manager: string | null
  discount_percent: number
  price_group: string
  crm_note: string | null
  date_created: string | null
}

export interface DealItem {
  id: number
  deal: number
  sort: number | null
  name: string
  quantity: number
  price: string | number
  technique: string | null
  technique_price: string | number
  variant: number | null
}

export interface Payment {
  id: number
  deal: number
  paid_on: string
  amount: string | number
  note: string | null
  user_created: UserRef | string | null
  date_created: string
}

export interface LogEntry {
  id: number
  text: string
  user_created: UserRef | null
  date_created: string
}

export interface Deal {
  id: number
  number: number
  title: string
  client: number | null
  manager: string | null
  stage: Stage
  source: Source
  deadline: string | null
  discount: number
  mockup: Mockup
  no_print: boolean
  lost_reason: string | null
  lost_note: string | null
  lost_from: Stage | null
  lost_at: string | null
  pr_state: PrState | null
  pr_started_at: string | null
  pr_finished_at: string | null
  pr_by: string | null
  pr_quantities: number[] | null
  pr_note: string | null
  pr_photo: string | null
  warehouse_request: number | null
  date_created: string
  date_updated: string | null
  /** у цеха и менеджера — с сервера; у цеха без цен */
  items: DealItem[]
  /** у цеха не приходят */
  payments?: Payment[]
}

export interface Lead {
  id: number
  source: Source
  sender: string | null
  text: string | null
  company: string | null
  client: number | null
  manager: string | null
  status: 'new' | 'done'
  deal: number | null
  date_created: string
}

export interface Notification {
  id: number
  deal: number | null
  lead: number | null
  kind: 'lead' | 'chat' | 'call' | 'ready' | 'system'
  text: string
  warn: boolean
  read_at: string | null
  date_created: string
}

export interface VariantOption {
  id: number
  barcode: string
  sku: string | null
  stock: number | null
  reserved_qty: number | null
  product: { id: number, title: string, price: number | null } | null
  color: { name: string } | null
}
