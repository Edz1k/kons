<script setup lang="ts">
import type { Deal, Stage } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { Check } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { balance, money, STAGES } from '~/utils/crm'

/** Стадии сделки. Подсказывает, почему стадия недоступна; «Отказ» — отдельной кнопкой с причиной. */
const props = defineProps<{ deal: Deal }>()
const emit = defineEmits<{ lost: [] }>()

const { patchDeal } = useDealActions()
const { confirm } = useConfirm()

const current = computed(() => STAGES.findIndex(s => s.id === props.deal.stage))

function blocked(id: Stage): string | null {
  const d = props.deal
  if (id === d.stage)
    return null
  if (id === 'prod' && d.no_print)
    return 'Заказ без нанесения в цех не идёт'
  if (['ready', 'done'].includes(id) && !d.no_print && d.pr_state !== 'done')
    return 'Готовность заказа подтверждает производство'
  return null
}

async function choose(id: Stage) {
  const d = props.deal
  if (id === d.stage)
    return
  const reason = blocked(id)
  if (reason) {
    toast.info(reason)
    return
  }
  if (id === 'done' && balance(d) > 0) {
    const ok = await confirm({
      title: 'Закрыть с долгом?',
      description: `Клиент не доплатил ${money(balance(d))}. Сделка останется в «Долгах».`,
      action: 'Закрыть с долгом',
    })
    if (!ok)
      return
  }
  await patchDeal(d.id, { stage: id })
}
</script>

<template>
  <div class="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
    <button
      v-for="(s, i) in STAGES" :key="s.id" type="button"
      :class="cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition active:scale-[0.97]',
                 deal.stage === s.id ? `${s.tone} border-transparent text-white`
                 : i < current && deal.stage !== 'lost' ? 'border-transparent bg-muted text-foreground/70'
                   : blocked(s.id) ? 'border-dashed text-muted-foreground' : 'bg-background hover:border-foreground/30')"
      :title="blocked(s.id) ?? ''"
      @click="choose(s.id)"
    >
      <Check v-if="i < current && deal.stage !== 'lost'" class="size-3.5" />
      {{ s.name }}
    </button>
    <button
      type="button"
      :class="cn('flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold transition',
                 deal.stage === 'lost' ? 'border-transparent bg-slate-500 text-white' : 'text-muted-foreground hover:border-destructive/40 hover:text-destructive')"
      @click="deal.stage !== 'lost' && emit('lost')"
    >
      Отказ
    </button>
  </div>
</template>
