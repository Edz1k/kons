<script setup lang="ts">
import type { Deal, DealItem, VariantOption } from '~/types/crm'
import { Package, Plus, Search, Trash2 } from '@lucide/vue'
import { api } from '~/api/directus'
import { itemSum, money, n, num, paid, subtotal, TECHNIQUES, total } from '~/utils/crm'

/** Позиции сделки и расчёт: количество × (цена + нанесение), скидка, оплачено, остаток. */
const props = defineProps<{ deal: Deal, readonly?: boolean }>()

const { addItem, patchItem, deleteItem } = useDealActions()
const { confirm } = useConfirm()

// правка полей позиции уходит на сервер через паузу, чтобы не слать каждую букву
const drafts = reactive<Record<number, Partial<DealItem>>>({})
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function value<K extends keyof DealItem>(item: DealItem, key: K) {
  return (drafts[item.id]?.[key] ?? item[key]) as DealItem[K]
}

function edit(item: DealItem, key: keyof DealItem, raw: string | number | null) {
  const v = ['quantity', 'price', 'technique_price'].includes(key) ? Math.max(0, Number(String(raw ?? '').replace(/\s/g, '').replace(',', '.')) || 0) : raw
  drafts[item.id] = { ...drafts[item.id], [key]: v }
  clearTimeout(timers.get(item.id))
  timers.set(item.id, setTimeout(async () => {
    const data = drafts[item.id]
    delete drafts[item.id]
    if (data)
      await patchItem(props.deal.id, item.id, data)
  }, 600))
}

async function remove(item: DealItem) {
  if (item.name && !(await confirm({ title: `Удалить «${item.name}»?`, action: 'Удалить', danger: true })))
    return
  await deleteItem(props.deal.id, item.id)
}

const liveDeal = computed(() => ({
  ...props.deal,
  items: (props.deal.items ?? []).map(i => ({ ...i, ...drafts[i.id] })),
}))

// ── товар со склада ────────────────────────────────────────────────────
const pickFor = ref<DealItem | null>(null)
const pickOpen = computed({ get: () => Boolean(pickFor.value), set: v => !v && (pickFor.value = null) })
const q = ref('')
const found = ref<VariantOption[]>([])
const variants = ref(new Map<number, VariantOption>())
const VARIANT_FIELDS = 'id,barcode,sku,stock,reserved_qty,product.id,product.title,product.price,color.name'

watchDebounced(q, async () => {
  const term = q.value.trim()
  found.value = term.length < 2
    ? []
    : await api<VariantOption[]>('/items/product_variants', {
      query: {
        fields: VARIANT_FIELDS,
        filter: JSON.stringify({ _or: [{ barcode: { _icontains: term } }, { sku: { _icontains: term } }, { product: { title: { _icontains: term } } }, { color: { name: { _icontains: term } } }] }),
        limit: 20,
      },
    }).catch(() => [])
}, { debounce: 250 })

watch(() => props.deal.items?.map(i => i.variant).filter(Boolean).join(','), async (ids) => {
  if (!ids)
    return
  const rows = await api<VariantOption[]>('/items/product_variants', { query: { fields: VARIANT_FIELDS, filter: JSON.stringify({ id: { _in: ids.split(',') } }), limit: -1 } }).catch(() => [])
  variants.value = new Map(rows.map(v => [v.id, v]))
}, { immediate: true })

const variantLabel = (v: VariantOption) => [v.product?.title, v.color?.name].filter(Boolean).join(', ')
const free = (v: VariantOption) => Math.max(0, n(v.stock) - n(v.reserved_qty))

async function choose(v: VariantOption) {
  const item = pickFor.value
  pickFor.value = null
  if (!item)
    return
  await patchItem(props.deal.id, item.id, {
    variant: v.id,
    ...(item.name ? {} : { name: variantLabel(v) }),
    ...(n(item.price) ? {} : { price: n(v.product?.price) }),
  })
}
</script>

<template>
  <section class="space-y-2">
    <div v-for="(item, index) in deal.items" :key="item.id" class="rounded-2xl border bg-background p-3">
      <div class="flex items-start gap-2">
        <span class="mt-2.5 w-5 shrink-0 text-xs font-semibold text-muted-foreground">{{ index + 1 }}</span>
        <div class="min-w-0 flex-1 space-y-2">
          <Input
            :model-value="value(item, 'name')" :readonly="readonly" class="h-10 font-semibold" placeholder="Товар, например «Худи чёрное»"
            aria-label="Товар" @update:model-value="v => edit(item, 'name', String(v))"
          />
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label class="space-y-1">
              <span class="text-[11px] font-semibold text-muted-foreground uppercase">Кол-во</span>
              <Input :model-value="value(item, 'quantity')" :readonly="readonly" inputmode="numeric" class="h-10 tabular-nums" @update:model-value="v => edit(item, 'quantity', v)" />
            </label>
            <label v-if="!readonly || n(item.price)" class="space-y-1">
              <span class="text-[11px] font-semibold text-muted-foreground uppercase">Цена, ₸</span>
              <Input :model-value="value(item, 'price')" :readonly="readonly" inputmode="decimal" class="h-10 tabular-nums" @update:model-value="v => edit(item, 'price', v)" />
            </label>
            <label class="space-y-1">
              <span class="text-[11px] font-semibold text-muted-foreground uppercase">Нанесение</span>
              <Select :model-value="value(item, 'technique') ?? 'none'" :disabled="readonly" @update:model-value="v => edit(item, 'technique', v === 'none' ? null : String(v))">
                <SelectTrigger class="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Без нанесения
                  </SelectItem>
                  <SelectItem v-for="t in TECHNIQUES" :key="t" :value="t">
                    {{ t }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label v-if="!readonly || n(item.technique_price)" class="space-y-1">
              <span class="text-[11px] font-semibold text-muted-foreground uppercase">Нанесение, ₸/шт</span>
              <Input :model-value="value(item, 'technique_price')" :readonly="readonly" inputmode="decimal" class="h-10 tabular-nums" @update:model-value="v => edit(item, 'technique_price', v)" />
            </label>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="!readonly" type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold hover:border-foreground/30"
              @click="pickFor = item; q = item.name"
            >
              <Package class="size-3.5" />
              <template v-if="item.variant && variants.get(item.variant)">
                {{ variants.get(item.variant)!.barcode }} · свободно {{ num(free(variants.get(item.variant)!)) }} шт
              </template>
              <template v-else>
                Со склада
              </template>
            </button>
            <span v-if="item.variant && variants.get(item.variant) && free(variants.get(item.variant)!) < n(value(item, 'quantity'))" class="text-xs font-semibold text-warning">
              на складе меньше, чем в заказе
            </span>
            <b v-if="!readonly" class="ml-auto text-sm tabular-nums">{{ money(itemSum({ ...item, ...drafts[item.id] })) }}</b>
          </div>
        </div>
        <Button v-if="!readonly" type="button" variant="ghost" size="icon-sm" class="text-muted-foreground" aria-label="Удалить позицию" @click="remove(item)">
          <Trash2 />
        </Button>
      </div>
    </div>

    <Button v-if="!readonly" type="button" variant="outline" class="h-11 w-full rounded-2xl border-dashed" @click="addItem(deal)">
      <Plus /> Позиция
    </Button>

    <div v-if="!readonly && deal.items?.length" class="rounded-2xl bg-foreground p-4 text-background">
      <div class="flex justify-between text-sm text-background/70">
        <span>Сумма</span><span class="tabular-nums">{{ money(subtotal(liveDeal)) }}</span>
      </div>
      <div v-if="deal.discount" class="flex justify-between text-sm text-background/70">
        <span>Скидка {{ deal.discount }}%</span><span class="tabular-nums">−{{ money(subtotal(liveDeal) - total(liveDeal)) }}</span>
      </div>
      <div class="mt-1 flex justify-between text-lg font-black">
        <span>Итого</span><span class="tabular-nums">{{ money(total(liveDeal)) }}</span>
      </div>
      <div v-if="deal.payments" class="mt-2 flex justify-between border-t border-background/15 pt-2 text-sm">
        <span class="text-background/70">Оплачено {{ money(paid(deal)) }}</span>
        <b class="tabular-nums" :class="total(liveDeal) - paid(deal) > 0 ? 'text-primary' : 'text-success'">
          {{ total(liveDeal) - paid(deal) > 0 ? `осталось ${money(total(liveDeal) - paid(deal))}` : 'оплачено полностью' }}
        </b>
      </div>
    </div>

    <Dialog v-model:open="pickOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Товар со склада</DialogTitle>
          <DialogDescription>Позиция будет знать остаток на складе, а «Собрать со склада» создаст заявку кладовщику</DialogDescription>
        </DialogHeader>
        <div class="relative">
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="q" type="search" class="h-11 pl-9" placeholder="Название, цвет, артикул, штрихкод" />
        </div>
        <ul class="max-h-80 divide-y overflow-y-auto rounded-xl border">
          <li v-for="v in found" :key="v.id">
            <button type="button" class="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted" @click="choose(v)">
              <span class="min-w-0 flex-1">
                <b class="block truncate text-sm">{{ variantLabel(v) || 'Без товара' }}</b>
                <small class="text-xs text-muted-foreground">{{ v.barcode }}<template v-if="v.sku"> · арт. {{ v.sku }}</template><template v-if="v.product?.price"> · {{ money(v.product.price) }}</template></small>
              </span>
              <span class="text-xs font-semibold tabular-nums" :class="free(v) ? 'text-success' : 'text-destructive'">{{ num(free(v)) }} шт</span>
            </button>
          </li>
          <li v-if="!found.length" class="px-3 py-2.5 text-sm text-muted-foreground">
            {{ q.trim().length < 2 ? 'Начните вводить название' : 'Ничего не нашлось' }}
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  </section>
</template>
