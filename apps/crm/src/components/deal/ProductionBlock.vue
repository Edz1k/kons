<script setup lang="ts">
import type { Deal } from '~/types/crm'
import { Camera, CheckCircle2, Play } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { accessToken, assetUrl } from '~/api/directus'
import { n, num, PR_STATES, units, when } from '~/utils/crm'

/**
 * Цех: «Взять в работу» и «Готово» (сколько сделано по каждой позиции, комментарий, фото).
 * Кнопки — у цеха и руководителя; менеджер видит состояние.
 */
const props = defineProps<{ deal: Deal }>()

const session = useSessionStore()
const crm = useCrmStore()
const { patchDeal, uploadPhoto } = useDealActions()

const canWork = computed(() => (session.isProd || session.isHead) && props.deal.stage === 'prod')
const made = computed(() => (props.deal.pr_quantities ?? []).reduce((a, q) => a + n(q), 0))
const token = ref<string | null>(null)
onMounted(async () => (token.value = await accessToken()))

const readyOpen = ref(false)
const quantities = ref<number[]>([])
const note = ref('')
const photo = ref<File | null>(null)
const preview = ref('')
const saving = ref(false)

function openReady() {
  quantities.value = (props.deal.items ?? []).map(i => n(i.quantity))
  note.value = ''
  photo.value = null
  preview.value = ''
  readyOpen.value = true
}

function onPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  photo.value = file
  preview.value = file ? URL.createObjectURL(file) : ''
}

async function confirmReady() {
  saving.value = true
  try {
    const pr_photo = photo.value ? await uploadPhoto(photo.value) : null
    await patchDeal(props.deal.id, {
      pr_state: 'done',
      pr_quantities: quantities.value.map(q => Math.max(0, Math.round(n(q)))),
      pr_note: note.value.trim() || null,
      ...(pr_photo ? { pr_photo } : {}),
    }, `№${props.deal.number} готов, менеджер получит уведомление`)
    readyOpen.value = false
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
  <section class="space-y-3 rounded-2xl border bg-background p-4">
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="mr-auto font-bold">
        Производство
      </h3>
      <Badge v-if="deal.pr_state" variant="secondary" :class="PR_STATES[deal.pr_state].cls">
        {{ PR_STATES[deal.pr_state].name }}
      </Badge>
      <Badge v-else variant="secondary">
        {{ deal.no_print ? 'Без нанесения' : 'Не в цеху' }}
      </Badge>
    </div>

    <dl class="grid grid-cols-2 gap-2 text-sm">
      <div v-if="deal.pr_started_at">
        <dt class="text-xs text-muted-foreground">
          В работе с
        </dt>
        <dd>{{ when(deal.pr_started_at) }}</dd>
      </div>
      <div v-if="deal.pr_finished_at">
        <dt class="text-xs text-muted-foreground">
          Готов
        </dt>
        <dd>{{ when(deal.pr_finished_at) }}</dd>
      </div>
      <div v-if="deal.pr_by">
        <dt class="text-xs text-muted-foreground">
          Цех
        </dt>
        <dd>{{ crm.staffName(deal.pr_by) }}</dd>
      </div>
      <div v-if="deal.pr_state === 'done'">
        <dt class="text-xs text-muted-foreground">
          Сделано
        </dt>
        <dd :class="made < units(deal) && 'font-semibold text-warning'">
          {{ num(made) }} из {{ num(units(deal)) }} шт
        </dd>
      </div>
    </dl>
    <p v-if="deal.pr_note" class="rounded-xl bg-muted p-3 text-sm">
      {{ deal.pr_note }}
    </p>
    <img v-if="deal.pr_photo && token" :src="assetUrl(deal.pr_photo, token)" alt="Фото готового заказа" class="max-h-72 w-full rounded-xl object-cover">

    <div v-if="canWork" class="grid gap-2">
      <Button v-if="deal.pr_state !== 'work'" type="button" class="h-12 rounded-2xl text-base" @click="patchDeal(deal.id, { pr_state: 'work' }, `№${deal.number} в работе`)">
        <Play /> Взять в работу
      </Button>
      <Button v-else type="button" class="h-12 rounded-2xl bg-success text-base text-white hover:bg-success/90" @click="openReady">
        <CheckCircle2 /> Готово
      </Button>
    </div>

    <Dialog v-model:open="readyOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>№{{ deal.number }} готов</DialogTitle>
          <DialogDescription>Сколько сделано по каждой позиции. Если меньше заказанного — менеджер увидит пометку.</DialogDescription>
        </DialogHeader>
        <form class="space-y-3" @submit.prevent="confirmReady">
          <div v-for="(item, i) in deal.items" :key="item.id" class="flex items-center gap-3">
            <span class="min-w-0 flex-1 text-sm">
              <b class="block truncate">{{ item.name || `Позиция ${i + 1}` }}</b>
              <small class="text-xs text-muted-foreground">заказано {{ num(item.quantity) }} шт<template v-if="item.technique"> · {{ item.technique }}</template></small>
            </span>
            <Input v-model.number="quantities[i]" inputmode="numeric" class="h-11 w-24 text-center text-base font-bold tabular-nums" />
          </div>
          <Textarea v-model="note" placeholder="Комментарий для менеджера (необязательно)" maxlength="1000" />
          <label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3 text-sm hover:border-foreground/30">
            <Camera class="size-5 text-muted-foreground" />
            <span class="flex-1">{{ photo ? photo.name : 'Фото готового заказа' }}</span>
            <input type="file" accept="image/*" capture="environment" class="sr-only" @change="onPhoto">
          </label>
          <img v-if="preview" :src="preview" alt="" class="max-h-48 w-full rounded-xl object-cover">
          <DialogFooter>
            <Button type="button" variant="outline" @click="readyOpen = false">
              Отмена
            </Button>
            <Button type="submit" :disabled="saving">
              {{ saving ? 'Сохраняем…' : 'Готово, отправить на отгрузку' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
