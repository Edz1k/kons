<script setup lang="ts">
import { cn } from '@brillex/shared/lib/utils'
import { balance, money, n, plural, SOURCES, STAGES, total } from '~/utils/crm'

/**
 * Сводка для руководителя: деньги за период, воронка, менеджеры, откуда приходят, почему теряем.
 * Деньги считаются по оплатам (что реально пришло), сделки — по дате создания.
 */
const crm = useCrmStore()

const PERIODS = [
  { id: 'month', name: 'Этот месяц' },
  { id: 'prev', name: 'Прошлый месяц' },
  { id: '90', name: '90 дней' },
] as const
const period = ref<(typeof PERIODS)[number]['id']>('month')

const range = computed(() => {
  const now = new Date()
  if (period.value === 'month')
    return [new Date(now.getFullYear(), now.getMonth(), 1), now]
  if (period.value === 'prev')
    return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)]
  return [new Date(Date.now() - 90 * 864e5), now]
})
function inRange(s: string | null | undefined) {
  if (!s)
    return false
  const d = new Date(s.length === 10 ? `${s}T12:00` : s)
  return d >= range.value[0]! && d <= range.value[1]!
}

const created = computed(() => crm.deals.filter(d => inRange(d.date_created)))
const payments = computed(() => crm.deals.flatMap(d => (d.payments ?? []).map(p => ({ ...p, manager: d.manager }))).filter(p => inRange(p.paid_on)))
const cash = computed(() => payments.value.reduce((a, p) => a + n(p.amount), 0))
const won = computed(() => created.value.filter(d => ['prod', 'ready', 'done'].includes(d.stage)))
const lost = computed(() => created.value.filter(d => d.stage === 'lost'))
const conversion = computed(() => (won.value.length + lost.value.length ? Math.round(won.value.length / (won.value.length + lost.value.length) * 100) : 0))
const debt = computed(() => crm.debtors.reduce((a, d) => a + balance(d), 0))

const funnel = computed(() => STAGES.map(s => ({ ...s, count: crm.deals.filter(d => d.stage === s.id).length, sum: crm.deals.filter(d => d.stage === s.id).reduce((a, d) => a + total(d), 0) })))
const funnelMax = computed(() => Math.max(1, ...funnel.value.map(f => f.count)))

const managers = computed(() => [...crm.managers.map(u => u.id), null].map(id => ({
  id,
  name: id ? crm.staffName(id) : 'Без менеджера',
  active: crm.deals.filter(d => d.manager === id && !['done', 'lost'].includes(d.stage)).length,
  created: created.value.filter(d => d.manager === id).length,
  won: won.value.filter(d => d.manager === id).length,
  cash: payments.value.filter(p => p.manager === id).reduce((a, p) => a + n(p.amount), 0),
})).filter(m => m.active || m.created || m.cash).sort((a, b) => b.cash - a.cash))

function count<T>(rows: T[], key: (r: T) => string) {
  const totals: Record<string, number> = {}
  for (const r of rows)
    totals[key(r)] = (totals[key(r)] ?? 0) + 1
  return Object.entries(totals).sort((a, b) => b[1] - a[1])
}
const sources = computed(() => count(created.value, d => SOURCES[d.source]))
const reasons = computed(() => count(lost.value, d => d.lost_reason || 'Без причины'))
</script>

<template>
  <div class="mb-4 inline-flex rounded-full bg-muted p-1">
    <button
      v-for="p in PERIODS" :key="p.id" type="button"
      :class="cn('h-8 rounded-full px-3 text-sm font-semibold sm:px-4', period === p.id ? 'bg-background shadow-sm' : 'text-muted-foreground')"
      @click="period = p.id"
    >
      {{ p.name }}
    </button>
  </div>

  <div class="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
    <div class="rounded-3xl bg-foreground p-4 text-background">
      <small class="text-xs text-background/60">Пришло денег</small>
      <p class="text-2xl font-black tabular-nums">
        {{ money(cash) }}
      </p>
      <small class="text-xs text-background/60">{{ payments.length }} {{ plural(payments.length, 'платёж', 'платежа', 'платежей') }}</small>
    </div>
    <div class="rounded-3xl border bg-background p-4">
      <small class="text-xs text-muted-foreground">Новых сделок</small>
      <p class="text-2xl font-black tabular-nums">
        {{ created.length }}
      </p>
      <small class="text-xs text-muted-foreground">в цех и дальше: {{ won.length }}</small>
    </div>
    <div class="rounded-3xl border bg-background p-4">
      <small class="text-xs text-muted-foreground">Конверсия</small>
      <p class="text-2xl font-black tabular-nums">
        {{ conversion }}%
      </p>
      <small class="text-xs text-muted-foreground">отказов: {{ lost.length }}</small>
    </div>
    <div class="rounded-3xl border bg-background p-4">
      <small class="text-xs text-muted-foreground">Должны сейчас</small>
      <p class="text-2xl font-black text-primary tabular-nums">
        {{ money(debt) }}
      </p>
      <small class="text-xs text-muted-foreground">{{ crm.debtors.length }} заказов</small>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    <section class="rounded-3xl border bg-background p-4">
      <h2 class="mb-3 font-bold">
        Воронка сейчас
      </h2>
      <div class="space-y-2">
        <div v-for="f in funnel" :key="f.id" class="flex items-center gap-3 text-sm">
          <span class="w-28 shrink-0 truncate text-muted-foreground">{{ f.name }}</span>
          <div class="h-6 flex-1 overflow-hidden rounded-full bg-muted">
            <div :class="cn('h-full rounded-full', f.tone)" :style="{ width: `${f.count / funnelMax * 100}%` }" />
          </div>
          <b class="w-8 text-right tabular-nums">{{ f.count }}</b>
        </div>
      </div>
    </section>

    <section class="rounded-3xl border bg-background p-4">
      <h2 class="mb-3 font-bold">
        Менеджеры
      </h2>
      <table class="w-full text-sm">
        <thead class="text-left text-xs text-muted-foreground">
          <tr>
            <th class="pb-2 font-semibold">
              Кто
            </th>
            <th class="pb-2 text-right font-semibold">
              В работе
            </th>
            <th class="pb-2 text-right font-semibold">
              Новые
            </th>
            <th class="pb-2 text-right font-semibold">
              Деньги
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="m in managers" :key="m.id ?? 'none'">
            <td class="py-2 font-semibold">
              {{ m.name }}
            </td>
            <td class="py-2 text-right tabular-nums">
              {{ m.active }}
            </td>
            <td class="py-2 text-right tabular-nums">
              {{ m.created }}<span class="text-muted-foreground"> / {{ m.won }}</span>
            </td>
            <td class="py-2 text-right font-semibold tabular-nums">
              {{ money(m.cash) }}
            </td>
          </tr>
          <tr v-if="!managers.length">
            <td colspan="4" class="py-4 text-center text-muted-foreground">
              За период пусто
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="rounded-3xl border bg-background p-4">
      <h2 class="mb-3 font-bold">
        Откуда приходят
      </h2>
      <ul class="space-y-1.5 text-sm">
        <li v-for="[name, c] in sources" :key="name" class="flex justify-between">
          <span>{{ name }}</span><b class="tabular-nums">{{ c }}</b>
        </li>
        <li v-if="!sources.length" class="text-muted-foreground">
          За период сделок нет
        </li>
      </ul>
    </section>

    <section class="rounded-3xl border bg-background p-4">
      <h2 class="mb-3 font-bold">
        Почему отказываются
      </h2>
      <ul class="space-y-1.5 text-sm">
        <li v-for="[name, c] in reasons" :key="name" class="flex justify-between">
          <span>{{ name }}</span><b class="tabular-nums">{{ c }}</b>
        </li>
        <li v-if="!reasons.length" class="text-muted-foreground">
          Отказов нет
        </li>
      </ul>
    </section>
  </div>
</template>

<route lang="yaml">
meta:
  title: Сводка
  head: true
</route>
