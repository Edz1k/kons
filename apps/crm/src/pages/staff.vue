<script setup lang="ts">
import type { Staff } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { toast } from 'vue-sonner'
import { api, loginToEmail } from '~/api/directus'
import { personName, when } from '~/utils/crm'

/**
 * Сотрудники CRM. Руководитель (администратор Directus) заводит менеджеров и цех:
 * логин превращается в почту login@crm.brillex.kz, роль — «CRM: менеджер» или «CRM: производство».
 */
const session = useSessionStore()
const crm = useCrmStore()
const { confirm } = useConfirm()

const ROLES = [
  { id: ROLE_MANAGER, name: 'Менеджер', hint: 'Свои заявки, сделки, клиенты и оплаты' },
  { id: ROLE_PRODUCTION, name: 'Производство', hint: 'Только заказы в цеху, без денег' },
]
const roleName = (id: string | null) => ROLES.find(r => r.id === id)?.name ?? 'Руководитель'

const staff = ref<Staff[]>([])
const passFor = ref<string | null>(null)
const newPass = ref('')
const emptyForm = () => ({ first_name: '', last_name: '', login: '', password: '', role: ROLE_MANAGER })
const form = reactive(emptyForm())
const formError = ref('')

async function load() {
  staff.value = await api<Staff[]>('/users', {
    query: { fields: 'id,first_name,last_name,email,role,status,last_access', filter: JSON.stringify({ role: { _in: ROLES.map(r => r.id) } }), sort: 'first_name', limit: -1 },
  }).catch((error) => {
    toast.error((error as Error).message)
    return []
  })
}
onMounted(load)

const loginOf = (u: Staff) => u.email?.replace(/@crm\.brillex\.kz$/, '') ?? ''

async function patch(u: Staff, body: Record<string, unknown>, done: string) {
  try {
    await api(`/users/${u.id}`, { method: 'PATCH', body })
    toast.success(done)
    await Promise.all([load(), crm.loadStaff()])
  }
  catch (error) {
    toast.error((error as Error).message)
  }
}

async function savePassword(u: Staff) {
  if (newPass.value.length < 8)
    return toast.error('Пароль — от 8 символов')
  await patch(u, { password: newPass.value }, 'Пароль изменён')
  passFor.value = null
  newPass.value = ''
}

async function toggle(u: Staff) {
  const active = u.status === 'active'
  if (active && !(await confirm({ title: `Отключить ${personName(u)}?`, description: 'Доступ пропадёт сразу. Сделки и история останутся — передайте их другому менеджеру в карточках.', action: 'Отключить', danger: true })))
    return
  patch(u, { status: active ? 'suspended' : 'active' }, active ? 'Доступ отключён' : 'Доступ включён')
}

async function create() {
  formError.value = ''
  const login = form.login.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,40}$/.test(login))
    return (formError.value = 'Логин — латиница, цифры, точка или дефис, от 3 символов')
  if (form.password.length < 8)
    return (formError.value = 'Пароль — от 8 символов')
  try {
    await api('/users', {
      method: 'POST',
      body: { first_name: form.first_name.trim(), last_name: form.last_name.trim() || null, email: loginToEmail(login), password: form.password, role: form.role, status: 'active' },
    })
    toast.success(`Добавлен. Логин: ${login}`)
    Object.assign(form, emptyForm())
    await Promise.all([load(), crm.loadStaff()])
  }
  catch (error) {
    formError.value = (error as Error).message
  }
}
</script>

<template>
  <div class="mb-4 overflow-hidden rounded-2xl border bg-background">
    <ul class="divide-y">
      <li v-for="u in staff" :key="u.id" :class="cn('px-4 py-3', u.status !== 'active' && 'opacity-60')">
        <div class="flex flex-wrap items-center gap-3">
          <div class="min-w-0 flex-1">
            <b class="text-sm">{{ personName(u) }}</b>
            <Badge variant="secondary" class="ml-1.5">
              {{ roleName(u.role) }}
            </Badge>
            <Badge v-if="u.status !== 'active'" variant="secondary" class="ml-1.5 bg-destructive/10 text-destructive">
              отключён
            </Badge>
            <small class="block text-xs text-muted-foreground">
              логин <code class="font-mono">{{ loginOf(u) }}</code> · {{ u.last_access ? `вход ${when(u.last_access)}` : 'ещё не входил' }}
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
          <Input v-model="newPass" type="text" :placeholder="`Новый пароль для ${personName(u)}`" maxlength="200" />
          <Button type="submit">
            Сохранить
          </Button>
        </form>
      </li>
      <li v-if="!staff.length" class="p-6 text-center text-sm text-muted-foreground">
        Сотрудников CRM пока нет. Администраторы Directus входят как руководители под своей почтой.
      </li>
    </ul>
  </div>

  <form class="space-y-3 rounded-2xl border bg-background p-4" autocomplete="off" @submit.prevent="create">
    <h2 class="font-bold">
      Новый сотрудник
    </h2>
    <div class="grid gap-2 sm:grid-cols-2">
      <button
        v-for="r in ROLES" :key="r.id" type="button"
        :class="cn('rounded-2xl border p-3 text-left transition', form.role === r.id ? 'border-foreground ring-1 ring-foreground' : 'hover:border-foreground/30')"
        @click="form.role = r.id"
      >
        <b class="block text-sm">{{ r.name }}</b>
        <small class="text-xs text-muted-foreground">{{ r.hint }}</small>
      </button>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="space-y-1.5">
        <Label for="cf-first">Имя</Label>
        <Input id="cf-first" v-model="form.first_name" maxlength="60" placeholder="Айгуль" required />
      </div>
      <div class="space-y-1.5">
        <Label for="cf-last">Фамилия</Label>
        <Input id="cf-last" v-model="form.last_name" maxlength="60" />
      </div>
      <div class="space-y-1.5">
        <Label for="cf-login">Логин</Label>
        <Input id="cf-login" v-model="form.login" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" placeholder="aigul" required />
      </div>
      <div class="space-y-1.5">
        <Label for="cf-pass">Пароль</Label>
        <Input id="cf-pass" v-model="form.password" type="text" maxlength="200" placeholder="от 8 символов" required />
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
  head: true
</route>
