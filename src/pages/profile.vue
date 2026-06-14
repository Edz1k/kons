<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const {
  user,
  profile,
  loading,
  isAuthenticated,
  discountPercent,
} = storeToRefs(authStore)

const companyName = ref('')
const phone = ref('')
const saving = ref(false)
const saveMessage = ref('')
const localError = ref('')

const displayName = computed(() => {
  const firstName = user.value?.first_name?.trim()
  const lastName = user.value?.last_name?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  return fullName || user.value?.email || 'Клиент'
})

function syncForm() {
  companyName.value = profile.value?.company_name ?? ''
  phone.value = profile.value?.phone ?? ''
}

watch(profile, syncForm, { immediate: true })

onMounted(async () => {
  await authStore.init()

  if (!isAuthenticated.value) {
    await router.replace({
      path: '/login',
      query: { redirect: '/profile' },
    })
  }
})

async function save() {
  saving.value = true
  saveMessage.value = ''
  localError.value = ''

  try {
    await authStore.saveProfile({
      company_name: companyName.value.trim(),
      phone: phone.value.trim(),
    })
    saveMessage.value = 'Профиль обновлён'
  }
  catch (e) {
    localError.value = e instanceof Error ? e.message : 'Не удалось сохранить профиль'
  }
  finally {
    saving.value = false
  }
}

async function logout() {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<template>
  <section class="bg-white px-4 py-12 text-primary lg:px-8 md:px-6">
    <div class="mx-auto max-w-3xl">
      <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm text-secondary font-800 tracking-[0.18em] uppercase">
            Личный кабинет
          </p>
          <h1 class="mt-3 text-3xl font-900 tracking-tight md:text-4xl">
            {{ displayName }}
          </h1>
        </div>

        <button
          type="button"
          class="w-fit border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
          @click="logout"
        >
          Выйти
        </button>
      </div>

      <div
        v-if="loading"
        class="border border-slate-200 rounded-[24px] bg-white p-6 text-sm text-muted shadow-sm"
      >
        Загружаем профиль...
      </div>

      <div v-else class="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div class="border border-slate-200 rounded-[24px] bg-slate-50 p-5">
          <div class="text-sm text-slate-500">
            Ваша скидка
          </div>
          <div class="mt-2 text-4xl text-secondary font-900">
            {{ discountPercent }}%
          </div>
          <div class="mt-3 text-sm text-slate-500 leading-6">
            Скидка применяется к товарам в наличии после входа в аккаунт.
          </div>
        </div>

        <form
          class="border border-slate-200 rounded-[24px] bg-white p-5 shadow-sm md:p-6"
          @submit.prevent="save"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="text-sm text-slate-600 font-medium">Компания</span>
              <input
                v-model="companyName"
                type="text"
                class="mt-2 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                placeholder="Название компании"
              >
            </label>

            <label class="block">
              <span class="text-sm text-slate-600 font-medium">Телефон</span>
              <input
                v-model="phone"
                type="tel"
                class="mt-2 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                placeholder="+7 (700) 000-00-00"
              >
            </label>
          </div>

          <p class="mt-5 text-sm text-slate-500">
            {{ user?.email }}
          </p>

          <p
            v-if="localError"
            class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ localError }}
          </p>

          <p
            v-if="saveMessage"
            class="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {{ saveMessage }}
          </p>

          <button
            type="submit"
            class="mt-6 rounded-2xl bg-secondary px-5 py-3 text-sm text-white font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
            :disabled="saving"
          >
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<route lang="yaml">
meta:
  hideContactForm: true
</route>
