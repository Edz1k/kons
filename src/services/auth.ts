import type {
  AuthTokens,
  AuthUser,
  CustomerProfile,
  UpdateCustomerProfilePayload,
} from '~/types/auth'
import type { DirectusListResponse, DirectusResponse } from '~/types/product'
import { directusRequest } from '~/services/directus'

const CUSTOMER_PROFILE_FIELDS = [
  'id',
  'user',
  'discount_percent',
  'price_group',
  'company_name',
  'phone',
].join(',')

export async function loginWithEmail(email: string, password: string) {
  const response = await directusRequest<DirectusResponse<AuthTokens>>('/auth/login', {
    method: 'POST',
    body: {
      email,
      password,
      mode: 'json',
    },
  })

  return response.data
}

export async function refreshAuthToken(refreshToken: string) {
  const response = await directusRequest<DirectusResponse<AuthTokens>>('/auth/refresh', {
    method: 'POST',
    body: {
      refresh_token: refreshToken,
      mode: 'json',
    },
  })

  return response.data
}

export async function logoutFromDirectus(refreshToken: string) {
  await directusRequest<void>('/auth/logout', {
    method: 'POST',
    body: {
      refresh_token: refreshToken,
      mode: 'json',
    },
  })
}

export async function registerCustomer(email: string, password: string) {
  await directusRequest<void>('/users/register', {
    method: 'POST',
    body: {
      email,
      password,
    },
  })
}

export async function fetchCurrentUser(token: string) {
  const response = await directusRequest<DirectusResponse<AuthUser>>(
    '/users/me?fields=id,email,first_name,last_name,role.name',
    { token },
  )

  return response.data
}

export async function fetchCustomerProfile(token: string) {
  const response = await directusRequest<DirectusListResponse<CustomerProfile[]>>(
    `/items/customer_profiles?fields=${CUSTOMER_PROFILE_FIELDS}&limit=1`,
    { token },
  )

  return response.data[0] ?? null
}

export async function createCustomerProfile(
  token: string,
  userId: string,
  payload: UpdateCustomerProfilePayload = {},
) {
  const response = await directusRequest<DirectusResponse<CustomerProfile>>(
    `/items/customer_profiles?fields=${CUSTOMER_PROFILE_FIELDS}`,
    {
      method: 'POST',
      token,
      body: {
        user: userId,
        company_name: payload.company_name ?? '',
        phone: payload.phone ?? '',
      },
    },
  )

  return response.data
}

export async function updateCustomerProfile(
  token: string,
  profileId: number,
  payload: UpdateCustomerProfilePayload,
) {
  const response = await directusRequest<DirectusResponse<CustomerProfile>>(
    `/items/customer_profiles/${profileId}?fields=${CUSTOMER_PROFILE_FIELDS}`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  )

  return response.data
}
