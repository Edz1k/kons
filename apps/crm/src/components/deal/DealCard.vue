<script setup lang="ts">
import type { Deal } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { CalendarDays, Factory } from '@lucide/vue'
import { balance, fdate, isLate, MOCKUPS, money, PR_STATES, total } from '~/utils/crm'

/** Карточка сделки в списках и на доске. Нажатие открывает DealSheet. */
const props = defineProps<{ deal: Deal, showManager?: boolean }>()

const route = useRoute()
const crm = useCrmStore()
const debt = computed(() => (props.deal.items?.length ? balance(props.deal) : 0))
</script>

<template>
  <RouterLink
    :to="{ path: route.path, query: { ...route.query, deal: deal.id } }"
    class="block rounded-2xl border bg-background p-3 transition hover:border-foreground/25 active:scale-[0.99]"
  >
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <span class="font-semibold">№{{ deal.number }}</span>
      <span v-if="deal.deadline" :class="cn('ml-auto flex items-center gap-1', isLate(deal) && 'font-semibold text-destructive')">
        <CalendarDays class="size-3" />{{ fdate(deal.deadline) }}
      </span>
    </div>
    <b class="mt-1 line-clamp-2 block text-sm leading-snug">{{ deal.title || 'Без названия' }}</b>
    <small class="block truncate text-xs text-muted-foreground">{{ crm.clientName(deal.client) }}<template v-if="showManager"> · {{ crm.staffName(deal.manager) }}</template></small>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <b v-if="deal.items?.length" class="mr-auto text-sm tabular-nums">{{ money(total(deal)) }}</b>
      <span v-if="deal.pr_state" :class="cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', PR_STATES[deal.pr_state].cls)">
        <Factory class="size-3" />{{ PR_STATES[deal.pr_state].name }}
      </span>
      <span v-if="deal.mockup !== 'none' && ['mock', 'calc'].includes(deal.stage)" :class="cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', MOCKUPS[deal.mockup].cls)">
        {{ deal.mockup === 'ok' ? 'макет ок' : 'макет ждёт' }}
      </span>
      <span v-if="debt > 0 && ['prod', 'ready', 'done'].includes(deal.stage)" class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
        долг {{ money(debt) }}
      </span>
    </div>
  </RouterLink>
</template>
