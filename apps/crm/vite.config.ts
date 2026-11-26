/**
 * CRM brillex — PWA на crm.brillex.kz. Те же правила, что у сайта и склада:
 * роутинг по файлам src/pages, layouts, автоимпорты, автокомпоненты, Pinia; общий код — @brillex/shared.
 *
 *   pnpm dev:crm   → http://localhost:3336 (запросы и WebSocket Directus — через прокси /directus)
 *   pnpm build:crm → apps/crm/dist
 */
import path from 'node:path'
import TailwindCSS from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'
// Относительный путь, а не '@brillex/shared/...': загрузчик конфига vite не бандлит пакетные импорты.
import { SharedUiResolver } from '../../packages/shared/src/resolvers/ui'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '@brillex/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },

  plugins: [
    VueRouter({
      extensions: ['.vue'],
      dts: 'src/typed-router.d.ts',
    }),

    VueMacros({
      // shadcn-vue берёт пропсы из типов reka-ui — betterDefine их теряет, для ui выключаем (как у сайта)
      betterDefine: {
        exclude: [/node_modules/, /packages\/shared\/src\/components\/ui\//],
      },
      plugins: {
        vue: Vue({ include: [/\.vue$/] }),
      },
    }),

    Layouts(),

    AutoImport({
      include: [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/],
      imports: [
        'vue',
        '@vueuse/core',
        'pinia',
        VueRouterAutoImports,
        // общее для приложений сотрудников
        { '@brillex/shared/composables/useConfirm': ['useConfirm'] },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true,
    }),

    Components({
      extensions: ['vue'],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: 'src/components.d.ts',
      // shadcn-компоненты из @brillex/shared — в шаблонах без явных импортов
      resolvers: [SharedUiResolver()],
    }),

    TailwindCSS(),

    // CRM ставится на телефон и компьютер как приложение (менеджеры работают с телефона).
    // Service worker кэширует только оболочку (js, css, иконки). Данные — сделки, заявки — всегда живые из Directus.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'CRM Brillex',
        short_name: 'CRM',
        description: 'Заявки, сделки, производство и оплаты Brillex',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#ffffff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // запросы к Directus не перехватываем и не кэшируем
        navigateFallbackDenylist: [/^\/directus\//],
      },
    }),

    VueDevTools(),
  ],

  server: {
    port: 3336,
    proxy: {
      // в разработке ходим в боевой Directus через прокси: тот же origin, без настройки CORS
      '/directus': {
        target: 'https://cms.brillex.kz',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/directus/, ''),
        // живые обновления: WebSocket Directus
        ws: true,
      },
    },
  },
})
