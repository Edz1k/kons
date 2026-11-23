import type { Me } from '~/types/warehouse'
import { defineStore } from 'pinia'
import { api, login as apiLogin, logout as apiLogout, hasSession } from '~/api/directus'

export const ROLE_ADMIN = 'a7cd57c2-b283-4ab5-86e0-90a1163df438' // «Склад: админ»
export const ROLE_STAFF = '3c73f9db-5f95-4680-9b81-f3cdd25faf97' // «Склад: кладовщик»

export class NoWarehouseAccess extends Error {}

/** Кто вошёл и какая у него роль на складе. Администратор Directus = админ склада. */
export const useSessionStore = defineStore('session', () => {
  const me = ref<Me | null>(null)

  const isAdmin = computed(() => me.value?.role === 'admin')
  const name = computed(() => [me.value?.first_name, me.value?.last_name].filter(Boolean).join(' ') || 'Сотрудник')
  const roleName = computed(() => (isAdmin.value ? 'Админ склада' : 'Кладовщик'))

  async function load() {
    if (!hasSession())
      return null
    const [user, globals] = await Promise.all([
      api<{ id: string, first_name: string | null, last_name: string | null, role: string | null }>('/users/me', {
        query: { fields: 'id,first_name,last_name,role' },
      }),
      api<{ admin_access: boolean }>('/policies/me/globals').catch(() => ({ admin_access: false })),
    ])
    const role = globals.admin_access || user.role === ROLE_ADMIN ? 'admin' : user.role === ROLE_STAFF ? 'staff' : null
    if (!role) {
      await apiLogout()
      throw new NoWarehouseAccess('У этой учётной записи нет доступа к складу')
    }
    me.value = { id: user.id, first_name: user.first_name, last_name: user.last_name, role }
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
    useWarehouseStore().$reset()
  }

  return { me, isAdmin, name, roleName, load, login, logout, $reset }
})
