import type { UserModule } from '~/types'
import { initAnalytics } from '~/utils/analytics'
import { captureAttribution } from '~/utils/attribution'

// Только в браузере: источник визита для заявок + счётчики (если заданы их номера).
export const install: UserModule = ({ isClient, router }) => {
  if (!isClient)
    return

  captureAttribution()
  initAnalytics(router)
}
