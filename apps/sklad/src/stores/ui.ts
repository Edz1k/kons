import type { OpType, Variant } from '~/types/warehouse'
import { defineStore } from 'pinia'

export type LabelFormat = 'a4' | 'thermal'

/** Оболочка: открытая карточка товара, переход в «Операции» с товаром, печать этикеток. */
export const useUiStore = defineStore('ui', () => {
  const drawerBarcode = ref<string | null>(null)
  const openItem = (barcode: string) => (drawerBarcode.value = barcode)
  const closeItem = () => (drawerBarcode.value = null)

  /** Карточка → «Операции»: какой товар и какую операцию подставить. */
  const opsPreset = shallowRef<{ variant: Variant, type: OpType } | null>(null)

  const labelFormat = ref<LabelFormat>('a4')
  const printList = ref<Variant[]>([])

  /** Кладёт этикетки в область печати (components/PrintArea.vue), она рисует штрихкоды и вызывает печать. */
  function printLabels(list: Variant[], format: LabelFormat = labelFormat.value) {
    if (!list.length)
      return
    labelFormat.value = format
    printList.value = [...list]
  }

  return { drawerBarcode, openItem, closeItem, opsPreset, labelFormat, printList, printLabels }
})
