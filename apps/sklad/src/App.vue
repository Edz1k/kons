<script setup lang="ts">
import ConfirmDialog from '@brillex/shared/components/app/ConfirmDialog.vue'
import UpdatePrompt from '@brillex/shared/components/app/UpdatePrompt.vue'
</script>

<template>
  <RouterView />
  <Toaster position="top-center" rich-colors />
  <ConfirmDialog />
  <PrintArea />
  <UpdatePrompt />
</template>
