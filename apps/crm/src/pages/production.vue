<script setup lang="ts">
import type { Deal } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { CalendarDays, Factory } from '@lucide/vue'
import { fdate, isLate, num, units, when } from '~/utils/crm'

/**
 * Производство. Очередь цеха: «Ждут запуска» → «В работе» → «Готовы» (за 7 дней).
 * Цех видит только заказы на стадии «Производство» и что в них делать, без денег.
 */
const route = useRoute()
const crm = useCrmStore()
const session = useSessionStore()

const byDeadline = (a: Deal, b: Deal) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') || a.number - b.number
const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

const groups = computed(() => [
  { id: 'queue', name: 'Ждут запуска', deals: crm.deals.filter(d => d.stage === 'prod' && d.pr_state !== 'work' && d.pr_state !== 'done').sort(byDeadline) },
  { id: 'work', name: 'В работе', deals: crm.deals.filter(d => d.stage === 'prod' && d.pr_state === 'work').sort(byDeadline) },
  // готовые уходят в «Отгрузку», цеху она не видна — список нужен руководителю
  ...(session.isProd ? [] : [{ id: 'done', name: 'Готовы за неделю', deals: crm.deals.filter(d => d.pr_state === 'done' && (d.pr_finished_at ?? '') >= weekAgo).sort((a, b) => (b.pr_finished_at ?? '').localeCompare(a.pr_finished_at ?? '')) }]),
])
</script>

<template>
  <div :class="cn('grid gap-6 lg:gap-4', groups.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')">
    <section v-for="g in groups" :key="g.id">
      <h2 class="mb-2 flex items-center gap-2 text-sm font-bold">
        {{ g.name }}
        <span class="rounded-full bg-muted px-2 text-xs text-muted-foreground">{{ g.deals.length }}</span>
      </h2>
      <div class="grid gap-2">
        <RouterLink
          v-for="d in g.deals" :key="d.id" :to="{ path: route.path, query: { deal: d.id } }"
          :class="cn('block rounded-2xl border bg-background p-4 transition active:scale-[0.99]', g.id === 'work' && 'border-primary/40', g.id === 'done' && 'opacity-70')"
        >
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <b class="text-foreground">№{{ d.number }}</b>
            <span v-if="d.deadline" :class="cn('ml-auto flex items-center gap-1', isLate(d) && 'font-bold text-destructive')">
              <CalendarDays class="size-3.5" /> {{ isLate(d) ? 'просрочен · ' : 'до ' }}{{ fdate(d.deadline) }}
            </span>
          </div>
          <b class="mt-1 block leading-snug">{{ d.title || crm.clientName(d.client) }}</b>
          <small class="text-xs text-muted-foreground">{{ crm.clientName(d.client) }} · {{ num(units(d)) }} шт</small>
          <ul class="mt-2 space-y-0.5 text-sm text-foreground/80">
            <li v-for="i in d.items" :key="i.id" class="truncate">
              {{ i.name || 'Позиция' }} — {{ num(i.quantity) }} шт<template v-if="i.technique">
                · <span class="font-semibold">{{ i.technique }}</span>
              </template>
            </li>
          </ul>
          <small v-if="g.id === 'work' && d.pr_started_at" class="mt-2 block text-xs text-primary">в работе с {{ when(d.pr_started_at) }}</small>
          <small v-if="g.id === 'done'" class="mt-2 block text-xs text-success">готов {{ when(d.pr_finished_at) }}</small>
        </RouterLink>
        <div v-if="!g.deals.length" class="grid place-items-center gap-2 rounded-2xl border border-dashed py-10 text-sm text-muted-foreground">
          <Factory class="size-6 opacity-40" />
          Пусто
        </div>
      </div>
    </section>
  </div>
</template>

<route lang="yaml">
meta:
  title: Производство
</route>
