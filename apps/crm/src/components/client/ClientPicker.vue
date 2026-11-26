<script setup lang="ts">
import type { Client } from '~/types/crm'
import { Plus, Search } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'

/**
 * Выбор клиента (customer_profiles) с поиском по компании, контакту, телефону, Instagram.
 * Если не нашли — тут же заводим нового: сервер не даст завести того, кто уже закреплён за другим менеджером.
 */
const props = defineProps<{ initial?: { company?: string | null, phone?: string | null } }>()
const emit = defineEmits<{ pick: [client: Client] }>()
const open = defineModel<boolean>('open', { required: true })

const crm = useCrmStore()
const session = useSessionStore()

const q = ref('')
const creating = ref(false)
const form = reactive({ company_name: '', contact_name: '', phone: '', instagram: '' })
const error = ref('')

watch(open, (v) => {
  if (!v)
    return
  q.value = props.initial?.company ?? ''
  creating.value = false
  error.value = ''
  Object.assign(form, { company_name: props.initial?.company ?? '', contact_name: '', phone: props.initial?.phone ?? '', instagram: '' })
})

const digits = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '')
const found = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term)
    return crm.clients.slice(0, 30)
  const d = digits(term)
  return crm.clients.filter(c =>
    [c.company_name, c.contact_name, c.instagram, c.email].some(v => v?.toLowerCase().includes(term))
    || (d.length >= 4 && digits(c.phone).includes(d)),
  ).slice(0, 30)
})

function pick(c: Client) {
  emit('pick', c)
  open.value = false
}

async function create() {
  error.value = ''
  try {
    const client = await api<Client>('/items/customer_profiles', {
      method: 'POST',
      body: {
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        instagram: form.instagram.trim().replace(/^@/, '') || null,
        manager: session.isHead ? null : session.me?.id,
      },
    })
    await crm.loadClients()
    toast.success(`Клиент «${client.company_name}» добавлен`)
    pick(crm.clientById.get(client.id) ?? client)
  }
  catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ creating ? 'Новый клиент' : 'Клиент' }}</DialogTitle>
        <DialogDescription>
          {{ creating ? 'Клиент закрепится за вами. Если он уже чей-то — сервер подскажет.' : 'Те же клиенты, что и у сайта: компания, телефон, Instagram' }}
        </DialogDescription>
      </DialogHeader>

      <form v-if="creating" class="space-y-3" @submit.prevent="create">
        <Input v-model="form.company_name" class="h-11" maxlength="200" placeholder="Компания или имя клиента" required />
        <Input v-model="form.contact_name" class="h-11" maxlength="200" placeholder="Контактное лицо" />
        <div class="grid grid-cols-2 gap-2">
          <Input v-model="form.phone" class="h-11" type="tel" maxlength="60" placeholder="Телефон" />
          <Input v-model="form.instagram" class="h-11" maxlength="100" placeholder="Instagram" autocapitalize="none" />
        </div>
        <p v-if="error" class="text-sm font-medium text-destructive" role="alert">
          {{ error }}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" @click="creating = false">
            Назад к поиску
          </Button>
          <Button type="submit">
            Добавить
          </Button>
        </DialogFooter>
      </form>

      <template v-else>
        <div class="relative">
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="q" type="search" class="h-11 pl-9" placeholder="Компания, телефон, Instagram" />
        </div>
        <ul class="max-h-80 divide-y overflow-y-auto rounded-xl border">
          <li v-for="c in found" :key="c.id">
            <button type="button" class="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted" @click="pick(c)">
              <span class="min-w-0 flex-1">
                <b class="block truncate text-sm">{{ c.company_name || `Клиент #${c.id}` }}</b>
                <small class="block truncate text-xs text-muted-foreground">{{ [c.contact_name, c.phone, c.instagram && `@${c.instagram}`].filter(Boolean).join(' · ') || 'без контактов' }}</small>
              </span>
              <span v-if="c.manager && c.manager !== session.me?.id" class="shrink-0 text-xs text-muted-foreground">{{ crm.staffName(c.manager) }}</span>
            </button>
          </li>
          <li v-if="!found.length" class="px-3 py-2.5 text-sm text-muted-foreground">
            Ничего не нашлось
          </li>
        </ul>
        <Button type="button" variant="outline" class="h-11 w-full border-dashed" @click="creating = true; form.company_name ||= q.trim()">
          <Plus /> Новый клиент
        </Button>
      </template>
    </DialogContent>
  </Dialog>
</template>
