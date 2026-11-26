<script setup lang="ts">
import type { Deal, Payment } from '~/types/crm'
import { Plus, Trash2 } from '@lucide/vue'
import { balance, fdate, money, paidPercent, personName, today } from '~/utils/crm'

/** Оплаты по сделке: внести, удалить (с записью в историю). */
const props = defineProps<{ deal: Deal }>()

const { addPayment, deletePayment } = useDealActions()
const { confirm } = useConfirm()
const crm = useCrmStore()

const adding = ref(false)
const form = reactive({ amount: '', paid_on: today(), note: '' })

function openForm() {
  Object.assign(form, { amount: balance(props.deal) > 0 ? String(balance(props.deal)) : '', paid_on: today(), note: '' })
  adding.value = true
}

async function save() {
  const amount = Number(form.amount.replace(/\s/g, '').replace(',', '.'))
  if (!(amount > 0))
    return
  await addPayment(props.deal.id, { amount, paid_on: form.paid_on, note: form.note.trim() })
  adding.value = false
}

async function remove(p: Payment) {
  if (await confirm({ title: `Удалить платёж ${money(p.amount)}?`, description: 'Удаление запишется в историю сделки.', action: 'Удалить', danger: true }))
    await deletePayment(props.deal.id, p.id)
}

const author = (p: Payment) => (typeof p.user_created === 'string' ? crm.staffName(p.user_created) : personName(p.user_created))
</script>

<template>
  <section class="space-y-2">
    <div class="h-2 overflow-hidden rounded-full bg-muted">
      <div class="h-full rounded-full bg-success transition-all" :style="{ width: `${paidPercent(deal)}%` }" />
    </div>
    <ul class="divide-y rounded-2xl border bg-background">
      <li v-for="p in deal.payments" :key="p.id" class="flex items-center gap-3 px-3 py-2.5 text-sm">
        <div class="min-w-0 flex-1">
          <b class="tabular-nums">{{ money(p.amount) }}</b>
          <span class="text-muted-foreground"> · {{ fdate(p.paid_on) }}<template v-if="p.note"> · {{ p.note }}</template></span>
          <small class="block text-xs text-muted-foreground">{{ author(p) }}</small>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" class="text-muted-foreground" aria-label="Удалить платёж" @click="remove(p)">
          <Trash2 />
        </Button>
      </li>
      <li v-if="!deal.payments?.length" class="px-3 py-2.5 text-sm text-muted-foreground">
        Оплат пока нет
      </li>
    </ul>

    <form v-if="adding" class="space-y-2 rounded-2xl border bg-background p-3" @submit.prevent="save">
      <div class="grid grid-cols-2 gap-2">
        <label class="space-y-1">
          <span class="text-[11px] font-semibold text-muted-foreground uppercase">Сумма, ₸</span>
          <Input v-model="form.amount" inputmode="decimal" class="h-10 tabular-nums" required />
        </label>
        <label class="space-y-1">
          <span class="text-[11px] font-semibold text-muted-foreground uppercase">Дата</span>
          <Input v-model="form.paid_on" type="date" class="h-10" required />
        </label>
      </div>
      <Input v-model="form.note" class="h-10" maxlength="100" placeholder="Комментарий: предоплата, наличные, Kaspi…" />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" @click="adding = false">
          Отмена
        </Button>
        <Button type="submit">
          Внести
        </Button>
      </div>
    </form>
    <Button v-else type="button" variant="outline" class="h-11 w-full rounded-2xl border-dashed" @click="openForm">
      <Plus /> Оплата
    </Button>
  </section>
</template>
