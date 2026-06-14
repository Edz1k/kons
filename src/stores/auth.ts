import type {
  AuthTokens,
  AuthUser,
  CustomerProfile,
  StoredAuthSession,
  UpdateCustomerProfilePayload,
} from '~/types/auth'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createCustomerProfile,
  fetchCurrentUser,
  fetchCustomerProfile,
  loginWithEmail,
  logoutFromDirectus,
  refreshAuthToken,
  registerCustomer,
  updateCustomerProfile,
} from '~/services/auth'

const STORAGE_KEY = 'brillex-auth-session'
const REFRESH_SKEW_MS = 30_000

function getClientStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function normalizeDiscount(value: unknown) {
  const numberValue = Number(value ?? 0)

  if (Number.isNaN(numberValue))
    return 0

  return Math.min(100, Math.max(0, numberValue))
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const refreshToken = ref('')
  const expiresAt = ref(0)

  const user = ref<AuthUser | null>(null)
  const profile = ref<CustomerProfile | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const discountPercent = computed(() => normalizeDiscount(profile.value?.discount_percent))
  const hasDiscount = computed(() => discountPercent.value > 0)

  function applyTokens(tokens: AuthTokens) {
    const expiresInMs = tokens.expires < 60_000
      ? tokens.expires * 1000
      : tokens.expires

    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    expiresAt.value = Date.now() + expiresInMs

    persistSession()
  }

  function persistSession() {
    const storage = getClientStorage()

    if (!storage)
      return

    if (!accessToken.value || !refreshToken.value) {
      storage.removeItem(STORAGE_KEY)
      return
    }

    const session: StoredAuthSession = {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      expiresAt: expiresAt.value,
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(session))
  }

  function restoreSession() {
    const storage = getClientStorage()
    const raw = storage?.getItem(STORAGE_KEY)

    if (!raw)
      return false

    try {
      const session = JSON.parse(raw) as StoredAuthSession

      accessToken.value = session.accessToken
      refreshToken.value = session.refreshToken
      expiresAt.value = session.expiresAt

      return Boolean(accessToken.value && refreshToken.value)
    }
    catch {
      storage?.removeItem(STORAGE_KEY)
      return false
    }
  }

  function clearSession() {
    accessToken.value = ''
    refreshToken.value = ''
    expiresAt.value = 0
    user.value = null
    profile.value = null
    error.value = ''

    getClientStorage()?.removeItem(STORAGE_KEY)
  }

  async function refreshSessionIfNeeded(force = false) {
    if (!refreshToken.value)
      return false

    if (!force && expiresAt.value - REFRESH_SKEW_MS > Date.now())
      return true

    try {
      const tokens = await refreshAuthToken(refreshToken.value)
      applyTokens(tokens)
      return true
    }
    catch {
      clearSession()
      return false
    }
  }

  async function loadProfile() {
    if (!accessToken.value || !user.value)
      return

    try {
      profile.value = await fetchCustomerProfile(accessToken.value)

      if (!profile.value)
        profile.value = await createCustomerProfile(accessToken.value, user.value.id)
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function fetchAccount() {
    if (!accessToken.value)
      return

    user.value = await fetchCurrentUser(accessToken.value)
    await loadProfile()
  }

  async function init() {
    if (initialized.value)
      return

    initialized.value = true

    if (!restoreSession())
      return

    loading.value = true
    error.value = ''

    try {
      const hasSession = await refreshSessionIfNeeded()

      if (hasSession)
        await fetchAccount()
    }
    catch (e) {
      clearSession()
      error.value = e instanceof Error ? e.message : String(e)
    }
    finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = ''

    try {
      const tokens = await loginWithEmail(email, password)
      applyTokens(tokens)
      await fetchAccount()
    }
    catch (e) {
      clearSession()
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string) {
    loading.value = true
    error.value = ''

    try {
      await registerCustomer(email, password)
      await login(email, password)
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function logout() {
    const token = refreshToken.value
    clearSession()

    if (!token)
      return

    try {
      await logoutFromDirectus(token)
    }
    catch {
      // Local logout should not be blocked by an already expired Directus session.
    }
  }

  async function saveProfile(payload: UpdateCustomerProfilePayload) {
    if (!accessToken.value || !user.value)
      throw new Error('Необходимо войти в аккаунт')

    await refreshSessionIfNeeded()

    if (!profile.value) {
      profile.value = await createCustomerProfile(accessToken.value, user.value.id, payload)
      return
    }

    await updateCustomerProfile(accessToken.value, profile.value.id, payload)
    await loadProfile()
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user,
    profile,
    loading,
    initialized,
    error,
    isAuthenticated,
    discountPercent,
    hasDiscount,
    init,
    login,
    register,
    logout,
    saveProfile,
    refreshSessionIfNeeded,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore as any, import.meta.hot))
