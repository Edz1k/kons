<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()
useHead({
  title: () => t('not-found'),
})
</script>

<template>
  <main class="px-4 py-10 text-center text-teal-700">
    <div class="text-4xl">
      <div class="inline-block icon-[carbon--warning]" />
    </div>
    <RouterView />
    <div>
      <button
        class="m-3 mt-8 inline-block cursor-pointer rounded-sm bg-teal-700 px-4 py-1 text-sm text-white outline-hidden hover:bg-teal-800 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50"
        @click="router.back()"
      >
        {{ t('button.back') }}
      </button>
    </div>
  </main>
</template>
