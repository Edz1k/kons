import type { Me, Role } from '~/types/crm'
import { defineStore } from 'pinia'
import { api, login as apiLogin, logout as apiLogout, hasSession } from '~/api/directus'

export const ROLE_MANAGER = '25691c6a-7bae-425a-842d-eb6bc17de5cc' // «CRM: менеджер»
export const ROLE_PRODUCTION = '3e640e9e-04d1-47ca-80d6-ae7098a048d3' // «CRM: производство»
export const ROLE_NAME: Record<Role, string> = { head: 'Руководитель', mgr: 'Менеджер', prod: 'Производство' }

export class NoCrmAccess extends Error {}

/** Кто вошёл. Администратор Directus = руководитель CRM. */
export const useSessionStore = defineStore('session', () => {
  const me = ref<Me | null>(null)

  const role = computed(() => me.value?.role ?? null)
  const isHead = computed(() => role.value === 'head')
  const isProd = computed(() => role.value === 'prod')
  const name = computed(() => [me.value?.first_name, me.value?.last_name].filter(Boolean).join(' ') || 'Сотрудник')
  const roleName = computed(() => (role.value ? ROLE_NAME[role.value] : ''))

  async function load() {
    if (!hasSession())
      return null
    const [user, globals] = await Promise.all([
      api<{ id: string, first_name: string | null, last_name: string | null, role: string | null }>('/users/me', {
        query: { fields: 'id,first_name,last_name,role' },
      }),
      api<{ admin_access: boolean }>('/policies/me/globals').catch(() => ({ admin_access: false })),
    ])
    const r: Role | null = globals.admin_access ? 'head' : user.role === ROLE_MANAGER ? 'mgr' : user.role === ROLE_PRODUCTION ? 'prod' : null
    if (!r) {
      await apiLogout()
      throw new NoCrmAccess('У этой учётной записи нет доступа к CRM')
    }
    me.value = { id: user.id, first_name: user.first_name, last_name: user.last_name, role: r }
    return me.value
  }

  async function login(loginOrEmail: string, password: string) {
    await apiLogin(loginOrEmail, password)
    return load()
  }

  function $reset() {
    me.value = null
  }

  async function logout() {
    await apiLogout()
    $reset()
    useCrmStore().$reset()
  }

  return { me, role, isHead, isProd, name, roleName, load, login, logout, $reset }
})
