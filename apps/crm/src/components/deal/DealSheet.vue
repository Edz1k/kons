<script setup lang="ts">
import type { Client, Deal, Mockup, Source } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { AlertTriangle, CalendarDays, MessageCircle, Phone, UserRound } from '@lucide/vue'
import { balance, fdate, isLate, MOCKUPS, money, phoneHref, SOURCES, STAGE_NAME, total, whatsappHref } from '~/utils/crm'

/**
 * Карточка сделки. Открывается из любого раздела по ?deal=<id> — ссылку можно переслать коллеге.
 * Телефон: снизу на весь экран. Компьютер: панель справа.
 * Цех видит позиции без цен и блок производства; менеджер и руководитель — всё.
 */
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const crm = useCrmStore()
const { patchDeal } = useDealActions()
const wide = useMediaQuery('(min-width: 1024px)')

const id = computed(() => Number(route.query.deal) || null)
const deal = computed<Deal | null>(() => (id.value ? crm.dealById.get(id.value) ?? null : null))
const client = computed(() => (deal.value?.client ? crm.clientById.get(deal.value.client) ?? null : null))
const open = computed({
  get: () => Boolean(id.value),
  set: (v) => {
    if (!v) {
      const { deal: _, ...query } = route.query
      router.replace({ query })
    }
  },
})

// сделки нет в списке (ссылка из уведомления, только что создана) — дочитываем
watch(id, async (v) => {
  if (v && crm.loaded && !crm.dealById.get(v) && !(await crm.refreshDeal(v)))
    open.value = false
}, { immediate: true })

const lostOpen = ref(false)
const clientOpen = ref(false)

function save<K extends keyof Deal>(key: K, value: Deal[K]) {
  if (deal.value && deal.value[key] !== value)
    patchDeal(deal.value.id, { [key]: value } as Partial<Deal>)
}

const pickClient = (c: Client) => save('client', c.id)
const tel = computed(() => phoneHref(client.value?.phone))
const wa = computed(() => whatsappHref(client.value?.phone))
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :side="wide ? 'right' : 'bottom'"
      :class="cn('gap-0 overflow-y-auto bg-muted p-0', wide ? 'w-full sm:max-w-xl' : 'h-[94dvh] rounded-t-3xl')"
    >
      <template v-if="deal">
        <SheetHeader class="sticky top-0 z-10 border-b bg-background/95 p-4 pr-12 backdrop-blur">
          <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            №{{ deal.number }}
            <span>·</span>
            <span>{{ STAGE_NAME[deal.stage] }}</span>
            <span v-if="!session.isProd && deal.items?.length" class="ml-auto text-sm font-black text-foreground tabular-nums">{{ money(total(deal)) }}</span>
          </div>
          <SheetTitle class="text-left text-lg leading-tight">
            <input
              v-if="!session.isProd" :value="deal.title" maxlength="200" aria-label="Название сделки"
              class="w-full bg-transparent font-extrabold outline-none placeholder:text-muted-foreground" placeholder="Название: «Худи с логотипом, 50 шт»"
              @change="e => save('title', (e.target as HTMLInputElement).value.trim())"
            >
            <template v-else>
              {{ deal.title || `Заказ №${deal.number}` }}
            </template>
          </SheetTitle>
          <SheetDescription class="text-left">
            {{ crm.clientName(deal.client) }}<template v-if="deal.deadline">
              · срок <span :class="isLate(deal) && 'font-semibold text-destructive'">{{ fdate(deal.deadline) }}</span>
            </template>
          </SheetDescription>
        </SheetHeader>

        <div class="space-y-5 p-4">
          <!-- цех -->
          <template v-if="session.isProd">
            <ProductionBlock :deal="deal" />
            <section class="space-y-2">
              <h3 class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Что делаем
              </h3>
              <DealItems :deal="deal" readonly />
            </section>
          </template>

          <template v-else>
            <StageBar :deal="deal" @lost="lostOpen = true" />

            <div v-if="deal.stage === 'lost'" class="flex gap-3 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle class="mt-0.5 size-4 shrink-0" />
              <span>
                <b>Отказ: {{ deal.lost_reason || 'без причины' }}</b>
                <span v-if="deal.lost_from"> · на стадии «{{ STAGE_NAME[deal.lost_from] }}»</span>
                <span v-if="deal.lost_note" class="block text-destructive/80">{{ deal.lost_note }}</span>
              </span>
            </div>

            <!-- клиент -->
            <section class="rounded-2xl border bg-background p-3">
              <div class="flex items-center gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                  <UserRound class="size-5 text-muted-foreground" />
                </span>
                <button type="button" class="min-w-0 flex-1 text-left" @click="clientOpen = true">
                  <b class="block truncate text-sm">{{ client?.company_name || (deal.client ? crm.clientName(deal.client) : 'Выбрать клиента') }}</b>
                  <small class="block truncate text-xs text-muted-foreground">{{ client ? [client.contact_name, client.phone].filter(Boolean).join(' · ') || 'без контактов' : 'Нажмите, чтобы выбрать или завести' }}</small>
                </button>
                <Button v-if="tel" as="a" :href="tel" variant="outline" size="icon" class="rounded-full" aria-label="Позвонить">
                  <Phone />
                </Button>
                <Button v-if="wa" as="a" :href="wa" target="_blank" rel="noopener" variant="outline" size="icon" class="rounded-full text-success" aria-label="WhatsApp">
                  <MessageCircle />
                </Button>
              </div>
              <p v-if="client?.crm_note" class="mt-2 rounded-xl bg-muted p-2.5 text-xs">
                {{ client.crm_note }}
              </p>
            </section>

            <!-- условия -->
            <section class="grid grid-cols-2 gap-2">
              <label class="space-y-1">
                <span class="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase"><CalendarDays class="size-3" /> Срок</span>
                <Input :model-value="deal.deadline ?? ''" type="date" class="h-10 bg-background" @change="(e: Event) => save('deadline', (e.target as HTMLInputElement).value || null)" />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] font-semibold text-muted-foreground uppercase">Откуда</span>
                <Select :model-value="deal.source" @update:model-value="v => save('source', v as Source)">
                  <SelectTrigger class="h-10 w-full bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="(name, key) in SOURCES" :key="key" :value="key">{{ name }}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label class="space-y-1">
                <span class="text-[11px] font-semibold text-muted-foreground uppercase">Макет</span>
                <Select :model-value="deal.mockup" @update:model-value="v => save('mockup', v as Mockup)">
                  <SelectTrigger :class="cn('h-10 w-full bg-background', MOCKUPS[deal.mockup].cls)"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="(m, key) in MOCKUPS" :key="key" :value="key">{{ m.name }}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label class="space-y-1">
                <span class="text-[11px] font-semibold text-muted-foreground uppercase">Скидка, %</span>
                <Input
                  :model-value="deal.discount || ''" inputmode="numeric" class="h-10 bg-background tabular-nums" placeholder="0"
                  @change="(e: Event) => save('discount', Math.min(50, Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0))))"
                />
              </label>
              <label v-if="session.isHead" class="col-span-2 space-y-1">
                <span class="text-[11px] font-semibold text-muted-foreground uppercase">Ответственный</span>
                <Select :model-value="deal.manager ?? 'none'" @update:model-value="v => save('manager', v === 'none' ? null : String(v))">
                  <SelectTrigger class="h-10 w-full bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не назначен</SelectItem>
                    <SelectItem v-for="u in crm.managers" :key="u.id" :value="u.id">{{ crm.staffName(u.id) }}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label class="col-span-2 flex cursor-pointer items-center gap-3 rounded-2xl border bg-background p-3 text-sm">
                <input type="checkbox" :checked="deal.no_print" class="size-5 accent-foreground" @change="(e: Event) => save('no_print', (e.target as HTMLInputElement).checked)">
                <span class="flex-1">
                  <b>Без нанесения</b>
                  <small class="block text-xs text-muted-foreground">Просто продаём товар: в цех не идёт, сразу в отгрузку</small>
                </span>
              </label>
            </section>

            <section class="space-y-2">
              <h3 class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Позиции и расчёт
              </h3>
              <DealItems :deal="deal" />
            </section>

            <section class="space-y-2">
              <h3 class="flex items-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Оплаты
                <span v-if="balance(deal) > 0 && deal.items?.length" class="ml-auto text-primary normal-case">долг {{ money(balance(deal)) }}</span>
              </h3>
              <DealPayments :deal="deal" />
            </section>

            <ProductionBlock v-if="deal.pr_state || ['prod', 'ready', 'done'].includes(deal.stage)" :deal="deal" />
          </template>

          <section class="space-y-2">
            <h3 class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              История
            </h3>
            <DealLog :deal-id="deal.id" />
          </section>

          <p class="pb-[env(safe-area-inset-bottom)] text-center text-xs text-muted-foreground">
            Создана {{ fdate(deal.date_created) }}<template v-if="!session.isProd">
              · {{ crm.staffName(deal.manager) }}
            </template>
          </p>
        </div>

        <LostDialog v-model:open="lostOpen" :deal="deal" />
        <ClientPicker v-model:open="clientOpen" @pick="pickClient" />
      </template>

      <div v-else class="grid h-40 place-items-center text-sm text-muted-foreground">
        <SheetTitle class="sr-only">
          Сделка
        </SheetTitle>
        <SheetDescription>Загружаем сделку…</SheetDescription>
      </div>
    </SheetContent>
  </Sheet>
</template>
