<script setup lang="ts">
import type { Stage } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { Plus, Search } from '@lucide/vue'
import { shortMoney, STAGES, total } from '~/utils/crm'

/**
 * Сделки. Компьютер — доска по стадиям; телефон — стадии вкладками и список.
 * Руководитель видит все сделки и может отфильтровать по менеджеру; менеджер — свои (так решают права Directus).
 */
const crm = useCrmStore()
const session = useSessionStore()
const wide = useMediaQuery('(min-width: 1024px)')

const q = ref('')
const manager = ref('all')
const showLost = ref(false)
const mobileStage = useLocalStorage<Stage>('crm-deals-stage', 'new')
const newDealOpen = ref(false)

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return crm.deals.filter(d =>
    (manager.value === 'all' || (manager.value === 'none' ? !d.manager : d.manager === manager.value))
    && (!term || String(d.number).includes(term) || d.title.toLowerCase().includes(term) || crm.clientName(d.client).toLowerCase().includes(term)),
  )
})

// закрытые на доске — только за последние 30 дней, остальные ищутся поиском
const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString()
const columns = computed(() => [...STAGES, ...(showLost.value ? [{ id: 'lost' as const, name: 'Отказ', short: 'Отказ', tone: 'bg-slate-500' }] : [])].map((s) => {
  const deals = filtered.value.filter(d => d.stage === s.id && (q.value || !['done', 'lost'].includes(s.id) || (d.date_updated ?? d.date_created) >= monthAgo))
  return { ...s, deals, sum: deals.reduce((a, d) => a + total(d), 0) }
}))
const mobileColumn = computed(() => columns.value.find(c => c.id === mobileStage.value) ?? columns.value[0]!)
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <div class="relative min-w-0 flex-1 sm:max-w-xs">
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="q" type="search" class="h-10 rounded-full bg-background pl-9" placeholder="Номер, название, клиент" />
    </div>
    <Select v-if="session.isHead" v-model="manager">
      <SelectTrigger class="h-10 w-44 rounded-full bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          Все менеджеры
        </SelectItem>
        <SelectItem value="none">
          Без менеджера
        </SelectItem>
        <SelectItem v-for="u in crm.managers" :key="u.id" :value="u.id">
          {{ crm.staffName(u.id) }}
        </SelectItem>
      </SelectContent>
    </Select>
    <button
      type="button" :class="cn('h-10 rounded-full border px-4 text-sm font-semibold', showLost ? 'border-transparent bg-foreground text-background' : 'bg-background text-muted-foreground')"
      @click="showLost = !showLost"
    >
      Отказы
    </button>
    <Button type="button" class="ml-auto h-10 rounded-full" @click="newDealOpen = true">
      <Plus /> Сделка
    </Button>
  </div>

  <!-- компьютер: доска -->
  <div v-if="wide" class="-mx-8 flex gap-3 overflow-x-auto px-8 pb-4">
    <section v-for="c in columns" :key="c.id" class="flex w-72 shrink-0 flex-col rounded-3xl bg-muted/60 p-2">
      <header class="flex items-center gap-2 px-2 py-2">
        <span :class="cn('size-2.5 rounded-full', c.tone)" />
        <b class="text-sm">{{ c.name }}</b>
        <span class="text-xs text-muted-foreground">{{ c.deals.length }}</span>
        <span v-if="c.sum && !session.isProd" class="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">{{ shortMoney(c.sum) }} ₸</span>
      </header>
      <div class="flex flex-col gap-2">
        <DealCard v-for="d in c.deals" :key="d.id" :deal="d" :show-manager="session.isHead" />
        <p v-if="!c.deals.length" class="px-2 py-6 text-center text-xs text-muted-foreground">
          Пусто
        </p>
      </div>
    </section>
  </div>

  <!-- телефон: вкладки стадий + список -->
  <template v-else>
    <div class="scrollbar-none -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4">
      <button
        v-for="c in columns" :key="c.id" type="button"
        :class="cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold', mobileStage === c.id ? `${c.tone} border-transparent text-white` : 'bg-background')"
        @click="mobileStage = c.id"
      >
        {{ c.short }}
        <span :class="mobileStage === c.id ? 'text-white/80' : 'text-muted-foreground'">{{ c.deals.length }}</span>
      </button>
    </div>
    <p v-if="mobileColumn.sum" class="mb-2 text-xs font-semibold text-muted-foreground">
      На сумму {{ shortMoney(mobileColumn.sum) }} ₸
    </p>
    <div class="grid gap-2 sm:grid-cols-2">
      <DealCard v-for="d in mobileColumn.deals" :key="d.id" :deal="d" :show-manager="session.isHead" />
    </div>
    <p v-if="!mobileColumn.deals.length" class="py-16 text-center text-sm text-muted-foreground">
      В «{{ mobileColumn.name }}» сделок нет
    </p>
  </template>

  <NewDealDialog v-model:open="newDealOpen" />
</template>

<route lang="yaml">
meta:
  title: Сделки
</route>
