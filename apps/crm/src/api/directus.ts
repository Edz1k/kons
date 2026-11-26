/**
 * Directus для CRM. Клиент общий для приложений сотрудников (@brillex/shared/directus/client);
 * здесь — только настройки CRM. Токены лежат в localStorage crm.brillex.kz.
 */
import { createDirectusClient } from '@brillex/shared/directus/client'

export { ApiError } from '@brillex/shared/directus/client'

const DIRECTUS_URL = ((import.meta.env.VITE_DIRECTUS_URL as string | undefined) ?? 'https://cms.brillex.kz').replace(/\/+$/, '')

/** адрес API: в разработке через прокси vite, на Netlify — VITE_DIRECTUS_URL из netlify.toml */
export const API_BASE = import.meta.env.DEV ? '/directus' : DIRECTUS_URL
/** WebSocket Directus для живых обновлений */
export const WS_URL = import.meta.env.DEV
  ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/directus/websocket`
  : `${DIRECTUS_URL.replace(/^http/, 'ws')}/websocket`
/** Админка Directus: ссылки «открыть в Directus» */
export const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`

export const { api, login, logout, loginToEmail, hasSession, onSessionLost, accessToken } = createDirectusClient({
  baseUrl: API_BASE,
  storageKey: 'brillex-crm-session',
  loginDomain: 'crm.brillex.kz',
  appName: 'CRM',
})

/** Картинка из Directus (фото готового заказа) с токеном сотрудника. */
export function assetUrl(id: string | null | undefined, token: string | null, query = 'width=800&quality=80') {
  return id ? `${API_BASE}/assets/${id}?${query}${token ? `&access_token=${token}` : ''}` : ''
}
