<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const user = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

const notice = computed(() => {
  if (route.query.reason === 'expired')
    return 'Сессия закончилась. Войдите снова.'
  if (route.query.reason === 'noaccess')
    return 'У этой учётной записи нет доступа к CRM.'
  return ''
})

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await session.login(user.value, password.value)
    password.value = ''
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/'
    router.replace(next)
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="grid min-h-dvh place-items-center bg-foreground p-4">
    <form class="w-full max-w-sm rounded-3xl bg-background p-7" autocomplete="on" @submit.prevent="submit">
      <img src="/brillex-logo.png" alt="Brillex" class="h-7 w-auto">
      <h1 class="mt-5 text-2xl font-black">
        CRM
      </h1>
      <p class="mt-1 mb-5 text-sm text-muted-foreground">
        Войдите под своим логином. Руководители — под почтой от Directus.
      </p>
      <p v-if="notice" class="mb-4 rounded-xl bg-warning/10 p-3 text-sm text-warning">
        {{ notice }}
      </p>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label for="login">Логин или почта</Label>
          <Input
            id="login" v-model="user" class="h-11" type="text" autocomplete="username"
            autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="120" required
          />
        </div>
        <div class="space-y-1.5">
          <Label for="password">Пароль</Label>
          <Input id="password" v-model="password" class="h-11" type="password" autocomplete="current-password" maxlength="200" required />
        </div>
      </div>
      <p v-if="error" class="mt-3 text-sm font-medium text-destructive" role="alert">
        {{ error }}
      </p>
      <Button class="mt-6 h-12 w-full text-base" type="submit" :disabled="busy">
        {{ busy ? 'Входим…' : 'Войти' }}
      </Button>
    </form>
  </div>
</template>

<route lang="yaml">
meta:
  layout: blank
  public: true
  title: Вход
</route>
