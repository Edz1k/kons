<script setup lang="ts">
import type { Component } from 'vue'
import type { Movement, OpType, Variant } from '~/types/warehouse'
import { cn } from '@brillex/shared/lib/utils'
import { Minus, Plus, ScanLine, Search, Undo2 } from '@lucide/vue'
import { api, ApiError } from '~/api/directus'
import { art, isMinus, matches, nameOf, num, OP, OP_FORM, qtyText, stockState, userName, when } from '~/utils/format'

/** Операции: приход, списание, возврат по штрихкоду (сканер или поиск). */
const ui = useUiStore()
const warehouse = useWarehouseStore()

const TYPES: { id: OpType, label: string, icon: Component }[] = [
  { id: 'receipt', label: 'Приход', icon: Plus },
  { id: 'issue', label: 'Списание', icon: Minus },
  { id: 'return', label: 'Возврат', icon: Undo2 },
]
/** быстрые прибавки к количеству: на приходе пачки по 10–100 штук */
const STEPS = [10, 50, 100]

const type = ref<OpType>('receipt')
const code = ref('')
const picked = ref<Variant | null>(null)
const qty = ref(1)
const note = ref('')
const scanning = ref(false)
const submitting = ref(false)
const result = ref<{ ok: boolean, title: string, text: string } | null>(null)
const sugIndex = ref(-1)
const recent = ref<Movement[]>([])
const codeInput = useTemplateRef<{ $el: HTMLInputElement }>('codeInput')
const qtyInput = useTemplateRef<HTMLInputElement>('qtyInput')

const suggestions = computed(() => (code.value.trim().length < 2 ? [] : warehouse.variants.filter(v => matches(v, code.value)).slice(0, 6)))
const pickedState = computed(() => (picked.value ? stockState(picked.value) : null))
const submitLabel = computed(() => `${OP_FORM[type.value].verb} · ${num(qty.value || 0)} шт`)

watch(code, () => (sugIndex.value = -1))

/** На компьютере сразу ставим курсор в поиск (сканер-пистолет печатает туда). На телефоне — нет, чтобы не выскакивала клавиатура. */
const desktop = useMediaQuery('(min-width: 1024px)')
function focusCode() {
  if (desktop.value)
    nextTick(() => codeInput.value?.$el.focus())
}

function vibrate(pattern: number | number[] = 40) {
  try {
    navigator.vibrate?.(pattern)
  }
  catch {}
}

function pick(item: Variant) {
  picked.value = item
  code.value = ''
  result.value = null
  qty.value = 1
  note.value = ''
  scanning.value = false
  if (desktop.value) {
    nextTick(() => {
      qtyInput.value?.focus()
      qtyInput.value?.select()
    })
  }
}

function unpick() {
  picked.value = null
  focusCode()
}

/** Штрихкод со сканера или руками: точное совпадение, иначе единственный найденный. */
function resolveCode(raw: string) {
  const value = raw.trim()
  if (!value)
    return
  const exact = warehouse.byBarcode(value)
  const found = exact ? [exact] : warehouse.variants.filter(v => matches(v, value)).slice(0, 2)
  if (found.length === 1) {
    vibrate()
    pick(found[0])
  }
  else {
    vibrate([80, 60, 80])
    result.value = { ok: false, title: `Не нашли «${value}»`, text: 'Проверьте штрихкод или поищите по названию.' }
  }
}

function onCodeKey(e: KeyboardEvent) {
  const list = suggestions.value
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.length) {
    e.preventDefault()
    sugIndex.value = (sugIndex.value + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (sugIndex.value >= 0 && list[sugIndex.value])
      pick(list[sugIndex.value])
    else
      resolveCode(code.value)
  }
}

async function submit() {
  const item = picked.value
  if (!item || submitting.value)
    return
  if (!Number.isInteger(qty.value) || qty.value <= 0) {
    result.value = { ok: false, title: 'Не проведено', text: 'Количество — целое число больше нуля' }
    return
  }
  submitting.value = true
  const opType = type.value
  const amount = qty.value
  try {
    const r = await api<{ stock: number }>('/warehouse/movements', {
      method: 'POST',
      body: { barcode: item.barcode, type: opType, quantity: amount, note: note.value },
    })
    warehouse.patch(item.barcode, { stock: r.stock })
    vibrate()
    picked.value = null
    result.value = {
      ok: true,
      title: `${OP[opType].name} ${OP[opType].sign}${num(amount)} шт · ${nameOf(item)}`,
      text: `Остаток теперь: ${qtyText(r.stock)} — на сайте тоже`,
    }
    loadRecent()
    warehouse.afterChange()
    focusCode()
  }
  catch (error) {
    result.value = { ok: false, title: 'Не проведено', text: (error as Error).message }
    if (error instanceof ApiError && (error.code === 'INSUFFICIENT_STOCK' || error.code === 'UNKNOWN_STOCK')) {
      const available = (error.details as { available?: number } | undefined)?.available
      if (available !== undefined)
        warehouse.patch(item.barcode, { stock: available })
    }
  }
  finally {
    submitting.value = false
  }
}

async function loadRecent() {
  try {
    recent.value = await api<Movement[]>('/items/wh_movements', {
      query: {
        fields: 'id,type,quantity,date_created,variant.barcode,variant.sku,variant.product.title,variant.color.name,user_created.first_name,user_created.last_name',
        sort: '-date_created',
        limit: 12,
      },
    })
  }
  catch {}
}

onMounted(() => {
  loadRecent()
  const preset = ui.opsPreset
  if (preset) {
    type.value = preset.type
    pick(warehouse.byBarcode(preset.variant.barcode) ?? preset.variant)
    ui.opsPreset = null
  }
  else {
    focusCode()
  }
})
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
    <section class="panel space-y-4 p-4 lg:p-5">
      <!-- тип операции -->
      <div class="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Тип операции">
        <button
          v-for="t in TYPES" :key="t.id" type="button" role="radio" :aria-checked="type === t.id"
          :class="cn('flex h-12 items-center justify-center gap-1.5 rounded-xl text-[15px] font-bold transition active:scale-[0.98]',
                     type === t.id ? (t.id === 'issue' ? 'bg-destructive text-white shadow-sm' : 'bg-foreground text-background shadow-sm') : 'text-foreground/60')"
          @click="type = t.id"
        >
          <component :is="t.icon" class="size-4.5" />{{ t.label }}
        </button>
      </div>

      <!-- выбор товара: сканер — главное действие, поиск — запасной путь -->
      <div v-if="!picked" class="space-y-3">
        <Button
          v-if="!scanning" type="button" class="h-20 w-full flex-col gap-1 rounded-2xl bg-foreground text-base text-background hover:bg-foreground/90"
          @click="scanning = true"
        >
          <ScanLine class="size-7" />
          Сканировать штрихкод
        </Button>
        <ScanBox v-else @code="resolveCode" @close="scanning = false" />

        <div class="relative">
          <Search class="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="op-code" ref="codeInput" v-model="code" class="h-12 rounded-xl pl-11 text-base" type="search" inputmode="search"
            enterkeyhint="search" autocomplete="off" placeholder="или найдите по названию" aria-label="Поиск товара" @keydown="onCodeKey"
          />
        </div>
        <ul v-if="code.trim().length >= 2" class="divide-y overflow-hidden rounded-2xl border">
          <li
            v-for="(i, n) in suggestions" :key="i.id"
            :class="cn('flex cursor-pointer items-center gap-3 px-4 py-3 active:bg-muted', n === sugIndex && 'bg-muted')"
            @click="pick(i)"
          >
            <span class="min-w-0 flex-1">
              <b class="block truncate text-[15px]">{{ nameOf(i) }}</b>
              <small class="text-xs text-muted-foreground">{{ i.barcode }}<template v-if="art(i)"> · арт. {{ art(i) }}</template></small>
            </span>
            <span class="text-sm font-semibold tabular-nums">{{ qtyText(i.stock) }}</span>
          </li>
          <li v-if="!suggestions.length" class="px-4 py-3 text-sm text-muted-foreground">
            Ничего не нашлось
          </li>
        </ul>
      </div>

      <!-- выбранный товар -->
      <template v-else>
        <div class="rounded-2xl border p-4">
          <div class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <b class="block leading-snug">{{ nameOf(picked) }}</b>
              <Badge v-if="picked.product?.status === 'draft'" variant="secondary" class="mr-1 bg-warning/10 text-warning">
                черновик
              </Badge>
              <small class="text-xs text-muted-foreground">{{ picked.barcode }}<template v-if="art(picked)"> · арт. {{ art(picked) }}</template></small>
            </div>
            <div class="text-right">
              <div class="text-2xl font-black tabular-nums">
                {{ picked.stock === null ? '?' : num(picked.stock) }}
              </div>
              <small class="text-xs text-muted-foreground">на складе<template v-if="pickedState?.label"> · {{ pickedState.label }}</template></small>
            </div>
          </div>
          <p v-if="type === 'issue' && pickedState?.key === 'unknown'" class="mt-3 rounded-lg bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
            Остаток не пересчитан: сначала проведите приход с фактическим количеством
          </p>
          <div class="mt-3 flex gap-2">
            <Button type="button" variant="outline" class="h-10 flex-1 rounded-xl" @click="unpick">
              Другой товар
            </Button>
            <Button type="button" variant="outline" class="h-10 flex-1 rounded-xl" @click="ui.openItem(picked.barcode)">
              Карточка
            </Button>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <Label class="mb-1.5" for="op-qty">Количество</Label>
            <div class="flex h-16 overflow-hidden rounded-2xl border">
              <button type="button" class="w-20 active:bg-muted" aria-label="Меньше" @click="qty = Math.max(1, (qty || 0) - 1)">
                <Minus class="mx-auto size-6" />
              </button>
              <input
                id="op-qty" ref="qtyInput" v-model.number="qty" type="number" inputmode="numeric" min="1" step="1" enterkeyhint="done" size="1"
                class="w-0 min-w-0 flex-1 border-x bg-transparent text-center text-3xl font-black tabular-nums outline-none"
              >
              <button type="button" class="w-20 active:bg-muted" aria-label="Больше" @click="qty = (qty || 0) + 1">
                <Plus class="mx-auto size-6" />
              </button>
            </div>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <Button v-for="step in STEPS" :key="step" type="button" variant="outline" class="h-11 rounded-xl text-base" @click="qty = (qty || 0) + step">
                +{{ step }}
              </Button>
            </div>
          </div>
          <div>
            <Label class="mb-1.5" for="op-note">Комментарий</Label>
            <Input id="op-note" v-model="note" class="h-12 rounded-xl text-base" maxlength="500" enterkeyhint="done" autocomplete="off" :placeholder="OP_FORM[type].note" />
          </div>
          <Button
            type="submit" :variant="type === 'issue' ? 'destructive' : 'default'"
            class="h-14 w-full rounded-2xl text-lg font-bold" :disabled="submitting"
          >
            {{ submitLabel }}
          </Button>
        </form>
      </template>

      <div v-if="result" role="status" :class="cn('rounded-2xl p-4 text-sm', result.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')">
        <b class="block">{{ result.title }}</b>
        {{ result.text }}
      </div>
    </section>

    <section class="panel h-fit p-4">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="font-bold">
          Последние операции
        </h2>
        <Button as-child variant="outline" size="sm">
          <RouterLink to="/journal">
            Весь журнал
          </RouterLink>
        </Button>
      </div>
      <ul class="divide-y">
        <li v-for="m in recent" :key="m.id" class="flex cursor-pointer items-start gap-3 py-2.5" @click="ui.openItem(m.variant.barcode)">
          <div class="min-w-0 flex-1">
            <b class="block truncate text-sm">{{ nameOf(m.variant) }}</b>
            <small class="text-xs text-muted-foreground">{{ OP[m.type].name }} · {{ when(m.date_created) }} · {{ userName(m.user_created) }}</small>
          </div>
          <b class="text-sm tabular-nums" :class="isMinus(m.type) ? 'text-destructive' : 'text-success'">{{ OP[m.type].sign }}{{ num(m.quantity) }}</b>
        </li>
        <li v-if="!recent.length" class="py-2 text-sm text-muted-foreground">
          Операций пока не было
        </li>
      </ul>
    </section>
  </div>
</template>

<route lang="yaml">
meta:
  title: Операции
</route>
