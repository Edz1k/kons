import path from 'node:path'
import process from 'node:process'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import Shiki from '@shikijs/markdown-it'
import TailwindCSS from '@tailwindcss/vite'
import { unheadVueComposablesImports } from '@unhead/vue'
import Vue from '@vitejs/plugin-vue'
import LinkAttributes from 'markdown-it-link-attributes'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'
import generateSitemap from 'vite-ssg-sitemap'
import 'vitest/config'

/** Страницы, которые не нужны в поиске: служебные, 404 и заготовка товара. */
const NOINDEX_ROUTES = ['/login', '/register', '/profile', '/404', '/product/__shell']

/**
 * Адреса всех товаров (своих и партнёрских) — чтобы собрать каждому готовый HTML.
 * Без этого поисковик на /product/... получал бы пустую заготовку.
 */
async function fetchProductRoutes(directusUrl: string): Promise<string[]> {
  if (!directusUrl) {
    console.warn('[ssg] VITE_DIRECTUS_URL не задан — страницы товаров не собираем')
    return []
  }

  const load = async (collection: string, filter = '') => {
    const response = await fetch(`${directusUrl}/items/${collection}?fields=slug&limit=-1${filter}`)

    if (!response.ok)
      throw new Error(`[ssg] ${collection}: ${response.status}`)

    const json = await response.json() as { data?: { slug?: string }[] }
    return (json.data ?? []).map(item => item.slug).filter((slug): slug is string => Boolean(slug))
  }

  const [own, partner] = await Promise.all([
    load('products'),
    load('partner_products', '&filter[is_active][_eq]=true'),
  ])

  const slugs = [...new Set([...own, ...partner])]
  console.log(`[ssg] товаров к сборке: ${own.length} своих, ${partner.length} партнёрских`)

  return slugs.map(slug => `/product/${slug}`)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const directusUrl = (env.VITE_DIRECTUS_URL ?? '').replace(/\/+$/, '')
  let productRoutes: string[] = []

  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
    },

    plugins: [
    // https://github.com/posva/unplugin-vue-router
      VueRouter({
        extensions: ['.vue', '.md'],
        dts: 'src/typed-router.d.ts',
      }),

      VueMacros({
      // shadcn-vue берёт пропсы из типов reka-ui (PrimitiveProps и т.п.) — betterDefine их
      // не находит и теряет, например `as`, и Button рендерится как <div>.
      // Vue 3.5 разбирает такие типы сам, поэтому для ui-компонентов betterDefine выключаем.
        betterDefine: {
          exclude: [/node_modules/, /src\/components\/ui\//],
        },
        plugins: {
          vue: Vue({
            include: [/\.vue$/, /\.md$/],
          }),
        },
      }),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        include: [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
        imports: [
          'vue',
          'vue-i18n',
          '@vueuse/core',
          unheadVueComposablesImports,
          VueRouterAutoImports,
          {
          // add any other imports you were relying on
            'vue-router/auto': ['useLink'],
          },
        ],
        dts: 'src/auto-imports.d.ts',
        dirs: [
          'src/composables',
          'src/stores',
        ],
        vueTemplate: true,
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
      // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        dts: 'src/components.d.ts',
      }),

      // https://tailwindcss.com — настройки и тема в src/styles/tailwind.css
      TailwindCSS(),

      // https://github.com/unplugin/unplugin-vue-markdown
      // Don't need this? Try vitesse-lite: https://github.com/antfu/vitesse-lite
      Markdown({
        wrapperClasses: 'prose prose-sm m-auto text-left',
        headEnabled: true,
        async markdownItSetup(md) {
          md.use(LinkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          })
          md.use(await Shiki({
            defaultColor: false,
            themes: {
              light: 'vitesse-light',
              dark: 'vitesse-dark',
            },
          }))
        },
      }),

      // PWA сайту не нужен. Но у тех, кто уже заходил, в браузере стоит старый service worker:
      // он кеширует страницы и на любой адрес отдаёт главную. selfDestroying выкатывает на его место
      // пустышку, которая снимает себя и чистит кеш. Плагин можно удалить совсем через пару месяцев.
      VitePWA({
        selfDestroying: true,
        injectRegister: false,
        manifest: false,
      }),

      // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
      VueI18n({
        runtimeOnly: true,
        compositionOnly: true,
        fullInstall: true,
        include: [path.resolve(__dirname, 'locales/**')],
      }),

      // https://github.com/webfansplz/vite-plugin-vue-devtools
      VueDevTools(),
    ],

    // https://github.com/vitest-dev/vitest
    test: {
      include: ['test/**/*.test.ts'],
      environment: 'jsdom',
    },

    // https://github.com/antfu/vite-ssg
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      beastiesOptions: {
        reduceInlineStyles: false,
      },
      concurrency: 30,
      async includedRoutes(paths) {
        productRoutes = await fetchProductRoutes(directusUrl)

        return [
        // статичные страницы без динамических сегментов (README — служебная заметка шаблона, на сайт не нужна)
          ...paths.filter(route => !route.includes(':') && route !== '/README' && route !== '/product'),
          // /404 → dist/404.html: Netlify сам отдаёт его с кодом 404 на несуществующие адреса
          '/404',
          // заготовка для товаров, добавленных после сборки (см. netlify.toml)
          '/product/__shell',
          ...productRoutes,
        ]
      },
      onFinished() {
        generateSitemap({
          hostname: 'https://brillex.kz/',
          exclude: [...NOINDEX_ROUTES, '/README'],
          changefreq: { '*': 'weekly', '/': 'daily', '/market': 'daily' },
          priority: { '*': 0.6, '/': 1, '/market': 0.9 },
          robots: [{ userAgent: '*', allow: '/', disallow: NOINDEX_ROUTES }],
        })
      },
    },

    ssr: {
    // TODO: workaround until they support native ESM
      noExternal: ['workbox-window', /vue-i18n/],
    },
  }
})
