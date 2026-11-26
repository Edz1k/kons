<script setup lang="ts">
import type { Lead } from '~/types/crm'
import { cn } from '@brillex/shared/lib/utils'
import { Check, Inbox, MessageCircle, Phone, Plus } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { api } from '~/api/directus'
import { phoneHref, SOURCES, whatsappHref, when } from '~/utils/crm'

/**
 * Входящие: заявки с сайта (а позже — WhatsApp и звонки). Менеджер берёт ничью заявку себе
 * и превращает её в сделку. Заявки клиента, закреплённого за менеджером, приходят сразу ему.
 */
const crm = useCrmStore()
const session = useSessionStore()

const tab = ref<'new' | 'done'>('new')
const newDealOpen = ref(false)
const leadForDeal = ref<Lead | null>(null)

const list = computed(() => crm.leads.filter(l => l.status === tab.value))

async function patchLead(l: Lead, body: Partial<Lead>, done?: string) {
  try {
    await api(`/items/crm_leads/${l.id}`, { method: 'PATCH', body })
    if (done)
      toast.success(done)
  }
  catch (error) {
    toast.error((error as Error).message)
  }
  await crm.loadLeads()
}

function toDeal(l: Lead | null) {
  leadForDeal.value = l
  newDealOpen.value = true
}
</script>

<template>
  <div class="mb-4 flex items-center justify-between gap-2">
    <div class="inline-flex rounded-full bg-muted p-1">
      <button
        v-for="t in [{ id: 'new', name: `Новые · ${crm.openLeads.length}` }, { id: 'done', name: 'Разобранные' }] as const" :key="t.id" type="button"
        :class="cn('h-8 rounded-full px-4 text-sm font-semibold transition', tab === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground')"
        @click="tab = t.id"
      >
        {{ t.name }}
      </button>
    </div>
    <Button type="button" class="h-10 rounded-full" @click="toDeal(null)">
      <Plus /> Сделка
    </Button>
  </div>

  <ul class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    <li v-for="l in list" :key="l.id" class="flex flex-col rounded-2xl border bg-background p-4">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          {{ SOURCES[l.source] }}
        </Badge>
        <span>{{ when(l.date_created) }}</span>
        <span v-if="l.manager" class="ml-auto font-semibold" :class="l.manager === session.me?.id && 'text-primary'">
          {{ l.manager === session.me?.id ? 'ваша' : crm.staffName(l.manager) }}
        </span>
        <span v-else class="ml-auto font-semibold text-warning">ничья</span>
      </div>
      <b class="mt-2 block text-sm">{{ l.client ? crm.clientName(l.client) : l.company || l.sender || 'Без имени' }}</b>
      <small v-if="l.sender && (l.client || l.company)" class="text-xs text-muted-foreground">{{ l.sender }}</small>
      <p v-if="l.text" class="mt-2 line-clamp-5 text-sm whitespace-pre-line text-foreground/80">
        {{ l.text }}
      </p>

      <div class="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <Button v-if="phoneHref(l.sender)" as="a" :href="phoneHref(l.sender)" variant="outline" size="icon" class="rounded-full" aria-label="Позвонить">
          <Phone />
        </Button>
        <Button v-if="whatsappHref(l.sender)" as="a" :href="whatsappHref(l.sender)" target="_blank" rel="noopener" variant="outline" size="icon" class="rounded-full text-success" aria-label="WhatsApp">
          <MessageCircle />
        </Button>
        <template v-if="l.status === 'new'">
          <Button v-if="!l.manager" type="button" variant="outline" class="ml-auto rounded-full" @click="patchLead(l, { manager: session.me?.id }, 'Заявка ваша')">
            Взять себе
          </Button>
          <template v-else>
            <Button type="button" variant="ghost" size="icon" class="ml-auto rounded-full text-muted-foreground" aria-label="Разобрана без сделки" title="Разобрана без сделки" @click="patchLead(l, { status: 'done' }, 'Заявка разобрана')">
              <Check />
            </Button>
            <Button type="button" class="rounded-full" @click="toDeal(l)">
              В сделку
            </Button>
          </template>
        </template>
        <RouterLink v-else-if="l.deal" :to="{ path: '/deals', query: { deal: l.deal } }" class="ml-auto text-sm font-semibold text-primary">
          Открыть сделку →
        </RouterLink>
      </div>
    </li>
  </ul>

  <div v-if="!list.length" class="grid place-items-center gap-2 py-20 text-center text-muted-foreground">
    <Inbox class="size-10 opacity-40" />
    <p class="text-sm">
      {{ tab === 'new' ? 'Новых заявок нет. Заявки с сайта появятся здесь сами.' : 'Разобранных заявок пока нет' }}
    </p>
  </div>

  <NewDealDialog v-model:open="newDealOpen" :lead="leadForDeal" />
</template>

<route lang="yaml">
meta:
  title: Входящие
</route>
