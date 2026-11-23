<script setup lang="ts">
import type { Movement, StaffUser } from '~/types/warehouse'
import { cn } from '@brillex/shared/lib/utils'
import { Download, Search } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { downloadCsv, isCorrection, isMinus, nameOf, num, OP, qtyText, today, userName, when } from '~/utils/format'

/** Журнал операций: фильтры, поиск, отмена ошибочной операции (админ), выгрузка. */
const ui = useUiStore()
const session = useSessionStore()
const warehouse = useWarehouseStore()

type TypeFilter = 'all' | 'receipt' | 'issue' | 'return' | 'correction'
const TYPE_CHIPS: [TypeFilter, string][] = [['all', 'Все'], ['receipt', 'Приход'], ['issue', 'Списание'], ['return', 'Возврат'], ['correction', 'Отмены и корректировки']]

const rows = ref<Movement[]>([])
const type = ref<TypeFilter>('all')
const q = ref('')
const userId = ref('all')
const staff = ref<StaffUser[]>([])
const loading = ref(false)

function buildFilter() {
  const and: Record<string, unknown>[] = []
  if (type.value === 'correction')
    and.push({ type: { _in: ['cancel_in', 'cancel_out', 'adjust_in', 'adjust_out'] } })
  else if (type.value !== 'all')
    and.push({ type: { _eq: type.value } })
  if (userId.value !== 'all')
    and.push({ user_created: { _eq: userId.value } })
  const term = q.value.trim()
  if (term) {
    and.push({
      _or: [
        { note: { _icontains: term } },
        { deal_ref: { _icontains: term } },
        { variant: { barcode: { _icontains: term } } },
        { variant: { sku: { _icontains: term } } },
        { variant: { product: { title: { _icontains: term } } } },
        { variant: { color: { name: { _icontains: term } } } },
      ],
    })
  }
  return and.length ? JSON.stringify({ _and: and }) : undefined
}

async function load() {
  loading.value = true
  try {
    const list = await api<Movement[]>('/items/wh_movements', {
      query: {
        fields: 'id,type,quantity,balance_after,note,deal_ref,reverses,date_created,variant.id,variant.barcode,variant.sku,variant.product.title,variant.color.name,user_created.id,user_created.first_name,user_created.last_name',
        filter: buildFilter(),
        sort: '-date_created',
        limit: 200,
      },
    })
    // какие из показанных уже отменены
    const ids = list.map(m => m.id)
    const reversers = ids.length
      ? await api<{ reverses: number }[]>('/items/wh_movements', { query: { fields: 'reverses', filter: JSON.stringify({ reverses: { _in: ids } }), limit: -1 } })
      : []
    const cancelled = new Set(reversers.map(r => r.reverses))
    rows.value = list.map(m => ({ ...m, cancelled: cancelled.has(m.id) }))
  }
  catch (error) {
    toast.error((error as Error).message)
  }
  finally {
    loading.value = false
  }
}

watch([type, userId], load)
watchDebounced(q, load, { debounce: 300 })

onMounted(async () => {
  load()
  if (session.isAdmin)
    staff.value = await api<StaffUser[]>('/warehouse/staff').catch(() => [])
})

function exportCsv() {
  downloadCsv(`sklad-zhurnal-${today()}.csv`, [
    ['Дата', 'Операция', 'Штрихкод', 'Товар', 'Количество', 'Остаток после', 'Комментарий', 'Сотрудник', 'Сделка'],
    ...rows.value.map(m => [
      new Date(m.date_created).toLocaleString('ru-RU'),
      OP[m.type].name,
      m.variant.barcode,
      nameOf(m.variant),
      (isMinus(m.type) ? -1 : 1) * m.quantity,
      m.balance_after,
      m.note,
      userName(m.user_created),
      m.deal_ref,
    ]),
  ])
}

// ── отмена (админ) ─────────────────────────────────────────────────────
const cancelling = ref<Movement | null>(null)
const cancelOpen = computed({
  get: () => Boolean(cancelling.value),
  set: value => !value && (cancelling.value = null),
})
const reason = ref('')
const cancelError = ref('')

async function confirmCancel() {
  const m = cancelling.value
  if (!m)
    return
  cancelError.value = ''
  try {
    const r = await api<{ barcode: string, stock: number }>(`/warehouse/movements/${m.id}/cancel`, { method: 'POST', body: { reason: reason.value } })
    warehouse.patch(r.barcode, { stock: r.stock })
    cancelling.value = null
    reason.value = ''
    toast.success(`Отменено. Остаток: ${qtyText(r.stock)}`)
    load()
    warehouse.afterChange()
  }
  catch (error) {
    cancelError.value = (error as Error).message
  }
}
</script>

<template>
  <Teleport defer to="#top-actions">
    <Button v-if="session.isAdmin" type="button" variant="outline" size="sm" class="hidden sm:inline-flex" @click="exportCsv">
      <Download /> Excel
    </Button>
  </Teleport>

  <div class="mb-3 flex flex-col gap-2 sm:flex-row">
    <div class="relative flex-1">
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="q" type="search" class="h-11 bg-background pl-9" placeholder="Товар, штрихкод, сделка, комментарий" aria-label="Поиск по журналу" />
    </div>
    <Select v-if="session.isAdmin" v-model="userId">
      <SelectTrigger class="h-11 bg-background sm:w-56" aria-label="Сотрудник">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          Все сотрудники
        </SelectItem>
        <SelectItem v-for="u in staff" :key="u.id" :value="u.id">
          {{ userName(u) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div class="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
    <button v-for="[k, l] in TYPE_CHIPS" :key="k" type="button" class="chip" :data-active="type === k" @click="type = k">
      {{ l }}
    </button>
  </div>

  <div class="panel overflow-hidden">
    <ul class="divide-y">
      <li v-for="m in rows" :key="m.id" :class="cn('flex items-start gap-3 px-4 py-3', m.cancelled && 'opacity-50')">
        <div class="min-w-0 flex-1 cursor-pointer" @click="ui.openItem(m.variant.barcode)">
          <div class="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              :class="isCorrection(m.type) ? '' : isMinus(m.type) ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'"
            >
              {{ OP[m.type].name }}
            </Badge>
            <Badge v-if="m.cancelled" variant="outline">
              отменена
            </Badge>
            <Badge v-if="m.deal_ref" variant="outline">
              сделка №{{ m.deal_ref }}
            </Badge>
          </div>
          <b class="mt-1 block truncate text-sm">{{ nameOf(m.variant) }}</b>
          <small class="block text-xs text-muted-foreground"><code class="font-mono">{{ m.variant.barcode }}</code> · {{ when(m.date_created) }} · {{ userName(m.user_created) }}</small>
          <small v-if="m.note" class="block text-xs text-muted-foreground">{{ m.note }}</small>
        </div>
        <div class="flex flex-col items-end gap-1">
          <b class="tabular-nums" :class="isMinus(m.type) ? 'text-destructive' : 'text-success'">{{ OP[m.type].sign }}{{ num(m.quantity) }}</b>
          <small v-if="m.balance_after !== null" class="text-xs text-muted-foreground">ост. {{ num(m.balance_after) }}</small>
          <Button
            v-if="session.isAdmin && !m.cancelled && !m.type.startsWith('cancel_')"
            type="button" variant="outline" size="xs" @click="cancelling = m"
          >
            Отменить
          </Button>
        </div>
      </li>
      <li v-if="!rows.length && !loading" class="p-6 text-center text-sm text-muted-foreground">
        Записей нет
      </li>
    </ul>
  </div>
  <p class="mt-2 text-sm text-muted-foreground">
    Показаны последние 200 записей по фильтру.
  </p>

  <Dialog v-model:open="cancelOpen">
    <DialogContent v-if="cancelling" class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Отменить операцию?</DialogTitle>
        <DialogDescription>
          {{ OP[cancelling.type].name }} {{ OP[cancelling.type].sign }}{{ num(cancelling.quantity) }} шт · {{ nameOf(cancelling.variant) }}
          · {{ when(cancelling.date_created) }} · {{ userName(cancelling.user_created) }}.
          Операция не удаляется: в журнал добавится отмена с обратным знаком, остаток вернётся, сайт обновится.
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-3" autocomplete="off" @submit.prevent="confirmCancel">
        <div class="space-y-1.5">
          <Label for="cn-reason">Причина</Label>
          <Input id="cn-reason" v-model="reason" maxlength="300" placeholder="Например: списали 50 вместо 5" required />
        </div>
        <p v-if="cancelError" class="text-sm font-medium text-destructive">
          {{ cancelError }}
        </p>
        <DialogFooter class="pt-2">
          <Button type="button" variant="outline" @click="cancelling = null">
            Не отменять
          </Button>
          <Button type="submit" variant="destructive">
            Отменить операцию
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<route lang="yaml">
meta:
  title: Журнал
</route>
