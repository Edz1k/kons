<script setup lang="ts">
/**
 * Новая версия приложения: service worker скачал её в фоне — предлагаем обновить.
 * Без спроса не перезагружаем: сотрудник может быть посреди работы.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { watch } from 'vue'
import { toast } from 'vue-sonner'

const { needRefresh, updateServiceWorker } = useRegisterSW({
  // проверяем обновление раз в час, пока приложение открыто
  onRegisteredSW(_url, registration) {
    if (registration)
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
  },
})

watch(needRefresh, (value) => {
  if (!value)
    return
  toast('Вышла новая версия', {
    duration: Infinity,
    action: { label: 'Обновить', onClick: () => updateServiceWorker(true) },
  })
})
</script>

<template>
  <span class="hidden" />
</template>
