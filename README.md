# brillex — фронты

Монорепо на pnpm workspace: приложения в `apps/*`, общий код в `packages/*`. Бэк — Directus на сервере `cms.brillex.kz`.

```
apps/
  web/      сайт brillex.kz — Vue 3 + vite-ssg, Netlify
  sklad/    склад sklad.brillex.kz — Vue 3 SPA, Netlify
packages/
  shared/   @brillex/shared: shadcn-vue компоненты, cn, тема Tailwind и шрифты, резолвер компонентов
directus/   исходники расширений Directus (на сервер копируются вручную)
scripts/    служебные скрипты Directus (резервы, рассылка)
```

## Команды

```bash
pnpm install
pnpm dev:web        # сайт → http://localhost:3333
pnpm dev:sklad      # склад → http://localhost:3335 (Directus через прокси /directus)
pnpm build:web
pnpm build:sklad
pnpm lint
pnpm typecheck      # все пакеты
pnpm test:unit
```

## Правила для приложений

Каждое приложение устроено одинаково:

- роутинг по файлам `src/pages` (unplugin-vue-router), мета страницы — в блоке `<route lang="yaml">`;
- layouts в `src/layouts` (vite-plugin-vue-layouts);
- автоимпорты: `vue`, `@vueuse/core`, роутер, Pinia, а также всё из `src/composables` и `src/stores`;
- автокомпоненты: свои из `src/components`, shadcn — из `@brillex/shared` через `SharedUiResolver`;
- стили: `src/styles/tailwind.css` начинается с `@import '@brillex/shared/styles/tailwind.css'`;
- модули (Pinia, охрана маршрутов и т.п.) — в `src/modules/*.ts` с `install(ctx)`.

Новые shadcn-компоненты ставятся в общий пакет: `cd packages/shared && npx shadcn-vue@2 add <имя>`.
После CLI проверьте импорт `cn` — должен быть `@brillex/shared/lib/utils`.

## Деплой (Netlify)

Два сайта из одного репозитория, у каждого свой `netlify.toml` в папке приложения:

| Сайт  | Base directory | Домен            |
| ----- | -------------- | ---------------- |
| сайт  | `apps/web`     | brillex.kz       |
| склад | `apps/sklad`   | sklad.brillex.kz |

Правило `ignore` в `netlify.toml` пересобирает приложение, только если изменилась его папка,
`packages/shared` или зависимости. Склад закрыт от индексации (`X-Robots-Tag`, `robots.txt`, `<meta name="robots">`).
