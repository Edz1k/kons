<script setup lang="ts">
import type { Movement, OpType, Variant } from '~/types/warehouse'
import { ExternalLink, Printer } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { api, DIRECTUS_ADMIN_URL } from '~/api/directus'
import { VARIANT_FIELDS } from '~/stores/warehouse'
import { drawBarcode } from '~/utils/barcode'
import { art, isMinus, money, nameOf, num, OP, stockState, userName, when } from '~/utils/format'

/** Карточка позиции склада (= вариант товара сайта): остаток, быстрые операции, порог, этикетка, история. */
const ui = useUiStore()
const session = useSessionStore()
const warehouse = useWarehouseStore()
const router = useRouter()
const desktop = useMediaQuery('(min-width: 640px)')

const variant = ref<Variant | null>(null)
const history = ref<Movement[]>([])
const loading = ref(false)
const saving = ref(false)
const minQuantity = ref('')
const codeSvg = useTemplateRef<SVGSVGElement>('codeSvg')

const open = computed({
  get: () => Boolean(ui.drawerBarcode),
  set: value => !value && ui.closeItem(),
})
const st = computed(() => (variant.value ? stockState(variant.value) : null))
const draft = computed(() => variant.value?.product?.status === 'draft')

async function load(barcode: string) {
  loading.value = true
  variant.value = warehouse.byBarcode(barcode) ?? null
  try {
    const [rows, moves] = await Promise.all([
      api<Variant[]>('/items/product_variants', {
        query: { fields: VARIANT_FIELDS, filter: JSON.stringify({ barcode: { _eq: barcode } }), limit: 1 },
      }),
      api<Movement[]>('/items/wh_movements', {
        query: {
          fields: 'id,type,quantity,balance_after,note,deal_ref,reverses,date_created,user_created.id,user_created.first_name,user_created.last_name',
          filter: JSON.stringify({ variant: { barcode: { _eq: barcode } } }),
          sort: '-date_created',
          limit: 50,
        },
      }),
    ])
    const fresh = rows[0] ?? null
    variant.value = fresh
    const reversed = new Set(moves.map(m => m.reverses).filter(Boolean))
    history.value = moves.map(m => ({ ...m, cancelled: reversed.has(m.id) }))
    if (!fresh)
      return
    warehouse.patch(fresh.barcode, fresh)
    minQuantity.value = fresh.min_quantity == null ? '' : String(fresh.min_quantity)
    await nextTick()
    drawBarcode(codeSvg.value, fresh.barcode)
  }
  catch (error) {
    toast.error((error as Error).message)
    ui.closeItem()
  }
  finally {
    loading.value = false
  }
}

watch(() => ui.drawerBarcode, barcode => (barcode ? load(barcode) : (variant.value = null)))

function quick(type: OpType) {
  if (!variant.value)
    return
  ui.opsPreset = { variant: variant.value, type }
  ui.closeItem()
  router.push('/')
}

async function saveMin() {
  const current = variant.value
  if (!current)
    return
  const value = minQuantity.value.trim()
  if (value !== '' && (!/^\d+$/.test(value) || Number(value) > 1e9)) {
    toast.error('Порог — целое число от 0')
    return
  }
  saving.value = true
  try {
    await api(`/items/product_variants/${current.id}`, { method: 'PATCH', body: { min_quantity: value === '' ? null : Number(value) } })
    warehouse.patch(current.barcode, { min_quantity: value === '' ? null : Number(value) })
    toast.success('Порог сохранён')
    warehouse.afterChange()
    load(current.barcode)
  }
  catch (error) {
    toast.error((error as Error).message)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :side="desktop ? 'right' : 'bottom'"
      class="gap-0 overflow-y-auto bg-muted p-0 sm:max-w-md max-sm:max-h-[92dvh] max-sm:rounded-t-3xl"
    >
      <SheetHeader class="sticky top-0 z-10 border-b bg-background p-4 pr-12">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" class="font-mono">
            {{ ui.drawerBarcode }}
          </Badge>
          <Badge v-if="draft" variant="secondary" class="bg-warning/10 text-warning">
            черновик
          </Badge>
          <Badge v-if="st?.label" variant="secondary" :class="st.cls">
            {{ st.label }}
          </Badge>
        </div>
        <SheetTitle class="text-lg leading-snug">
          {{ variant ? nameOf(variant) : 'Загружаем…' }}
        </SheetTitle>
        <SheetDescription class="sr-only">
          Карточка позиции склада
        </SheetDescription>
      </SheetHeader>

      <div v-if="variant" class="space-y-3 p-4">
        <div v-if="draft" class="rounded-2xl bg-warning/10 p-3 text-sm text-warning">
          Товар в черновике: на сайте его не видно. Менеджер добавит фото и описание в Directus и переведёт статус «На сайте».
        </div>
        <div v-if="!variant.product" class="rounded-2xl bg-warning/10 p-3 text-sm text-warning">
          Вариант не привязан к товару: на сайте его нет. Привяжите к товару в Directus или удалите.
        </div>

        <section class="panel p-4">
          <div class="flex items-end justify-between">
            <div>
              <div class="text-sm text-muted-foreground">
                На складе
              </div>
              <div class="text-4xl font-black tabular-nums">
                {{ variant.stock === null ? '?' : num(variant.stock) }}<small class="ml-1 text-base font-semibold text-muted-foreground">шт</small>
              </div>
            </div>
            <span v-if="variant.min_quantity !== null" class="text-sm text-muted-foreground">порог «мало»: {{ num(variant.min_quantity) }}</span>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" @click="quick('receipt')">
              + Приход
            </Button>
            <Button type="button" variant="outline" @click="quick('issue')">
              − Списание
            </Button>
            <Button type="button" variant="outline" @click="quick('return')">
              ↩ Возврат
            </Button>
          </div>
        </section>

        <section class="panel space-y-2 p-4 text-sm">
          <div class="flex gap-3">
            <span class="w-24 shrink-0 text-muted-foreground">Товар</span><span>{{ variant.product?.title ?? '—' }}</span>
          </div>
          <div class="flex gap-3">
            <span class="w-24 shrink-0 text-muted-foreground">Цвет</span><span>{{ variant.color?.name ?? '—' }}</span>
          </div>
          <div class="flex gap-3">
            <span class="w-24 shrink-0 text-muted-foreground">Артикул</span><span>{{ art(variant) || '—' }}</span>
          </div>
          <div class="flex gap-3">
            <span class="w-24 shrink-0 text-muted-foreground">Цена сайта</span><span>{{ variant.product?.price == null ? '—' : money(variant.product.price) }}</span>
          </div>
          <Button
            v-if="session.isAdmin && variant.product" as-child variant="outline" size="sm" class="mt-2"
          >
            <a :href="`${DIRECTUS_ADMIN_URL}/content/products/${variant.product.id}`" target="_blank" rel="noopener">
              <ExternalLink /> Открыть товар в Directus
            </a>
          </Button>
        </section>

        <form v-if="session.isAdmin" class="panel space-y-2 p-4" autocomplete="off" @submit.prevent="saveMin">
          <Label for="e-min">Порог «мало», шт</Label>
          <div class="flex gap-2">
            <Input id="e-min" v-model="minQuantity" inputmode="numeric" placeholder="не задан" />
            <Button type="submit" :disabled="saving">
              Сохранить
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            Название, фото, цену и описание товара меняют в Directus.
          </p>
        </form>

        <section class="panel p-4">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="font-bold">
              Этикетка
            </h3>
            <Button type="button" variant="outline" size="sm" @click="ui.printLabels([variant])">
              <Printer /> Печать
            </Button>
          </div>
          <div class="flex justify-center rounded-xl bg-white">
            <svg ref="codeSvg" />
          </div>
        </section>

        <section class="panel p-4">
          <h3 class="mb-2 font-bold">
            История
          </h3>
          <ul class="divide-y">
            <li v-for="m in history" :key="m.id" class="flex items-start gap-3 py-2.5 text-sm" :class="m.cancelled && 'opacity-50'">
              <div class="min-w-0 flex-1">
                <div class="font-semibold">
                  {{ OP[m.type].name }}<template v-if="m.deal_ref">
                    · сделка №{{ m.deal_ref }}
                  </template>
                  <Badge v-if="m.cancelled" variant="secondary" class="ml-1">
                    отменена
                  </Badge>
                </div>
                <div v-if="m.note" class="text-muted-foreground">
                  {{ m.note }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ when(m.date_created) }} · {{ userName(m.user_created) }}
                </div>
              </div>
              <b class="tabular-nums" :class="isMinus(m.type) ? 'text-destructive' : 'text-success'">{{ OP[m.type].sign }}{{ num(m.quantity) }}</b>
            </li>
            <li v-if="!history.length && !loading" class="py-2 text-sm text-muted-foreground">
              Движений ещё не было.
            </li>
          </ul>
        </section>
      </div>
    </SheetContent>
  </Sheet>
</template>
