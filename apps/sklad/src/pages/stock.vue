<script setup lang="ts">
import type { Variant } from '~/types/warehouse'
import { cn } from '@brillex/shared/lib/utils'
import { Download, Plus, Search } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { art, downloadCsv, matches, money, nameOf, num, qtyText, stockState, today } from '~/utils/format'

/** Остатки: все варианты товаров сайта. Сводка (админ), поиск, фильтры, новый товар, выгрузка в Excel. */
const ui = useUiStore()
const session = useSessionStore()
const warehouse = useWarehouseStore()

type Filter = 'all' | 'attn' | 'out' | 'low' | 'unknown' | 'draft' | 'orphan'

const q = ref('')
const filter = ref<Filter>('all')

const CHIPS: { id: Filter, label: string, test: (v: Variant) => boolean }[] = [
  { id: 'all', label: 'Все', test: () => true },
  { id: 'attn', label: 'Требуют внимания', test: v => stockState(v).key !== 'ok' },
  { id: 'out', label: 'Нет в наличии', test: v => stockState(v).key === 'out' },
  { id: 'low', label: 'Заканчивается', test: v => stockState(v).key === 'low' },
  { id: 'unknown', label: 'Не пересчитано', test: v => stockState(v).key === 'unknown' },
  { id: 'draft', label: 'Черновики', test: v => v.product?.status === 'draft' },
  { id: 'orphan', label: 'Без товара', test: v => !v.product },
]
const chips = computed(() => CHIPS
  .map(c => ({ ...c, count: warehouse.variants.filter(c.test).length }))
  .filter(c => c.id === 'all' || c.count || filter.value === c.id))
const list = computed(() => {
  const chip = CHIPS.find(c => c.id === filter.value) ?? CHIPS[0]
  return warehouse.variants.filter(chip.test).filter(v => matches(v, q.value))
})
const overview = computed(() => warehouse.overview)
const attention = computed(() => (overview.value ? overview.value.out_count + overview.value.low_count + overview.value.unknown_count : 0))

function exportCsv() {
  downloadCsv(`sklad-ostatki-${today()}.csv`, [
    ['Штрихкод', 'Товар', 'Цвет', 'Артикул', 'Статус', 'Цена сайта, ₸', 'Остаток, шт', 'Порог', 'Стоимость, ₸'],
    ...list.value.map(v => [
      v.barcode,
      v.product?.title ?? '',
      v.color?.name ?? '',
      art(v),
      v.product ? (v.product.status === 'draft' ? 'черновик' : 'на сайте') : 'без товара',
      v.product?.price ?? '',
      v.stock,
      v.min_quantity,
      v.stock !== null && v.product?.price != null ? v.stock * v.product.price : '',
    ]),
  ])
}

// ── новый товар (черновик) ─────────────────────────────────────────────
const creating = ref(false)
const emptyForm = () => ({ title: '', color: 'none', sku: '', price: '', min: '' })
const form = reactive(emptyForm())
const formError = ref('')

watch(creating, (value) => {
  if (value)
    warehouse.loadColors().catch(() => {})
})

async function createProduct() {
  formError.value = ''
  try {
    const r = await api<{ barcode: string }>('/warehouse/products', {
      method: 'POST',
      body: {
        title: form.title,
        color: form.color === 'none' ? null : Number(form.color),
        sku: form.sku,
        price: form.price,
        min_quantity: form.min,
      },
    })
    creating.value = false
    Object.assign(form, emptyForm())
    await warehouse.load(true)
    warehouse.afterChange()
    toast.success(`Товар-черновик ${r.barcode} создан. Проведите приход, а менеджер дополнит карточку в Directus.`)
    ui.openItem(r.barcode)
  }
  catch (error) {
    formError.value = (error as Error).message
  }
}
</script>

<template>
  <Teleport defer to="#top-actions">
    <template v-if="session.isAdmin">
      <Button type="button" variant="outline" size="sm" class="hidden sm:inline-flex" @click="exportCsv">
        <Download /> Excel
      </Button>
      <Button type="button" size="sm" @click="creating = true">
        <Plus /> Товар
      </Button>
    </template>
  </Teleport>

  <!-- сводка (админ): одна карточка, чтобы на телефоне список был виден с первого экрана -->
  <section v-if="session.isAdmin && overview" class="mb-4 rounded-3xl bg-foreground p-4 text-background">
    <div class="text-xs font-semibold tracking-wide text-background/60 uppercase">
      Стоимость склада · по цене сайта
    </div>
    <div class="mt-0.5 text-[28px] leading-tight font-black tabular-nums">
      {{ money(overview.total_value) }}
    </div>
    <div class="mt-3 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-2xl bg-background/10 px-2 py-2">
        <div class="text-lg font-black tabular-nums">
          {{ num(overview.total_quantity) }}
        </div>
        <div class="text-[11px] text-background/60">
          единиц
        </div>
      </div>
      <div class="rounded-2xl bg-background/10 px-2 py-2">
        <div class="text-lg font-black tabular-nums">
          {{ num(overview.variant_count) }}
        </div>
        <div class="text-[11px] text-background/60">
          позиций<template v-if="overview.draft_count">
            · {{ overview.draft_count }} черн.
          </template>
        </div>
      </div>
      <button type="button" :class="cn('rounded-2xl px-2 py-2 transition active:scale-[0.97]', attention ? 'bg-primary text-primary-foreground' : 'bg-background/10')" @click="filter = 'attn'">
        <div class="text-lg font-black tabular-nums">
          {{ num(attention) }}
        </div>
        <div class="text-[11px]" :class="attention ? 'text-primary-foreground/80' : 'text-background/60'">
          внимание
        </div>
      </button>
    </div>
  </section>

  <div class="relative mb-3">
    <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input v-model="q" type="search" enterkeyhint="search" class="h-12 rounded-xl bg-background pl-10 text-base" placeholder="Товар, цвет, артикул, штрихкод" aria-label="Поиск по складу" />
  </div>
  <div class="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
    <button v-for="c in chips" :key="c.id" type="button" class="chip" :data-active="filter === c.id" @click="filter = c.id">
      {{ c.label }} <i>{{ c.count }}</i>
    </button>
  </div>
  <p class="mb-3 text-sm text-muted-foreground">
    {{ list.length === warehouse.variants.length ? `${warehouse.variants.length} позиций` : `Показано ${list.length} из ${warehouse.variants.length}` }}
  </p>

  <div class="panel overflow-hidden">
    <div v-if="!warehouse.loaded" class="p-6 text-center text-sm text-muted-foreground">
      Загружаем…
    </div>
    <ul v-else class="divide-y">
      <li v-for="v in list" :key="v.id" class="flex min-h-16 cursor-pointer items-center gap-3 px-4 py-3 active:bg-muted hover:bg-muted/60" @click="ui.openItem(v.barcode)">
        <div class="min-w-0 flex-1">
          <b class="block truncate text-[15px]">{{ nameOf(v) }}</b>
          <small class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <code class="font-mono">{{ v.barcode }}</code>
            <template v-if="art(v)">· арт. {{ art(v) }}</template>
            <Badge v-if="v.product?.status === 'draft'" variant="secondary" class="bg-warning/10 text-warning">черновик</Badge>
          </small>
        </div>
        <div class="hidden w-28 text-right text-sm text-muted-foreground tabular-nums sm:block">
          {{ v.product?.price == null ? '—' : money(v.product.price) }}
        </div>
        <div class="w-28 text-right">
          <b class="block text-sm tabular-nums">{{ qtyText(v.stock) }}</b>
          <Badge v-if="stockState(v).label" variant="secondary" :class="stockState(v).cls">
            {{ stockState(v).label }}
          </Badge>
        </div>
      </li>
      <li v-if="!list.length" class="p-6 text-center text-sm text-muted-foreground">
        Ничего не нашлось
      </li>
    </ul>
  </div>

  <Dialog v-model:open="creating">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Новый товар</DialogTitle>
        <DialogDescription>
          Создаётся черновиком со штрихкодом: на сайте его не видно. Остаток с нуля — проведите приход.
          Фото, описание и публикацию менеджер добавит в Directus.
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-3" autocomplete="off" @submit.prevent="createProduct">
        <div class="space-y-1.5">
          <Label for="np-title">Название</Label>
          <Input id="np-title" v-model="form.title" maxlength="120" placeholder="Термос 500 мл" required />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1.5">
            <Label for="np-color">Цвет</Label>
            <Select v-model="form.color">
              <SelectTrigger id="np-color" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Без цвета
                </SelectItem>
                <SelectItem v-for="c in warehouse.colors" :key="c.id" :value="String(c.id)">
                  {{ c.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="np-sku">Артикул</Label>
            <Input id="np-sku" v-model="form.sku" maxlength="60" />
          </div>
          <div class="space-y-1.5">
            <Label for="np-price">Цена сайта, ₸</Label>
            <Input id="np-price" v-model="form.price" inputmode="numeric" />
          </div>
          <div class="space-y-1.5">
            <Label for="np-min">Порог «мало»</Label>
            <Input id="np-min" v-model="form.min" inputmode="numeric" placeholder="нет" />
          </div>
        </div>
        <p v-if="formError" class="text-sm font-medium text-destructive">
          {{ formError }}
        </p>
        <DialogFooter class="pt-2">
          <Button type="button" variant="outline" @click="creating = false">
            Отмена
          </Button>
          <Button type="submit">
            Создать черновик
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<route lang="yaml">
meta:
  title: Остатки
</route>
