<script setup lang="ts">
import type { Client } from '~/types/crm'
import { MessageCircle, Phone, Plus, Search, UsersRound } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { money, phoneHref, STAGE_NAME, total, whatsappHref } from '~/utils/crm'

/**
 * Клиенты — это customer_profiles сайта: у кого есть кабинет на сайте, тот здесь тоже.
 * Менеджер видит ничьих и своих; клиент закрепляется за менеджером с первой сделкой.
 */
const crm = useCrmStore()
const session = useSessionStore()

const q = ref('')
const mine = ref(!session.isHead)
const editing = ref<Client | null>(null)
const editOpen = computed({ get: () => Boolean(editing.value), set: v => !v && (editing.value = null) })
const form = reactive({ company_name: '', contact_name: '', phone: '', instagram: '', email: '', crm_note: '', manager: 'none' })
const newOpen = ref(false)

const digits = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '')
const list = computed(() => {
  const term = q.value.trim().toLowerCase()
  const d = digits(term)
  return crm.clients.filter(c =>
    (!mine.value || c.manager === session.me?.id)
    && (!term || [c.company_name, c.contact_name, c.instagram, c.email].some(v => v?.toLowerCase().includes(term)) || (d.length >= 4 && digits(c.phone).includes(d))),
  ).slice(0, 200)
})

const dealsOf = (id: number) => crm.deals.filter(d => d.client === id)

function edit(c: Client) {
  editing.value = c
  Object.assign(form, {
    company_name: c.company_name ?? '',
    contact_name: c.contact_name ?? '',
    phone: c.phone ?? '',
    instagram: c.instagram ?? '',
    email: c.email ?? '',
    crm_note: c.crm_note ?? '',
    manager: c.manager ?? 'none',
  })
}

async function save() {
  const c = editing.value
  if (!c)
    return
  try {
    await api(`/items/customer_profiles/${c.id}`, {
      method: 'PATCH',
      body: {
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        instagram: form.instagram.trim().replace(/^@/, '') || null,
        email: form.email.trim() || null,
        crm_note: form.crm_note.trim() || null,
        ...(session.isHead ? { manager: form.manager === 'none' ? null : form.manager } : {}),
      },
    })
    toast.success('Сохранено')
    editing.value = null
    await crm.loadClients()
  }
  catch (error) {
    toast.error((error as Error).message)
  }
}
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <div class="relative min-w-0 flex-1 sm:max-w-sm">
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="q" type="search" class="h-10 rounded-full bg-background pl-9" placeholder="Компания, телефон, Instagram" />
    </div>
    <div class="inline-flex rounded-full bg-muted p-1">
      <button type="button" class="h-8 rounded-full px-4 text-sm font-semibold" :class="mine ? 'bg-background shadow-sm' : 'text-muted-foreground'" @click="mine = true">
        Мои
      </button>
      <button type="button" class="h-8 rounded-full px-4 text-sm font-semibold" :class="!mine ? 'bg-background shadow-sm' : 'text-muted-foreground'" @click="mine = false">
        Все
      </button>
    </div>
    <Button type="button" class="ml-auto h-10 rounded-full" @click="newOpen = true">
      <Plus /> Клиент
    </Button>
  </div>

  <ul class="divide-y overflow-hidden rounded-2xl border bg-background">
    <li v-for="c in list" :key="c.id" class="flex items-center gap-3 px-4 py-3">
      <button type="button" class="min-w-0 flex-1 text-left" @click="edit(c)">
        <b class="block truncate text-sm">{{ c.company_name || `Клиент #${c.id}` }}</b>
        <small class="block truncate text-xs text-muted-foreground">
          {{ [c.contact_name, c.phone, c.instagram && `@${c.instagram}`].filter(Boolean).join(' · ') || 'без контактов' }}
          <template v-if="c.manager"> · {{ c.manager === session.me?.id ? 'ваш' : crm.staffName(c.manager) }}</template>
          <template v-if="dealsOf(c.id).length"> · {{ dealsOf(c.id).length }} сд.</template>
        </small>
      </button>
      <Button v-if="phoneHref(c.phone)" as="a" :href="phoneHref(c.phone)" variant="ghost" size="icon" class="rounded-full" aria-label="Позвонить">
        <Phone />
      </Button>
      <Button v-if="whatsappHref(c.phone)" as="a" :href="whatsappHref(c.phone)" target="_blank" rel="noopener" variant="ghost" size="icon" class="rounded-full text-success" aria-label="WhatsApp">
        <MessageCircle />
      </Button>
    </li>
    <li v-if="!list.length" class="grid place-items-center gap-2 py-16 text-center text-sm text-muted-foreground">
      <UsersRound class="size-8 opacity-40" />
      {{ mine && !q ? 'За вами пока нет клиентов — они закрепляются с первой сделкой' : 'Никого не нашли' }}
    </li>
  </ul>

  <Dialog v-model:open="editOpen">
    <DialogContent v-if="editing" class="max-h-[92dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editing.company_name || 'Клиент' }}</DialogTitle>
        <DialogDescription>{{ editing.user ? 'Есть кабинет на сайте' : 'Только в CRM' }} · скидка на сайте {{ editing.discount_percent }}%</DialogDescription>
      </DialogHeader>
      <form class="space-y-3" @submit.prevent="save">
        <Input v-model="form.company_name" class="h-11" maxlength="200" placeholder="Компания или имя" required />
        <Input v-model="form.contact_name" class="h-11" maxlength="200" placeholder="Контактное лицо" />
        <div class="grid grid-cols-2 gap-2">
          <Input v-model="form.phone" class="h-11" type="tel" maxlength="60" placeholder="Телефон" />
          <Input v-model="form.instagram" class="h-11" maxlength="100" placeholder="Instagram" autocapitalize="none" />
        </div>
        <Input v-model="form.email" class="h-11" type="email" maxlength="200" placeholder="Почта" />
        <Textarea v-model="form.crm_note" maxlength="2000" placeholder="Заметка: как общаться, реквизиты, что любит" />
        <Select v-if="session.isHead" v-model="form.manager">
          <SelectTrigger class="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              Ничей
            </SelectItem>
            <SelectItem v-for="u in crm.managers" :key="u.id" :value="u.id">
              {{ crm.staffName(u.id) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div v-if="dealsOf(editing.id).length" class="space-y-1">
          <h3 class="text-xs font-bold text-muted-foreground uppercase">
            Сделки
          </h3>
          <RouterLink
            v-for="d in dealsOf(editing.id)" :key="d.id" :to="{ path: '/deals', query: { deal: d.id } }"
            class="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-muted" @click="editing = null"
          >
            <span class="text-muted-foreground">№{{ d.number }}</span>
            <span class="min-w-0 flex-1 truncate">{{ d.title || 'Без названия' }}</span>
            <small class="text-xs text-muted-foreground">{{ STAGE_NAME[d.stage] }}</small>
            <b class="text-xs tabular-nums">{{ money(total(d)) }}</b>
          </RouterLink>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="editing = null">
            Отмена
          </Button>
          <Button type="submit">
            Сохранить
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <ClientPicker v-model:open="newOpen" @pick="edit" />
</template>

<route lang="yaml">
meta:
  title: Клиенты
</route>
