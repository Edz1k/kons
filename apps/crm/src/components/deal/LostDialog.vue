<script setup lang="ts">
import type { Deal } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { LOST_REASONS } from '~/utils/crm'

/** Отказ: причина обязательна — по ним руководитель видит, почему теряем клиентов. */
const props = defineProps<{ deal: Deal }>()
const open = defineModel<boolean>('open', { required: true })

const { patchDeal } = useDealActions()
const reason = ref('')
const note = ref('')

watch(open, (v) => {
  if (v) {
    reason.value = ''
    note.value = ''
  }
})

async function save() {
  if (!reason.value)
    return
  await patchDeal(props.deal.id, { stage: 'lost', lost_reason: reason.value, lost_note: note.value.trim() || null }, `№${props.deal.number} — отказ`)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Почему отказ?</DialogTitle>
        <DialogDescription>№{{ deal.number }} уйдёт в отказы. Вернуть можно, выбрав стадию заново.</DialogDescription>
      </DialogHeader>
      <form class="space-y-3" @submit.prevent="save">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="r in LOST_REASONS" :key="r" type="button"
            :class="cn('h-9 rounded-full border px-3 text-sm font-semibold transition', reason === r ? 'border-transparent bg-foreground text-background' : 'hover:border-foreground/30')"
            @click="reason = r"
          >
            {{ r }}
          </button>
        </div>
        <Textarea v-model="note" maxlength="1000" placeholder="Подробности: у кого дешевле, что не устроило" />
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">
            Отмена
          </Button>
          <Button type="submit" variant="destructive" :disabled="!reason">
            Отказ
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
