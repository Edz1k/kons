<script setup lang="ts">
import { MessageCircle, Wallet } from '@lucide/vue'
import { balance, fdate, money, paidPercent, plural, STAGE_NAME, total, whatsappHref } from '~/utils/crm'

/** Долги: заказы в отгрузке или закрытые, где клиент не доплатил. Сверху — самые большие. */
const route = useRoute()
const crm = useCrmStore()
const session = useSessionStore()

const list = computed(() => [...crm.debtors].sort((a, b) => balance(b) - balance(a)))
const sum = computed(() => list.value.reduce((a, d) => a + balance(d), 0))
const wa = (clientId: number | null) => whatsappHref(clientId ? crm.clientById.get(clientId)?.phone : null)
</script>

<template>
  <div class="mb-4 rounded-3xl bg-foreground p-5 text-background">
    <small class="text-sm text-background/60">Клиенты должны</small>
    <p class="text-3xl font-black tabular-nums">
      {{ money(sum) }}
    </p>
    <small class="text-sm text-background/60">{{ list.length }} {{ plural(list.length, 'заказ', 'заказа', 'заказов') }} в отгрузке и закрытых</small>
  </div>

  <ul class="grid gap-2 md:grid-cols-2">
    <li v-for="d in list" :key="d.id" class="flex items-center gap-3 rounded-2xl border bg-background p-3">
      <RouterLink :to="{ path: route.path, query: { deal: d.id } }" class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          №{{ d.number }} · {{ STAGE_NAME[d.stage] }}<template v-if="session.isHead">
            · {{ crm.staffName(d.manager) }}
          </template>
          <span class="ml-auto">{{ fdate(d.date_updated ?? d.date_created) }}</span>
        </div>
        <b class="block truncate text-sm">{{ crm.clientName(d.client) }}</b>
        <div class="mt-1.5 flex items-center gap-2">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-success" :style="{ width: `${paidPercent(d)}%` }" />
          </div>
          <small class="text-xs text-muted-foreground tabular-nums">из {{ money(total(d)) }}</small>
        </div>
        <b class="mt-1 block text-primary tabular-nums">{{ money(balance(d)) }}</b>
      </RouterLink>
      <Button v-if="wa(d.client)" as="a" :href="wa(d.client)" target="_blank" rel="noopener" variant="outline" size="icon" class="shrink-0 rounded-full text-success" aria-label="Написать в WhatsApp">
        <MessageCircle />
      </Button>
    </li>
  </ul>
  <div v-if="!list.length" class="grid place-items-center gap-2 py-20 text-center text-muted-foreground">
    <Wallet class="size-10 opacity-40" />
    <p class="text-sm">
      Долгов нет
    </p>
  </div>
</template>

<route lang="yaml">
meta:
  title: Долги
</route>
