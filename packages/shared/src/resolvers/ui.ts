/**
 * Резолвер unplugin-vue-components для shadcn-компонентов из @brillex/shared:
 * в шаблонах приложений <Button>, <SheetContent>, <Toaster> работают без явных импортов.
 * Подключается в vite.config приложения: Components({ resolvers: [SharedUiResolver()] }).
 *
 * Имена берём из index.ts каждой папки ui — ровно так, как их экспортирует shadcn-vue
 * (например, Toaster лежит в sonner/Sonner.vue).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const UI_DIR = fileURLToPath(new URL('../components/ui', import.meta.url))
const EXPORT_RE = /export\s*\{\s*default as (\w+)\s*\}\s*from\s*["']\.\/(\w+)\.vue["']/g

function scan() {
  const map = new Map<string, string>()
  for (const folder of readdirSync(UI_DIR, { withFileTypes: true })) {
    if (!folder.isDirectory())
      continue
    const index = `${UI_DIR}/${folder.name}/index.ts`
    if (!existsSync(index))
      continue
    for (const [, name, file] of readFileSync(index, 'utf8').matchAll(EXPORT_RE))
      map.set(name, `@brillex/shared/components/ui/${folder.name}/${file}.vue`)
  }
  return map
}

export function SharedUiResolver() {
  const components = scan()
  return {
    type: 'component' as const,
    resolve: (name: string) => {
      const from = components.get(name)
      return from ? { from } : undefined
    },
  }
}
