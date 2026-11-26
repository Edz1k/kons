/**
 * Directus для склада. Клиент общий для приложений сотрудников (@brillex/shared/directus/client);
 * здесь — только настройки склада. Токены лежат в localStorage warehouse.brillex.kz, с сайтом не пересекаются.
 */
import { createDirectusClient } from '@brillex/shared/directus/client'

export { ApiError } from '@brillex/shared/directus/client'

const DIRECTUS_URL = ((import.meta.env.VITE_DIRECTUS_URL as string | undefined) ?? 'https://cms.brillex.kz').replace(/\/+$/, '')

/** Админка Directus: ссылки «открыть товар» */
export const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`

export const { api, login, logout, loginToEmail, hasSession, onSessionLost } = createDirectusClient({
  // в разработке — через прокси vite (/directus), на Netlify — VITE_DIRECTUS_URL из netlify.toml
  baseUrl: import.meta.env.DEV ? '/directus' : DIRECTUS_URL,
  storageKey: 'brillex-sklad-session',
  loginDomain: 'warehouse.brillex.kz',
  appName: 'склада',
})
