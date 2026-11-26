import type { UserModule } from '~/types'
import { createPinia } from 'pinia'

// Pinia: https://pinia.vuejs.org/ — сторы в src/stores, автоимпортируются
export const install: UserModule = ({ app }) => {
  app.use(createPinia())
}
