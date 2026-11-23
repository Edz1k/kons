<script setup lang="ts">
import { buttonVariants } from '@brillex/shared/components/ui/button'

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
