<script setup lang="ts">
import type { LogEntry } from '~/types/crm'
import { SendHorizontal } from '@lucide/vue'
import { api } from '~/api/directus'
import { personName, when } from '~/utils/crm'

/** История сделки (пишется сервером) и комментарии сотрудников. */
const props = defineProps<{ dealId: number }>()

const crm = useCrmStore()

const { addComment } = useDealActions()
const entries = ref<LogEntry[]>([])
const text = ref('')

async function load() {
  entries.value = await api<LogEntry[]>('/items/crm_deal_log', {
    query: { fields: 'id,text,date_created,user_created.id,user_created.first_name,user_created.last_name', filter: JSON.stringify({ deal: { _eq: props.dealId } }), sort: '-date_created', limit: 200 },
  }).catch(() => [])
}

// сделку перечитали (своя правка, оплата, живое обновление) — store подменяет объект, перечитываем историю
watch(() => [props.dealId, crm.dealById.get(props.dealId)], load, { immediate: true })

async function send() {
  const value = text.value.trim()
  if (!value)
    return
  text.value = ''
  // addComment перечитывает сделку — история обновится через watch выше
  await addComment(props.dealId, value)
}
</script>

<template>
  <section class="space-y-3">
    <form class="flex gap-2" @submit.prevent="send">
      <Input v-model="text" class="h-11" maxlength="2000" placeholder="Комментарий: о чём договорились с клиентом" />
      <Button type="submit" size="icon" class="size-11 shrink-0" aria-label="Добавить комментарий">
        <SendHorizontal />
      </Button>
    </form>
    <ol class="space-y-2">
      <li v-for="e in entries" :key="e.id" class="flex gap-3">
        <span class="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
        <div class="min-w-0 flex-1 text-sm">
          <p class="whitespace-pre-line">
            {{ e.text }}
          </p>
          <small class="text-xs text-muted-foreground">{{ when(e.date_created) }}<template v-if="e.user_created"> · {{ personName(e.user_created) }}</template></small>
        </div>
      </li>
    </ol>
  </section>
</template>
