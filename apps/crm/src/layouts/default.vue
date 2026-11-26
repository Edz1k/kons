<script setup lang="ts">
import type { Component } from 'vue'
import ProfileDialog from '@brillex/shared/components/app/ProfileDialog.vue'
import { BarChart3, Bell, ChevronRight, Factory, Inbox, KanbanSquare, LogOut, MoreHorizontal, UserRound, Users, UsersRound, Wallet } from '@lucide/vue'
import { api } from '~/api/directus'
import { initials, when } from '~/utils/crm'

/**
 * Оболочка CRM. Телефон: шапка с уведомлениями и нижнее меню (4 раздела + «Ещё»).
 * Компьютер: боковое меню. Цех видит только «Производство».
 */
interface NavItem { to: string, title: string, icon: Component, head?: boolean, prod?: boolean }

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const crm = useCrmStore()
const realtime = useRealtime()

const profileOpen = ref(false)
const moreOpen = ref(false)
const bellOpen = ref(false)

const MAIN: NavItem[] = [
  { to: '/inbox', title: 'Входящие', icon: Inbox },
  { to: '/deals', title: 'Сделки', icon: KanbanSquare },
  { to: '/production', title: 'Цех', icon: Factory, prod: true },
  { to: '/debts', title: 'Долги', icon: Wallet },
]
const MORE: NavItem[] = [
  { to: '/clients', title: 'Клиенты', icon: UsersRound },
  { to: '/stats', title: 'Сводка', icon: BarChart3, head: true },
  { to: '/staff', title: 'Сотрудники', icon: Users, head: true },
]

const main = computed(() => (session.isProd ? MAIN.filter(n => n.prod) : MAIN))
const more = computed(() => (session.isProd ? [] : MORE.filter(n => !n.head || session.isHead)))
const all = computed(() => [...main.value, ...more.value])
const isActive = (to: string) => route.path.startsWith(to)
const moreActive = computed(() => more.value.some(n => isActive(n.to)))
const badge = (to: string) => (to === '/inbox' ? crm.openLeads.length : to === '/debts' ? crm.debtors.length : to === '/production' ? crm.deals.filter(d => d.stage === 'prod' && d.pr_state !== 'done').length : 0)

function go(to: string) {
  moreOpen.value = false
  router.push(to)
}

function openNotification(id: number, deal: number | null, lead: number | null) {
  crm.markRead([id])
  bellOpen.value = false
  if (deal)
    router.push({ path: '/deals', query: { deal } })
  else if (lead)
    router.push('/inbox')
}

watch(bellOpen, (open) => {
  if (!open)
    crm.markRead(crm.unread.map(n => n.id))
})

crm.loadAll()
realtime.start()
onBeforeUnmount(realtime.stop)
</script>

<template>
  <div class="min-h-dvh lg:flex">
    <!-- компьютер: боковое меню -->
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background p-4 lg:flex">
      <div class="mb-6 px-2">
        <img src="/brillex-logo.png" alt="Brillex" class="h-6 w-auto">
        <div class="mt-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          CRM
          <span class="size-1.5 rounded-full" :class="realtime.connected.value ? 'bg-success' : 'bg-muted-foreground/40'" :title="realtime.connected.value ? 'Обновления в реальном времени' : 'Обновления раз в минуту'" />
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="n in all" :key="n.to" :to="n.to"
          class="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition"
          :class="isActive(n.to) ? 'bg-foreground text-background' : 'text-foreground/70 hover:bg-muted'"
        >
          <component :is="n.icon" class="size-4.5" />
          <span class="flex-1">{{ n.title === 'Цех' ? 'Производство' : n.title }}</span>
          <Badge v-if="badge(n.to)" class="rounded-full px-1.5">
            {{ badge(n.to) }}
          </Badge>
        </RouterLink>
      </nav>
      <button class="mt-auto flex items-center gap-3 rounded-xl p-2 text-left hover:bg-muted" type="button" @click="profileOpen = true">
        <span class="grid size-9 place-items-center rounded-full bg-foreground text-xs font-bold text-background">{{ initials(session.name) }}</span>
        <span class="min-w-0">
          <b class="block truncate text-sm">{{ session.name }}</b>
          <small class="text-xs text-muted-foreground">{{ session.roleName }}</small>
        </span>
      </button>
    </aside>

    <main class="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-10">
      <header class="sticky top-0 z-20 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div class="flex h-14 items-center gap-2 px-4 lg:h-16 lg:px-8">
          <h1 class="mr-auto truncate text-xl font-extrabold tracking-tight">
            {{ route.meta.title }}
          </h1>
          <Button v-if="!session.isProd" type="button" variant="ghost" size="icon" class="relative rounded-full" aria-label="Уведомления" @click="bellOpen = true">
            <Bell class="size-5" />
            <span v-if="crm.unread.length" class="absolute top-1 right-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-bold text-primary-foreground">{{ crm.unread.length }}</span>
          </Button>
          <button
            v-if="session.isProd"
            class="grid size-9 place-items-center rounded-full bg-foreground text-xs font-bold text-background lg:hidden"
            type="button" aria-label="Профиль" @click="profileOpen = true"
          >
            {{ initials(session.name) }}
          </button>
        </div>
      </header>
      <div class="mx-auto max-w-7xl px-4 py-4 lg:p-8">
        <RouterView />
      </div>
    </main>

    <!-- телефон: нижнее меню (у цеха один раздел — меню не нужно) -->
    <nav v-if="!session.isProd" class="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div class="grid h-16 grid-cols-5">
        <RouterLink
          v-for="n in main" :key="n.to" :to="n.to"
          class="relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold active:bg-muted"
          :class="isActive(n.to) ? 'text-foreground' : 'text-muted-foreground'"
        >
          <span class="grid h-7 w-12 place-items-center rounded-full transition" :class="isActive(n.to) && 'bg-foreground text-background'">
            <component :is="n.icon" class="size-5" />
          </span>
          {{ n.title }}
          <span v-if="badge(n.to)" class="absolute top-1.5 left-1/2 ml-3 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] leading-5 text-primary-foreground">{{ badge(n.to) }}</span>
        </RouterLink>
        <button
          type="button" class="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold active:bg-muted"
          :class="moreActive || moreOpen ? 'text-foreground' : 'text-muted-foreground'" @click="moreOpen = true"
        >
          <span class="grid h-7 w-12 place-items-center rounded-full transition" :class="moreActive && 'bg-foreground text-background'">
            <MoreHorizontal class="size-5" />
          </span>
          Ещё
        </button>
      </div>
    </nav>

    <!-- «Ещё» на телефоне -->
    <Sheet v-model:open="moreOpen">
      <SheetContent side="bottom" class="gap-0 rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)]">
        <SheetHeader class="px-5 pt-5 pb-2">
          <SheetTitle>Ещё</SheetTitle>
          <SheetDescription class="sr-only">
            Остальные разделы CRM и профиль
          </SheetDescription>
        </SheetHeader>
        <div class="px-3 pb-3">
          <button
            v-for="n in more" :key="n.to" type="button"
            class="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left text-base font-semibold active:bg-muted"
            @click="go(n.to)"
          >
            <span class="grid size-10 place-items-center rounded-xl bg-muted"><component :is="n.icon" class="size-5" /></span>
            <span class="flex-1">{{ n.title }}</span>
            <ChevronRight class="size-5 text-muted-foreground" />
          </button>
          <div class="my-2 border-t" />
          <button type="button" class="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left active:bg-muted" @click="moreOpen = false; profileOpen = true">
            <span class="grid size-10 place-items-center rounded-xl bg-foreground text-xs font-bold text-background">{{ initials(session.name) }}</span>
            <span class="min-w-0 flex-1">
              <b class="block truncate text-base">{{ session.name }}</b>
              <small class="text-xs text-muted-foreground">{{ session.roleName }} · профиль и пароль</small>
            </span>
            <UserRound class="size-5 text-muted-foreground" />
          </button>
          <button
            type="button" class="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left text-base font-semibold text-destructive active:bg-muted"
            @click="session.logout().then(() => router.replace('/login'))"
          >
            <span class="grid size-10 place-items-center rounded-xl bg-destructive/10"><LogOut class="size-5" /></span>
            Выйти
          </button>
        </div>
      </SheetContent>
    </Sheet>

    <!-- уведомления -->
    <Sheet v-model:open="bellOpen">
      <SheetContent side="right" class="w-full gap-0 p-0 sm:max-w-sm">
        <SheetHeader class="border-b p-4">
          <SheetTitle>Уведомления</SheetTitle>
          <SheetDescription class="sr-only">
            Заявки, готовые заказы и другие события
          </SheetDescription>
        </SheetHeader>
        <ul class="divide-y overflow-y-auto">
          <li v-for="item in crm.notifications" :key="item.id">
            <button type="button" class="flex w-full gap-3 px-4 py-3 text-left hover:bg-muted" @click="openNotification(item.id, item.deal, item.lead)">
              <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="item.read_at ? 'bg-transparent' : item.warn ? 'bg-warning' : 'bg-primary'" />
              <span class="min-w-0 flex-1">
                <span class="block text-sm" :class="!item.read_at && 'font-semibold'">{{ item.text }}</span>
                <small class="text-xs text-muted-foreground">{{ when(item.date_created) }}</small>
              </span>
            </button>
          </li>
          <li v-if="!crm.notifications.length" class="p-6 text-center text-sm text-muted-foreground">
            Уведомлений пока нет
          </li>
        </ul>
      </SheetContent>
    </Sheet>

    <DealSheet />
    <ProfileDialog
      v-model:open="profileOpen" :name="session.name" :role-name="session.roleName" :min-password="8"
      :change-password="password => api('/users/me', { method: 'PATCH', body: { password } })"
      :logout="() => session.logout().then(() => router.replace('/login'))"
    />
  </div>
</template>
