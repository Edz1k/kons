<script setup lang="ts">
/**
 * Камера-сканер. Событие code — на каждый распознанный штрихкод (один и тот же — не чаще раза в 2 с).
 * Работает только по https (и на localhost) — так устроены браузеры.
 */
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { toast } from 'vue-sonner'

const emit = defineEmits<{ code: [value: string], close: [] }>()
const elementId = `qr-${useId()}`
let scanner: Html5Qrcode | null = null

onMounted(async () => {
  if (!window.isSecureContext) {
    toast.error('Камера работает только по https')
    emit('close')
    return
  }
  scanner = new Html5Qrcode(elementId, {
    formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.QR_CODE],
    useBarCodeDetectorIfSupported: true,
    verbose: false,
  })
  let last = ''
  let lastAt = 0
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: (w, h) => ({ width: Math.min(w * 0.9, 380), height: Math.min(h * 0.45, 160) }) },
      (text) => {
        const value = text.trim()
        if (value === last && Date.now() - lastAt < 2000)
          return
        last = value
        lastAt = Date.now()
        emit('code', value)
      },
      () => {},
    )
  }
  catch {
    toast.error('Не удалось включить камеру: разрешите доступ в браузере')
    emit('close')
  }
})

onBeforeUnmount(() => {
  const s = scanner
  scanner = null
  if (s?.isScanning)
    s.stop().catch(() => {}).finally(() => s.clear())
})
</script>

<template>
  <div class="mt-3 overflow-hidden rounded-2xl border bg-black">
    <div :id="elementId" />
    <Button type="button" variant="secondary" class="h-11 w-full rounded-none" @click="emit('close')">
      Закрыть камеру
    </Button>
  </div>
</template>
