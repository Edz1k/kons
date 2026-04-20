<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
const route = useRoute()
useHead({
  title: 'Brillex - Мерч для брендов',
  meta: [
    {
      name: 'description',
      content: 'Brillex - Мерч для брендов',
    },
  ],
  link: [
    { rel: 'canonical', href: `https://brillex.kz${route.path}` },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
  ],

})
</script>

<template>
  <RouterView />
</template>
