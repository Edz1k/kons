<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@brillex/shared/components/ui/alert-dialog'
import { buttonVariants } from '@brillex/shared/components/ui/button'
import { useConfirm } from '@brillex/shared/composables/useConfirm'

const { state, answer } = useConfirm()
</script>

<template>
  <AlertDialog :open="state.open" @update:open="open => !open && answer(false)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.description">
          {{ state.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="answer(false)">
          Отмена
        </AlertDialogCancel>
        <AlertDialogAction :class="state.danger ? buttonVariants({ variant: 'destructive' }) : undefined" @click="answer(true)">
          {{ state.action }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
