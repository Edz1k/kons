<script setup lang="ts">
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'

const open = defineModel<boolean>('open', { default: false })
const session = useSessionStore()
const router = useRouter()
const password = ref('')
const error = ref('')

async function changePassword() {
  error.value = ''
  const min = session.isAdmin ? 8 : 6
  if (password.value.length < min) {
    error.value = `Пароль: минимум ${min} символов`
    return
  }
  try {
    await api('/users/me', { method: 'PATCH', body: { password: password.value } })
    password.value = ''
    toast.success('Пароль изменён')
  }
  catch (e) {
    error.value = (e as Error).message
  }
}

async function exit() {
  await session.logout()
  open.value = false
  router.replace('/login')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ session.name }}</DialogTitle>
        <DialogDescription>{{ session.roleName }}</DialogDescription>
      </DialogHeader>
      <form class="space-y-2" autocomplete="off" @submit.prevent="changePassword">
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
