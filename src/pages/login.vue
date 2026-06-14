<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { loading, error, isAuthenticated } = storeToRefs(authStore)

const email = ref('')
const password = ref('')
const localError = ref('')

const redirectTo = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') ? value : '/profile'
})

onMounted(async () => {
  await authStore.init()

  if (isAuthenticated.value)
    await router.replace(redirectTo.value)
})

async function submit() {
  localError.value = ''

  if (!email.value.trim() || !password.value) {
    localError.value = 'Введите email и пароль'
    return
  }

  try {
    await authStore.login(email.value.trim(), password.value)
    await router.replace(redirectTo.value)
  }
  catch {
    localError.value = 'Не удалось войти. Проверьте email и пароль.'
  }
}
</script>

<template>
  <section class="bg-white px-4 py-12 text-primary lg:px-8 md:px-6">
    <div class="mx-auto max-w-md">
      <div class="mb-8">
        <p class="text-sm text-secondary font-800 tracking-[0.18em] uppercase">
          Аккаунт
        </p>
        <h1 class="mt-3 text-3xl font-900 tracking-tight md:text-4xl">
          Вход
        </h1>
      </div>

      <form
        class="border border-slate-200 rounded-[24px] bg-white p-5 shadow-sm md:p-6"
        @submit.prevent="submit"
      >
        <label class="block">
          <span class="text-sm text-slate-600 font-medium">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="mt-2 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10"
            placeholder="name@example.com"
          >
        </label>

        <label class="mt-4 block">
          <span class="text-sm text-slate-600 font-medium">Пароль</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="mt-2 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10"
            placeholder="Ваш пароль"
          >
        </label>

        <p
          v-if="localError || error"
          class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ localError || error }}
        </p>

        <button
          type="submit"
          class="mt-6 w-full rounded-2xl bg-secondary px-5 py-3 text-sm text-white font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
          :disabled="loading"
        >
          {{ loading ? 'Входим...' : 'Войти' }}
        </button>

        <p class="mt-5 text-center text-sm text-slate-500">
          Нет аккаунта?
          <RouterLink
            to="/register"
            class="text-secondary font-semibold hover:underline"
          >
            Зарегистрироваться
          </RouterLink>
        </p>
      </form>
    </div>
  </section>
</template>

<route lang="yaml">
meta:
  hideContactForm: true
</route>
