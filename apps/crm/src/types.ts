import type { App } from 'vue'
import type { Router } from 'vue-router'

export type UserModule = (ctx: { app: App, router: Router }) => void

declare module 'vue-router' {
  interface RouteMeta {
    /** заголовок в шапке и во вкладке браузера */
    title?: string
    /** только для руководителя */
    head?: boolean
    /** доступно без входа */
    public?: boolean
    /** layout из src/layouts (по умолчанию default) */
    layout?: string
  }
}
