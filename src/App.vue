<script setup lang="ts">
import { ORGANIZATION_LD, SITE_NAME, SITE_URL, useJsonLd } from '~/composables/usePageSeo'

// Общие теги для всех страниц. Заголовок, описание и картинку каждая страница задаёт сама через usePageSeo.
const route = useRoute()

useHead({
  htmlAttrs: { lang: 'ru' },
  meta: [
    { key: 'og:site_name', property: 'og:site_name', content: SITE_NAME },
    { key: 'og:locale', property: 'og:locale', content: 'ru_RU' },
    { key: 'og:url', property: 'og:url', content: () => `${SITE_URL}${route.path}` },
  ],
  link: [
    { key: 'canonical', rel: 'canonical', href: () => `${SITE_URL}${route.path === '/' ? '/' : route.path.replace(/\/$/, '')}` },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
  ],
})

useJsonLd('organization', ORGANIZATION_LD)
</script>

<template>
  <RouterView />

  <WhatsAppButton />
</template>
