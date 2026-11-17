<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '~/components/ui/button'
import { usePageSeo } from '~/composables/usePageSeo'
import { WHATSAPP_LINK } from '~/constants/contacts'
import { CATALOG_SECTIONS, findCatalogSection } from '~/data/catalogSections'
import { fetchCatalogSectionPage } from '~/services/directus'
import { useCatalogSectionStore } from '~/stores/catalogSection'

/*
 * Подборка каталога под запрос: «ручки с логотипом», «термосы с логотипом» и т. п.
 * Товары берутся при сборке и лежат прямо в HTML. Свой склад — целиком, партнёрский каталог —
 * первые 24 позиции, остальные догружаются кнопкой.
 */
const route = useRoute()
const store = useCatalogSectionStore()

const slug = computed(() => String((route.params as { slug?: string }).slug ?? ''))
const section = computed(() => findCatalogSection(slug.value))
const data = computed(() => store.bySlug[slug.value])

const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')

const PARTNER_LIMIT = 24

usePageSeo(() => section.value
  ? { title: section.value.seoTitle, description: section.value.seoDescription }
  : { title: 'Подборка не найдена', noindex: true })

async function load() {
  if (!section.value || data.value)
    return

  loading.value = true
  error.value = ''

  try {
    const page = await fetchCatalogSectionPage({ own: section.value.own, partner: section.value.partner, partnerLimit: PARTNER_LIMIT })
    store.set(slug.value, page)
  }
  catch (e) {
    error.value = 'Не удалось загрузить товары. Обновите страницу или напишите нам в WhatsApp.'
    console.error('[katalog]', e)
  }
  finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!section.value || !data.value || loadingMore.value)
    return

  loadingMore.value = true

  try {
    const nextPage = data.value.partnerPage + 1
    const page = await fetchCatalogSectionPage({ own: [], partner: section.value.partner, partnerPage: nextPage, partnerLimit: PARTNER_LIMIT })
    store.appendPartner(slug.value, page, nextPage)
  }
  catch (e) {
    console.error('[katalog]', e)
  }
  finally {
    loadingMore.value = false
  }
}

onServerPrefetch(load)
onMounted(load)

const products = computed(() => [...(data.value?.own ?? []), ...(data.value?.partner ?? [])])
const total = computed(() => (data.value?.own.length ?? 0) + (data.value?.partnerTotal ?? 0))
const hasMore = computed(() => Boolean(data.value && data.value.partner.length < data.value.partnerTotal))

const whatsappLink = computed(() => `${WHATSAPP_LINK}?text=${encodeURIComponent(section.value?.whatsappText ?? 'Здравствуйте!')}`)
const otherSections = computed(() => CATALOG_SECTIONS.filter(item => item.slug !== slug.value))

const ctaShadow = 'shadow-[0_18px_36px_rgba(254,72,25,0.28)]'
</script>

<template>
  <section v-if="section" class="bg-white px-4 py-6 lg:px-8 md:px-6">
    <div class="mx-auto max-w-7xl">
      <nav aria-label="Хлебные крошки" class="text-sm text-slate-400">
        <RouterLink to="/market" class="hover:text-primary">
          Каталог
        </RouterLink>
        <span class="mx-2" aria-hidden="true">/</span>
        <span>{{ section.name }}</span>
      </nav>

      <div class="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl text-navy font-black tracking-tight md:text-5xl">
            {{ section.h1 }}
          </h1>
          <p class="mt-3 max-w-2xl text-base text-slate-500 leading-7">
            {{ section.lead }}
          </p>
        </div>

        <div class="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button as-child size="lg" class="h-12 rounded-full px-7 text-base" :class="ctaShadow">
            <a :href="whatsappLink" target="_blank" rel="noopener noreferrer">
              <span class="icon-[mdi--whatsapp] size-5" aria-hidden="true" />
              Запросить расчёт
            </a>
          </Button>
          <Button as-child size="lg" variant="outline" class="h-12 rounded-full px-7 text-base">
            <RouterLink to="/#calculator">
              Посчитать нанесение
            </RouterLink>
          </Button>
        </div>
      </div>

      <p v-if="total" class="mt-6 text-sm text-slate-400">
        {{ total }} шт. · в наличии и под заказ
      </p>

      <p v-if="error" class="mt-6 border border-danger/20 rounded-2xl bg-danger/5 p-4 text-danger">
        {{ error }}
      </p>

      <div v-if="loading && !products.length" class="grid mt-6 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProductSkeleton v-for="n in 8" :key="n" />
      </div>

      <div v-else-if="products.length" class="grid mt-6 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>

      <div v-if="hasMore" class="mt-8 flex justify-center">
        <Button size="lg" variant="outline" class="h-12 rounded-full px-7 text-base" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? 'Загружаем…' : 'Показать ещё' }}
        </Button>
      </div>

      <!-- другие подборки: перелинковка -->
      <nav aria-label="Другие подборки" class="mt-14 border-t border-black/10 pt-8">
        <p class="text-xs text-neutral-500 font-semibold tracking-[0.15em] uppercase">
          Ещё в каталоге
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink
            v-for="item in otherSections"
            :key="item.slug"
            :to="`/katalog/${item.slug}`"
            class="border border-black/10 rounded-full px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            {{ item.name }}
          </RouterLink>
        </div>
      </nav>
    </div>
  </section>

  <section v-else class="px-4 py-24 text-center">
    <h1 class="text-3xl font-black">
      Такой подборки нет
    </h1>
    <RouterLink to="/katalog" class="mt-4 inline-block text-primary font-semibold hover:underline">
      Все подборки
    </RouterLink>
  </section>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
