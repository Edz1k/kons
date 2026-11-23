<script setup lang="ts">
import type { StockRequest } from '~/types/warehouse'
import { cn } from '@brillex/shared/lib/utils'
import { Check, ScanLine } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { nameOf, num, qtyText, userName, when } from '~/utils/format'

/** Заявки на выдачу по сделкам: кладовщик сканирует каждую позицию, потом списывает всё разом. */
const session = useSessionStore()
const warehouse = useWarehouseStore()
const { confirm } = useConfirm()

type Status = StockRequest['status']
const STATUS_CHIPS: [Status, string][] = [['new', 'Ждут выдачи'], ['done', 'Выданы'], ['cancelled', 'Отменены']]

const status = ref<Status>('new')
const requests = ref<StockRequest[]>([])
const loading = ref(false)
/** id заявки → отсканированные штрихкоды */
const scanned = reactive<Record<number, string[]>>({})
const codes = reactive<Record<number, string>>({})
const cameraFor = ref<number | null>(null)
const busy = ref<number | null>(null)

async function load() {
  loading.value = true
  try {
    requests.value = await api<StockRequest[]>('/items/wh_requests', {
      query: {
        fields: 'id,deal_ref,client_name,manager_name,note,status,date_created,completed_at,completed_by.first_name,completed_by.last_name,lines.id,lines.quantity,lines.variant.id,lines.variant.barcode,lines.variant.sku,lines.variant.stock,lines.variant.product.title,lines.variant.color.name',
        filter: JSON.stringify({ status: { _eq: status.value } }),
        sort: status.value === 'new' ? 'date_created' : '-date_created',
        limit: 50,
      },
    })
    if (status.value === 'new')
      warehouse.openRequests = requests.value.length
  }
  catch (error) {
    toast.error((error as Error).message)
  }
  finally {
    loading.value = false
  }
}

watch(status, load)
onMounted(load)

const isScanned = (r: StockRequest, barcode: string) => (scanned[r.id] ?? []).includes(barcode)
const allScanned = (r: StockRequest) => r.lines.every(l => isScanned(r, l.variant.barcode))
const short = (r: StockRequest, l: StockRequest['lines'][number]) => r.status === 'new' && (l.variant.stock === null || l.variant.stock < l.quantity)

function scan(r: StockRequest, raw: string) {
  const code = raw.trim().toUpperCase()
  if (!code)
    return
  const line = r.lines.find(l => l.variant.barcode.toUpperCase() === code)
  if (!line) {
    navigator.vibrate?.([80, 60, 80])
    toast.error(`${code} нет в этой заявке. Проверьте товар.`)
    return
  }
  navigator.vibrate?.(40)
  const list = scanned[r.id] ?? (scanned[r.id] = [])
  if (!list.includes(line.variant.barcode))
    list.push(line.variant.barcode)
  if (allScanned(r))
    cameraFor.value = null
}

function scanTyped(r: StockRequest) {
  scan(r, codes[r.id] ?? '')
  codes[r.id] = ''
}

async function complete(r: StockRequest) {
  busy.value = r.id
  try {
    const res = await api<{ deal_ref: string }>(`/warehouse/requests/${r.id}/complete`, { method: 'POST', body: { scanned: scanned[r.id] ?? [] } })
    delete scanned[r.id]
    toast.success(`Сделка №${res.deal_ref}: выдано, остатки на сайте обновлены`)
    warehouse.load(true)
    warehouse.afterChange()
    load()
    warehouse.pollRequests()
  }
  catch (error) {
    toast.error((error as Error).message)
    load()
  }
  finally {
    busy.value = null
  }
}

async function cancel(r: StockRequest) {
  const ok = await confirm({
    title: `Отменить заявку по сделке №${r.deal_ref}?`,
    description: 'Остатки не изменятся.',
    action: 'Отменить заявку',
    danger: true,
  })
  if (!ok)
    return
  try {
    await api(`/warehouse/requests/${r.id}/cancel`, { method: 'POST' })
    toast.success('Заявка отменена')
    load()
    warehouse.pollRequests()
  }
  catch (error) {
    toast.error((error as Error).message)
  }
}
</script>

<template>
  <div class="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
    <button v-for="[k, l] in STATUS_CHIPS" :key="k" type="button" class="chip" :data-active="status === k" @click="status = k">
      {{ l }} <i v-if="k === 'new' && warehouse.openRequests">{{ warehouse.openRequests }}</i>
    </button>
  </div>

  <div v-if="!requests.length && !loading" class="panel p-8 text-center text-sm text-muted-foreground">
    {{ status === 'new' ? 'Новых заявок нет. Они появятся, когда менеджер отправит сделку на сборку.' : 'Пусто' }}
  </div>

  <div class="space-y-3">
    <article v-for="r in requests" :key="r.id" :class="cn('panel p-4', r.status === 'new' && 'border-primary/40')">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Badge
            variant="secondary"
            :class="r.status === 'new' ? 'bg-primary/10 text-primary' : r.status === 'done' ? 'bg-success/10 text-success' : ''"
          >
            {{ r.status === 'new' ? 'ждёт выдачи' : r.status === 'done' ? 'выдано' : 'отменена' }}
          </Badge>
          <h2 class="mt-1 text-lg font-bold">
            Сделка №{{ r.deal_ref }}<template v-if="r.client_name">
              · {{ r.client_name }}
            </template>
          </h2>
          <small class="text-xs text-muted-foreground">
            <template v-if="r.manager_name">Менеджер: {{ r.manager_name }} · </template>{{ when(r.date_created) }}
            <template v-if="r.status === 'done'"> · выдал(а) {{ userName(r.completed_by) }}, {{ when(r.completed_at) }}</template>
          </small>
          <p v-if="r.note" class="mt-1 text-sm text-muted-foreground">
            {{ r.note }}
          </p>
        </div>
        <Button v-if="session.isAdmin && r.status === 'new'" type="button" variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="cancel(r)">
          Отменить
        </Button>
      </div>

      <template v-if="r.status === 'new'">
        <div class="mt-3 flex gap-2">
          <Input
            v-model="codes[r.id]" class="h-11" inputmode="search" autocomplete="off" placeholder="Сканируйте этикетку каждой позиции"
            @keydown.enter.prevent="scanTyped(r)"
          />
          <Button type="button" variant="outline" class="size-11 shrink-0" aria-label="Сканировать камерой" @click="cameraFor = cameraFor === r.id ? null : r.id">
            <ScanLine class="size-5" />
          </Button>
        </div>
        <ScanBox v-if="cameraFor === r.id" @code="scan(r, $event)" @close="cameraFor = null" />
      </template>

      <ul class="mt-3 divide-y">
        <li v-for="l in r.lines" :key="l.id" class="flex items-center gap-3 py-2.5">
          <span
            :class="cn('grid size-6 shrink-0 place-items-center rounded-full border',
                       (isScanned(r, l.variant.barcode) || r.status !== 'new') && 'border-success bg-success text-white')"
          >
            <Check v-if="isScanned(r, l.variant.barcode) || r.status !== 'new'" class="size-3.5" />
          </span>
          <span class="min-w-0 flex-1">
            <b class="block truncate text-sm">{{ nameOf(l.variant) }}</b>
            <small class="text-xs text-muted-foreground"><code class="font-mono">{{ l.variant.barcode }}</code><template v-if="r.status === 'new'"> · на складе {{ qtyText(l.variant.stock) }}</template></small>
            <Badge v-if="short(r, l)" variant="secondary" class="mt-0.5 bg-destructive/10 text-destructive">не хватает: сообщите менеджеру</Badge>
          </span>
          <b class="text-sm tabular-nums">{{ num(l.quantity) }} шт</b>
        </li>
      </ul>

      <div v-if="r.status === 'new'" class="mt-3 flex items-center justify-between gap-3">
        <span class="text-sm text-muted-foreground">Отсканировано {{ (scanned[r.id] ?? []).length }} из {{ r.lines.length }}</span>
        <Button type="button" :disabled="!allScanned(r) || busy === r.id" @click="complete(r)">
          Выдал(а), списать
        </Button>
      </div>
    </article>
  </div>
</template>

<route lang="yaml">
meta:
  title: Заявки
</route>
