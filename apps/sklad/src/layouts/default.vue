<script setup lang="ts">
import type { Component } from 'vue'
import ProfileDialog from '@brillex/shared/components/app/ProfileDialog.vue'
import { ArrowDownUp, Barcode, ChevronRight, ClipboardCheck, ListOrdered, LogOut, MoreHorizontal, Package, UserRound, Users } from '@lucide/vue'
import { api } from '~/api/directus'
import { initials } from '~/utils/format'

/**
 * Оболочка склада. На телефоне (основной сценарий, PWA): шапка с учётом выреза экрана и нижнее меню
 * из четырёх главных разделов + «Ещё». На компьютере — боковое меню со всеми разделами.
 */
interface NavItem { to: string, title: string, icon: Component, admin?: boolean }

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const warehouse = useWarehouseStore()
const profileOpen = ref(false)
const moreOpen = ref(false)

const MAIN: NavItem[] = [
  { to: '/', title: 'Операции', icon: ArrowDownUp },
  { to: '/requests', title: 'Заявки', icon: ClipboardCheck },
  { to: '/stock', title: 'Остатки', icon: Package },
  { to: '/journal', title: 'Журнал', icon: ListOrdered },
]
const MORE: NavItem[] = [
  { to: '/labels', title: 'Этикетки', icon: Barcode },
  { to: '/staff', title: 'Сотрудники', icon: Users, admin: true },
]

const more = computed(() => MORE.filter(n => !n.admin || session.isAdmin))
const all = computed(() => [...MAIN, ...more.value])
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
const moreActive = computed(() => more.value.some(n => isActive(n.to)))
const badge = (to: string) => (to === '/requests' ? warehouse.openRequests : 0)

function go(to: string) {
  moreOpen.value = false
  router.push(to)
}

function openProfile() {
  moreOpen.value = false
  profileOpen.value = true
}

// данные склада и счётчик заявок — пока сотрудник в приложении
warehouse.load(true).catch(() => {})
warehouse.loadOverview()
warehouse.pollRequests()
useIntervalFn(warehouse.pollRequests, 20_000)
</script>

<template>
  <div class="min-h-dvh lg:flex">
    <!-- компьютер: боковое меню -->
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background p-4 lg:flex">
      <div class="mb-6 px-2">
        <img src="/brillex-logo.png" alt="Brillex" class="h-6 w-auto">
        <div class="mt-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Склад
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="n in all" :key="n.to" :to="n.to"
          class="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition"
          :class="isActive(n.to) ? 'bg-foreground text-background' : 'text-foreground/70 hover:bg-muted'"
        >
          <component :is="n.icon" class="size-4.5" />
          <span class="flex-1">{{ n.title }}</span>
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
          <div id="top-actions" class="flex items-center gap-2" />
        </div>
      </header>
      <div class="mx-auto max-w-6xl px-4 py-4 lg:p-8">
        <RouterView />
      </div>
    </main>

    <!-- телефон: нижнее меню -->
    <nav class="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div class="grid h-16 grid-cols-5">
        <RouterLink
          v-for="n in MAIN" :key="n.to" :to="n.to"
          class="relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold active:bg-muted"
          :class="isActive(n.to) ? 'text-foreground' : 'text-muted-foreground'"
        >
          <span class="grid h-7 w-12 place-items-center rounded-full transition" :class="isActive(n.to) && 'bg-foreground text-background'">
            <component :is="n.icon" class="size-5" />
          </span>
          {{ n.title }}
          <span
            v-if="badge(n.to)"
            class="absolute top-1.5 left-1/2 ml-3 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] leading-5 text-primary-foreground"
          >{{ badge(n.to) }}</span>
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
            Остальные разделы склада и профиль
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
          <button type="button" class="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left active:bg-muted" @click="openProfile">
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

    <ItemSheet />
    <ProfileDialog
      v-model:open="profileOpen" :name="session.name" :role-name="session.roleName" :min-password="session.isAdmin ? 8 : 6"
      :change-password="password => api('/users/me', { method: 'PATCH', body: { password } })"
      :logout="() => session.logout().then(() => router.replace('/login'))"
    />
  </div>
</template>
