/**
 * Подтверждение опасного действия окном shadcn (AlertDialog) вместо системного confirm():
 *   if (!await confirm({ title: 'Отключить Айгуль?', action: 'Отключить', danger: true })) return
 * Окно одно на приложение — components/ConfirmDialog.vue в App.vue.
 */
interface ConfirmOptions {
  title: string
  description?: string
  action?: string
  danger?: boolean
}

const state = reactive({
  open: false,
  title: '',
  description: '',
  action: 'Подтвердить',
  danger: false,
})
let resolver: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(options: ConfirmOptions) {
    resolver?.(false)
    Object.assign(state, { description: '', action: 'Подтвердить', danger: false, ...options, open: true })
    return new Promise<boolean>(resolve => (resolver = resolve))
  }

  function answer(value: boolean) {
    state.open = false
    resolver?.(value)
    resolver = null
  }

  return { state: readonly(state), confirm, answer }
}
