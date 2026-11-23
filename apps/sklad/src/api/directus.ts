/**
 * Клиент Directus для склада: вход, обновление токена, понятные ошибки.
 * Токены лежат в localStorage этого поддомена (warehouse.brillex.kz), с сайтом не пересекаются.
 */

const DIRECTUS_URL = ((import.meta.env.VITE_DIRECTUS_URL as string | undefined) ?? 'https://cms.brillex.kz').replace(/\/+$/, '')
// в разработке — через прокси vite (/directus), на Netlify — VITE_DIRECTUS_URL из netlify.toml
const BASE = import.meta.env.DEV ? '/directus' : DIRECTUS_URL
/** Админка Directus: ссылки «открыть товар» */
export const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`
const STORAGE_KEY = 'brillex-sklad-session'
const REFRESH_SKEW_MS = 30_000

interface Session {
  access: string
  refresh: string
  expiresAt: number
}

export class ApiError extends Error {
  status: number
  code: string
  details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Session : null
  }
  catch {
    return null
  }
}

let session: Session | null = readSession()
let refreshing: Promise<boolean> | null = null
let onLost: (() => void) | null = null

function saveSession(next: Session | null) {
  session = next
  try {
    if (next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else
      localStorage.removeItem(STORAGE_KEY)
  }
  catch {}
}

export const hasSession = () => Boolean(session)

/** Что делать, когда сессия кончилась окончательно (refresh не прошёл). */
export function onSessionLost(fn: () => void) {
  onLost = fn
}

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Неверный логин или пароль',
  USER_SUSPENDED: 'Доступ отключён. Обратитесь к администратору склада',
  FORBIDDEN: 'Нет доступа',
  TOKEN_EXPIRED: 'Сессия закончилась. Войдите снова',
  REQUESTS_EXCEEDED: 'Слишком много попыток. Подождите немного',
}

async function parseError(response: Response): Promise<ApiError> {
  let json: { errors?: { message?: string, extensions?: { code?: string, details?: unknown } }[] } | null = null
  try {
    json = await response.json()
  }
  catch {}
  const first = json?.errors?.[0]
  const code = first?.extensions?.code ?? `HTTP_${response.status}`
  // свои ошибки склада уже по-русски; системные Directus переводим
  const message = MESSAGES[code] ?? first?.message ?? `Ошибка сервера (${response.status})`
  return new ApiError(response.status, code, message, first?.extensions?.details)
}

function storeTokens(data: { access_token: string, refresh_token: string, expires: number }) {
  saveSession({ access: data.access_token, refresh: data.refresh_token, expiresAt: Date.now() + data.expires })
}

async function refresh(): Promise<boolean> {
  if (!session)
    return false
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session!.refresh, mode: 'json' }),
      })
      if (!response.ok) {
        saveSession(null)
        return false
      }
      storeTokens((await response.json()).data)
      return true
    }
    catch {
      return false
    }
    finally {
      refreshing = null
    }
  })()
  return refreshing
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '')
      params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE}${path}${qs ? `?${qs}` : ''}`
}

/** Запрос к Directus от имени вошедшего сотрудника. Возвращает поле data. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (session && session.expiresAt - REFRESH_SKEW_MS < Date.now())
    await refresh()

  const send = () => fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(session ? { Authorization: `Bearer ${session.access}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  let response: Response
  try {
    response = await send()
    if (response.status === 401 && session && await refresh())
      response = await send()
  }
  catch {
    throw new ApiError(0, 'NETWORK', 'Нет связи с сервером. Проверьте интернет')
  }

  if (response.status === 401 && !session) {
    onLost?.()
  }

  if (!response.ok)
    throw await parseError(response)

  if (response.status === 204)
    return undefined as T
  const json = await response.json()
  return json.data as T
}

/** Логин без @ — это сотрудник склада: ivan → ivan@warehouse.brillex.kz. Почта — как есть. */
export function loginToEmail(login: string) {
  const value = login.trim().toLowerCase()
  return value.includes('@') ? value : `${value}@warehouse.brillex.kz`
}

export async function login(loginOrEmail: string, password: string) {
  const response = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginToEmail(loginOrEmail), password, mode: 'json' }),
  })
  if (!response.ok)
    throw await parseError(response)
  storeTokens((await response.json()).data)
}

export async function logout() {
  const current = session
  saveSession(null)
  if (current) {
    await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refresh, mode: 'json' }),
    }).catch(() => {})
  }
}
