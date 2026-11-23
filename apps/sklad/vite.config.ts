/**
 * Склад brillex — SPA на warehouse.brillex.kz. Те же правила, что у сайта (apps/web):
 * роутинг по файлам src/pages, layouts, автоимпорты, автокомпоненты, Pinia; общий код — @brillex/shared.
 *
 *   pnpm dev:sklad   → http://localhost:3335 (запросы к Directus идут через прокси /directus)
 *   pnpm build:sklad → apps/sklad/dist
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

    // Склад — в первую очередь приложение на телефоне: ставится на экран «Домой», открывается без адресной строки.
    // Service worker кэширует только оболочку (js, css, иконки). Данные — остатки, журнал — всегда живые из Directus.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'Склад Brillex',
        short_name: 'Склад',
        description: 'Приход, списание, выдача по заявкам и остатки склада Brillex',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#ffffff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
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
    port: 3335,
    proxy: {
      // в разработке ходим в боевой Directus через прокси: тот же origin, без настройки CORS
      '/directus': {
        target: 'https://cms.brillex.kz',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/directus/, ''),
      },
    },
  },
})
