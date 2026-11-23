import type { UserModule } from '~/types'
import { onSessionLost } from '~/api/directus'
import { NoWarehouseAccess, useSessionStore } from '~/stores/session'

/**
 * Охрана маршрутов: без входа — на /login, страницы админа — только админу склада.
 * Кто вошёл, проверяем один раз при открытии приложения (токен лежит в localStorage).
 */
export const install: UserModule = ({ router }) => {
  let checked = false

  router.beforeEach(async (to) => {
    const session = useSessionStore()

    if (!checked) {
      checked = true
      try {
        await session.load()
      }
      catch (error) {
        if (error instanceof NoWarehouseAccess)
          return { path: '/login', query: { reason: 'noaccess' } }
      }
    }

    if (to.meta.public)
      return session.me ? '/' : true
    if (!session.me)
      return { path: '/login', query: to.fullPath !== '/' ? { next: to.fullPath } : {} }
    if (to.meta.admin && !session.isAdmin)
      return '/'
    return true
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · Склад Brillex` : 'Склад · Brillex'
  })

  onSessionLost(() => {
    useSessionStore().$reset()
    router.replace({ path: '/login', query: { reason: 'expired' } })
  })
}
