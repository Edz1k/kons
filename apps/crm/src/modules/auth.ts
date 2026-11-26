import type { UserModule } from '~/types'
import { onSessionLost } from '~/api/directus'
import { NoCrmAccess, useSessionStore } from '~/stores/session'

/**
 * Охрана маршрутов: без входа — на /login; страницы руководителя — только ему;
 * цех видит только «Производство».
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
        if (error instanceof NoCrmAccess)
          return { path: '/login', query: { reason: 'noaccess' } }
      }
    }

    if (to.meta.public)
      return session.me ? '/' : true
    if (!session.me)
      return { path: '/login', query: to.fullPath !== '/' ? { next: to.fullPath } : {} }
    if (to.path === '/')
      return session.isProd ? '/production' : '/inbox'
    if (session.isProd && to.path !== '/production')
      return '/production'
    if (to.meta.head && !session.isHead)
      return '/inbox'
    return true
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · CRM Brillex` : 'CRM · Brillex'
  })

  onSessionLost(() => {
    useSessionStore().$reset()
    router.replace({ path: '/login', query: { reason: 'expired' } })
  })
}
