<script setup lang="ts">
import type { Client, Lead, Source } from '~/types/crm'
import { UserRound } from '@lucide/vue'
import { api } from '~/api/directus'
import { SOURCES } from '~/utils/crm'

/**
 * Новая сделка: клиент, откуда пришёл, название. Из заявки — всё подставлено, заявка закрывается со ссылкой на сделку.
 * После создания сразу открывается карточка — там позиции и расчёт.
 */
const props = defineProps<{ lead?: Lead | null }>()
const open = defineModel<boolean>('open', { required: true })

const router = useRouter()
const route = useRoute()
const crm = useCrmStore()
const session = useSessionStore()
const { createDeal } = useDealActions()

const form = reactive({ title: '', client: null as number | null, source: 'wa' as Source })
const pickerOpen = ref(false)
const busy = ref(false)

watch(open, (v) => {
  if (!v)
    return
  const l = props.lead
  Object.assign(form, {
    title: l?.text?.split('\n')[0]?.slice(0, 120) ?? '',
    client: l?.client ?? null,
    source: l?.source ?? 'wa',
  })
})

const client = computed(() => (form.client ? crm.clientById.get(form.client) ?? null : null))
const pick = (c: Client) => (form.client = c.id)

async function submit() {
  busy.value = true
  const id = await createDeal({
    title: form.title.trim(),
    client: form.client,
    source: form.source,
    // руководитель создаёт ничью сделку или берёт себе; менеджеру сервер ставит его самого
    manager: session.me?.id ?? null,
  })
  if (id && props.lead) {
    await api(`/items/crm_leads/${props.lead.id}`, { method: 'PATCH', body: { status: 'done', deal: id, client: form.client, manager: props.lead.manager ?? session.me?.id } }).catch(() => {})
    await crm.loadLeads()
  }
  busy.value = false
  if (id) {
    open.value = false
    router.push({ path: route.path === '/inbox' ? '/deals' : route.path, query: { deal: id } })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ lead ? 'Сделка из заявки' : 'Новая сделка' }}</DialogTitle>
        <DialogDescription>Позиции, цены и оплаты — в карточке сделки после создания</DialogDescription>
      </DialogHeader>
      <form class="space-y-3" @submit.prevent="submit">
        <button type="button" class="flex w-full items-center gap-3 rounded-2xl border p-3 text-left hover:border-foreground/30" @click="pickerOpen = true">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-muted"><UserRound class="size-5 text-muted-foreground" /></span>
          <span class="min-w-0 flex-1">
            <b class="block truncate text-sm">{{ client?.company_name || 'Выбрать клиента' }}</b>
            <small class="block truncate text-xs text-muted-foreground">{{ client ? [client.contact_name, client.phone].filter(Boolean).join(' · ') : 'Найти или завести нового' }}</small>
          </span>
        </button>
        <Input v-model="form.title" class="h-11" maxlength="200" placeholder="Что заказывают: «Худи с логотипом, 50 шт»" />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(name, key) in SOURCES" :key="key" type="button"
            class="h-9 rounded-full border px-3 text-sm font-semibold transition"
            :class="form.source === key ? 'border-transparent bg-foreground text-background' : 'hover:border-foreground/30'"
            @click="form.source = key"
          >
            {{ name }}
          </button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">
            Отмена
          </Button>
          <Button type="submit" :disabled="busy">
            {{ busy ? 'Создаём…' : 'Создать' }}
          </Button>
        </DialogFooter>
      </form>
      <ClientPicker v-model:open="pickerOpen" :initial="{ company: lead?.company, phone: lead?.sender }" @pick="pick" />
    </DialogContent>
  </Dialog>
</template>
