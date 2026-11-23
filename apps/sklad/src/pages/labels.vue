<script setup lang="ts">
import type { LabelFormat } from '~/stores/ui'
import { cn } from '@brillex/shared/lib/utils'
import { Printer, Search } from '@lucide/vue'
import { drawBarcode } from '~/utils/barcode'
import { art, matches, nameOf } from '~/utils/format'

/** Этикетки: выбрать позиции и напечатать на A4 (3 в ряд) или термопринтере 58×40. */
const ui = useUiStore()
const warehouse = useWarehouseStore()

const FORMATS: [LabelFormat, string][] = [['a4', 'A4, 3 в ряд'], ['thermal', 'Термо 58×40']]
/** на экране не больше 60 карточек; печатать можно сколько угодно */
const LIMIT = 60

const q = ref('')
const selected = ref(new Set<string>())
const grid = useTemplateRef<HTMLElement>('grid')

const list = computed(() => warehouse.variants.filter(v => matches(v, q.value)))
const shown = computed(() => list.value.slice(0, LIMIT))

async function draw() {
  await nextTick()
  grid.value?.querySelectorAll<SVGSVGElement>('svg[data-code]').forEach(svg => drawBarcode(svg, svg.dataset.code!, { height: 34, fontSize: 11, width: 1.4, margin: 4 }))
}
watch(shown, draw)
onMounted(draw)

function toggle(barcode: string) {
  const next = new Set(selected.value)
  if (next.has(barcode))
    next.delete(barcode)
  else
    next.add(barcode)
  selected.value = next
}

function selectFound() {
  selected.value = new Set([...selected.value, ...list.value.map(i => i.barcode)])
}

function print() {
  ui.printLabels(warehouse.variants.filter(v => selected.value.has(v.barcode)))
}
</script>

<template>
  <div class="mb-3 flex flex-col gap-2 sm:flex-row">
    <div class="relative flex-1">
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="q" type="search" class="h-11 bg-background pl-9" placeholder="Найти позиции для печати" aria-label="Поиск этикеток" />
    </div>
    <div class="grid grid-cols-2 gap-1 rounded-xl bg-background p-1 ring-1 ring-border">
      <button
        v-for="[k, l] in FORMATS" :key="k" type="button"
        :class="cn('h-9 rounded-lg px-3 text-sm font-semibold', ui.labelFormat === k ? 'bg-foreground text-background' : 'text-foreground/60')"
        @click="ui.labelFormat = k"
      >
        {{ l }}
      </button>
    </div>
  </div>

  <div class="sticky top-14 z-10 -mx-4 mb-3 flex flex-wrap items-center gap-2 bg-muted/95 px-4 py-2 backdrop-blur lg:top-16">
    <Button type="button" variant="outline" size="sm" @click="selectFound">
      Выбрать найденные ({{ list.length }})
    </Button>
    <Button type="button" variant="outline" size="sm" :disabled="!selected.size" @click="selected = new Set()">
      Снять выбор
    </Button>
    <Button type="button" size="sm" class="ml-auto" :disabled="!selected.size" @click="print">
      <Printer /> {{ selected.size ? `Печать (${selected.size})` : 'Печать' }}
    </Button>
  </div>

  <p v-if="!warehouse.loaded" class="text-sm text-muted-foreground">
    Загружаем…
  </p>
  <div ref="grid" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
    <label
      v-for="i in shown" :key="i.id"
      :class="cn('panel flex cursor-pointer flex-col items-center gap-1 p-3 text-center transition', selected.has(i.barcode) && 'ring-2 ring-foreground')"
    >
      <input type="checkbox" class="sr-only" :checked="selected.has(i.barcode)" :aria-label="`Выбрать ${i.barcode}`" @change="toggle(i.barcode)">
      <span class="line-clamp-2 text-xs leading-tight font-semibold">{{ nameOf(i) }}</span>
      <span class="text-[11px] text-muted-foreground">{{ art(i) ? `арт. ${art(i)}` : '&nbsp;' }}</span>
      <svg :data-code="i.barcode" class="max-w-full" />
    </label>
  </div>
  <p v-if="list.length > LIMIT" class="mt-3 text-sm text-muted-foreground">
    На экране первые {{ LIMIT }} из {{ list.length }}. Уточните поиск или нажмите «Выбрать найденные» — напечатаются все.
  </p>
</template>

<route lang="yaml">
meta:
  title: Этикетки
</route>
