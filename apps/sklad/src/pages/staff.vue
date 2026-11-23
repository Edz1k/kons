<script setup lang="ts">
import type { StaffUser } from '~/types/warehouse'
import { cn } from '@brillex/shared/lib/utils'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { userName, when } from '~/utils/format'

/** Сотрудники склада: админ заводит кладовщиков, меняет пароль, отключает доступ. */
const session = useSessionStore()
const { confirm } = useConfirm()

const staff = ref<StaffUser[]>([])
const passFor = ref<string | null>(null)
const newPass = ref('')

const emptyForm = () => ({ first_name: '', last_name: '', login: '', password: '', role: 'staff' as 'staff' | 'admin' })
const form = reactive(emptyForm())
const formError = ref('')

async function load() {
  try {
    staff.value = await api<StaffUser[]>('/warehouse/staff')
  }
  catch (error) {
    toast.error((error as Error).message)
  }
}
onMounted(load)

const loginOf = (u: StaffUser) => u.email.replace(/@sklad\.brillex\.kz$/, '')

async function patch(u: StaffUser, body: Record<string, unknown>, done: string) {
  try {
    await api(`/warehouse/staff/${u.id}`, { method: 'PATCH', body })
    toast.success(done)
    load()
  }
  catch (error) {
    toast.error((error as Error).message)
  }
}

async function savePassword(u: StaffUser) {
  await patch(u, { password: newPass.value }, 'Пароль изменён. Сотрудник войдёт заново.')
  passFor.value = null
  newPass.value = ''
}

async function toggle(u: StaffUser) {
  const active = u.status === 'active'
  if (active) {
    const ok = await confirm({ title: `Отключить ${userName(u)}?`, description: 'Доступ пропадёт сразу, история операций сохранится.', action: 'Отключить', danger: true })
    if (!ok)
      return
  }
  patch(u, { status: active ? 'suspended' : 'active' }, active ? 'Доступ отключён' : 'Доступ включён')
}

async function create() {
  formError.value = ''
  try {
    await api('/warehouse/staff', { method: 'POST', body: { ...form } })
    toast.success(`Добавлен. Логин: ${form.login}`)
    Object.assign(form, emptyForm())
    load()
  }
  catch (error) {
    formError.value = (error as Error).message
  }
}
</script>

<template>
  <div class="panel mb-4 overflow-hidden">
    <ul class="divide-y">
      <li v-for="u in staff" :key="u.id" :class="cn('px-4 py-3', u.status !== 'active' && 'opacity-60')">
        <div class="flex flex-wrap items-center gap-3">
          <div class="min-w-0 flex-1">
            <b class="text-sm">{{ userName(u) }}</b>
            <Badge v-if="u.id === session.me?.id" variant="secondary" class="ml-1.5 bg-primary/10 text-primary">
              это вы
            </Badge>
            <Badge v-if="u.status !== 'active'" variant="secondary" class="ml-1.5 bg-destructive/10 text-destructive">
              отключён
            </Badge>
            <small class="block text-xs text-muted-foreground">
              логин <code class="font-mono">{{ loginOf(u) }}</code> · {{ u.role === ROLE_ADMIN ? 'Админ' : 'Кладовщик' }}
              · {{ u.last_access ? `вход ${when(u.last_access)}` : 'ещё не входил' }}
            </small>
          </div>
          <Button type="button" variant="outline" size="sm" @click="passFor = passFor === u.id ? null : u.id">
            Новый пароль
          </Button>
          <Button
            v-if="u.id !== session.me?.id" type="button" variant="outline" size="sm"
            :class="u.status === 'active' && 'text-destructive hover:text-destructive'" @click="toggle(u)"
          >
            {{ u.status === 'active' ? 'Отключить' : 'Включить' }}
          </Button>
        </div>
        <form v-if="passFor === u.id" class="mt-2 flex gap-2" autocomplete="off" @submit.prevent="savePassword(u)">
          <Input v-model="newPass" type="text" :placeholder="`Новый пароль для ${userName(u)}`" maxlength="200" />
          <Button type="submit">
            Сохранить
          </Button>
        </form>
      </li>
      <li v-if="!staff.length" class="p-6 text-center text-sm text-muted-foreground">
        Сотрудников склада пока нет. Администраторы сайта входят в склад под своей почтой.
      </li>
    </ul>
  </div>

  <form class="panel space-y-3 p-4" autocomplete="off" @submit.prevent="create">
    <h2 class="font-bold">
      Новый сотрудник
    </h2>
    <p class="text-sm text-muted-foreground">
      Кладовщик проводит операции и видит остатки. Цен и стоимости склада он не видит: это закрыто на сервере.
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="space-y-1.5">
        <Label for="sf-first">Имя</Label>
        <Input id="sf-first" v-model="form.first_name" maxlength="60" placeholder="Айгуль" required />
      </div>
      <div class="space-y-1.5">
        <Label for="sf-last">Фамилия</Label>
        <Input id="sf-last" v-model="form.last_name" maxlength="60" />
      </div>
      <div class="space-y-1.5">
        <Label for="sf-login">Логин</Label>
        <Input id="sf-login" v-model="form.login" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" placeholder="aigul" required />
      </div>
      <div class="space-y-1.5">
        <Label for="sf-pass">Пароль</Label>
        <Input id="sf-pass" v-model="form.password" type="text" maxlength="200" :placeholder="form.role === 'admin' ? 'от 8 символов' : 'от 6 символов'" required />
      </div>
      <div class="space-y-1.5">
        <Label for="sf-role">Роль</Label>
        <Select v-model="form.role">
          <SelectTrigger id="sf-role" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">
              Кладовщик
            </SelectItem>
            <SelectItem value="admin">
              Админ склада
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <p v-if="formError" class="text-sm font-medium text-destructive">
      {{ formError }}
    </p>
    <Button type="submit">
      Добавить
    </Button>
  </form>
</template>

<route lang="yaml">
meta:
  title: Сотрудники
  admin: true
</route>
