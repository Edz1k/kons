<script setup lang="ts" generic="T extends string | number | boolean">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

/*
 * Выпадающий список в стиле сайта вместо системного <select>:
 * системный список нельзя оформить, он всегда серый и разный на Mac, Windows и телефоне.
 * Работает с клавиатуры: стрелки, Enter, Esc.
 */

interface Option<V> { value: V, label: string }

const props = defineProps<{
  modelValue: T
  options: Option<T>[]
  highlight?: boolean
  ariaLabel?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const open = ref(false)
const active = ref(0)
const root = ref<HTMLElement>()
const button = ref<HTMLButtonElement>()
const list = ref<HTMLElement>()

const selectedIndex = computed(() => props.options.findIndex(o => o.value === props.modelValue))
const selectedLabel = computed(() => props.options[selectedIndex.value]?.label ?? '')

function scrollToActive() {
  nextTick(() => list.value?.querySelector<HTMLElement>(`[data-i="${active.value}"]`)?.scrollIntoView({ block: 'nearest' }))
}

function openList() {
  active.value = Math.max(0, selectedIndex.value)
  open.value = true
  scrollToActive()
}

function close() {
  open.value = false
}

function choose(index: number) {
  emit('update:modelValue', props.options[index].value)
  close()
  button.value?.focus()
}

function move(step: number) {
  const count = props.options.length
  active.value = (active.value + step + count) % count
  scrollToActive()
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openList()
    }
    return
  }
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Home':
      event.preventDefault()
      active.value = 0
      scrollToActive()
      break
    case 'End':
      event.preventDefault()
      active.value = props.options.length - 1
      scrollToActive()
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      choose(active.value)
      break
    case 'Tab':
      close()
      break
  }
}

function onOutside(event: Event) {
  if (open.value && !root.value?.contains(event.target as Node))
    close()
}

onMounted(() => document.addEventListener('pointerdown', onOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="button"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      class="h-12 w-full flex items-center justify-between gap-3 rounded-xl border py-0 pl-3.5 pr-4 text-left text-base text-neutral-900 outline-none transition focus-visible:border-neutral-900"
      :class="[
        highlight
          ? 'border-primary/40 bg-primary/10 font-medium hover:bg-primary/15'
          : 'border-transparent bg-neutral-100 hover:bg-neutral-200/70',
        open ? (highlight ? '!border-primary bg-primary/15' : '!border-neutral-900 !bg-white') : '',
      ]"
      @click="open ? close() : openList()"
      @keydown="onKeydown"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <span
        class="icon-[mdi--chevron-down] shrink-0 text-3xl transition-transform duration-200"
        :class="[open ? 'rotate-180' : '', highlight ? 'text-primary' : 'text-neutral-700']"
        aria-hidden="true"
      />
    </button>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <ul
        v-if="open"
        ref="list"
        role="listbox"
        class="absolute z-30 mt-2 max-h-72 w-full overflow-auto border border-black/10 rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      >
        <li
          v-for="(option, index) in options"
          :key="String(option.value)"
          :data-i="index"
          role="option"
          :aria-selected="index === selectedIndex"
          class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px] leading-5 transition-colors"
          :class="[
            index === active ? 'bg-primary/10' : '',
            index === selectedIndex ? 'font-semibold text-black' : 'text-neutral-700',
          ]"
          @pointerenter="active = index"
          @click="choose(index)"
        >
          <span>{{ option.label }}</span>
          <span v-if="index === selectedIndex" class="icon-[mdi--check] shrink-0 text-lg text-primary" aria-hidden="true" />
        </li>
      </ul>
    </transition>
  </div>
</template>
