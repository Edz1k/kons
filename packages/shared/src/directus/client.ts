/**
 * Клиент Directus для приложений сотрудников (склад, CRM): вход, обновление токена, понятные ошибки.
 * У каждого приложения свой ключ хранения токенов и свой домен логинов: ivan → ivan@<loginDomain>.
 */

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

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** тело как есть (FormData для загрузки файлов) */
  raw?: BodyInit
}

interface Session {
  access: string
  refresh: string
  expiresAt: number
}

export interface DirectusClientOptions {
  /** адрес API: в разработке '/directus' (прокси vite), на проде https://cms.brillex.kz */
  baseUrl: string
  /** ключ localStorage для токенов этого приложения */
  storageKey: string
  /** домен логинов сотрудников приложения: ivan → ivan@<loginDomain> */
  loginDomain: string
  /** «склада», «CRM» — для текста «Обратитесь к администратору …» */
  appName: string
}

const REFRESH_SKEW_MS = 30_000

export function createDirectusClient(options: DirectusClientOptions) {
  const { baseUrl, storageKey, loginDomain, appName } = options

  const MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Неверный логин или пароль',
    USER_SUSPENDED: `Доступ отключён. Обратитесь к администратору ${appName}`,
    FORBIDDEN: 'Нет доступа',
    TOKEN_EXPIRED: 'Сессия закончилась. Войдите снова',
    REQUESTS_EXCEEDED: 'Слишком много попыток. Подождите немного',
  }

  function readSession(): Session | null {
    try {
      const raw = localStorage.getItem(storageKey)
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
        localStorage.setItem(storageKey, JSON.stringify(next))
      else
        localStorage.removeItem(storageKey)
    }
    catch {}
  }

  async function parseError(response: Response): Promise<ApiError> {
    let json: { errors?: { message?: string, extensions?: { code?: string, details?: unknown, reason?: string } }[] } | null = null
    try {
      json = await response.json()
    }
    catch {}
    const first = json?.errors?.[0]
    const code = first?.extensions?.code ?? `HTTP_${response.status}`
    // свои ошибки расширений уже по-русски (reason у InvalidPayload); системные Directus переводим
    const message = MESSAGES[code] ?? first?.extensions?.reason ?? first?.message ?? `Ошибка сервера (${response.status})`
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
        const response = await fetch(`${baseUrl}/auth/refresh`, {
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

  function buildUrl(path: string, query?: RequestOptions['query']) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '')
        params.set(key, String(value))
    }
    const qs = params.toString()
    return `${baseUrl}${path}${qs ? `?${qs}` : ''}`
  }

  /** Запрос к Directus от имени вошедшего сотрудника. Возвращает поле data. */
  async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    if (session && session.expiresAt - REFRESH_SKEW_MS < Date.now())
      await refresh()

    const send = () => fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers: {
        ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(session ? { Authorization: `Bearer ${session.access}` } : {}),
      },
      body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
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

    if (response.status === 401 && !session)
      onLost?.()

    if (!response.ok)
      throw await parseError(response)

    if (response.status === 204)
      return undefined as T
    const json = await response.json()
    return json.data as T
  }

  /** Логин без @ — сотрудник приложения: ivan → ivan@<loginDomain>. Почта — как есть. */
  function loginToEmail(login: string) {
    const value = login.trim().toLowerCase()
    return value.includes('@') ? value : `${value}@${loginDomain}`
  }

  async function login(loginOrEmail: string, password: string) {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginToEmail(loginOrEmail), password, mode: 'json' }),
    })
    if (!response.ok)
      throw await parseError(response)
    storeTokens((await response.json()).data)
  }

  async function logout() {
    const current = session
    saveSession(null)
    if (current) {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: current.refresh, mode: 'json' }),
      }).catch(() => {})
    }
  }

  /** Свежий токен доступа (для WebSocket Directus). */
  async function accessToken() {
    if (session && session.expiresAt - REFRESH_SKEW_MS < Date.now())
      await refresh()
    return session?.access ?? null
  }

  return {
    api,
    login,
    logout,
    loginToEmail,
    accessToken,
    hasSession: () => Boolean(session),
    /** Что делать, когда сессия кончилась окончательно (refresh не прошёл). */
    onSessionLost: (fn: () => void) => {
      onLost = fn
    },
  }
}
