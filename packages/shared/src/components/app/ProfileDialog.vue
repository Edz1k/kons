<script setup lang="ts">
/** Профиль сотрудника: смена своего пароля и выход. Общий для склада и CRM. */
import { Button } from '@brillex/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@brillex/shared/components/ui/dialog'
import { Input } from '@brillex/shared/components/ui/input'
import { Label } from '@brillex/shared/components/ui/label'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  name: string
  roleName: string
  /** минимальная длина пароля */
  minPassword: number
  changePassword: (password: string) => Promise<unknown>
  logout: () => Promise<unknown>
}>()
const open = defineModel<boolean>('open', { default: false })

const password = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value.length < props.minPassword) {
    error.value = `Пароль: минимум ${props.minPassword} символов`
    return
  }
  try {
    await props.changePassword(password.value)
    password.value = ''
    toast.success('Пароль изменён')
  }
  catch (e) {
    error.value = (e as Error).message
  }
}

async function exit() {
  await props.logout()
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ name }}</DialogTitle>
        <DialogDescription>{{ roleName }}</DialogDescription>
      </DialogHeader>
      <form class="space-y-2" autocomplete="off" @submit.prevent="submit">
        <Label for="pf-new">Новый пароль</Label>
        <Input id="pf-new" v-model="password" type="password" autocomplete="new-password" maxlength="200" />
        <p v-if="error" class="text-sm font-medium text-destructive">
          {{ error }}
        </p>
        <DialogFooter class="pt-3">
          <Button type="button" variant="ghost" class="text-destructive hover:text-destructive sm:mr-auto" @click="exit">
            Выйти
          </Button>
          <Button type="submit">
            Сменить пароль
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
