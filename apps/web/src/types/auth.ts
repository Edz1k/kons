export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires: number
}

export interface AuthUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role?: string | {
    name?: string | null
  } | null
}

export interface CustomerProfile {
  id: number
  user: string | AuthUser
  discount_percent: number
  price_group: string
  company_name?: string | null
  phone?: string | null
}

export interface StoredAuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface UpdateCustomerProfilePayload {
  company_name?: string
  phone?: string
}
