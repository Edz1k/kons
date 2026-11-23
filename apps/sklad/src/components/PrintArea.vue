<script setup lang="ts">
import { drawBarcode } from '~/utils/barcode'
/** Область печати этикеток: на экране скрыта (styles/print.css), при печати видна только она. */
import { art, nameOf } from '~/utils/format'

const ui = useUiStore()
const root = useTemplateRef<HTMLElement>('root')
const pageStyle = ref('')
useStyleTag(pageStyle)

watch(() => ui.printList, async (list) => {
  if (!list.length)
    return
  await nextTick()
  root.value?.querySelectorAll<SVGSVGElement>('svg[data-code]').forEach((svg) => {
    drawBarcode(svg, svg.dataset.code!, { height: 40, fontSize: 12, width: 1.5, margin: 2 })
  })
  pageStyle.value = ui.labelFormat === 'thermal' ? '@page { size: 58mm 40mm; margin: 0 }' : '@page { size: A4; margin: 10mm }'
  await nextTick()
  window.print()
})
</script>

<template>
  <div ref="root" class="print-area" :class="ui.labelFormat">
    <div v-for="i in ui.printList" :key="i.barcode" class="pl">
      <b>{{ nameOf(i) }}</b>
      <small v-if="art(i)">арт. {{ art(i) }}</small>
      <svg :data-code="i.barcode" />
    </div>
  </div>
</template>
