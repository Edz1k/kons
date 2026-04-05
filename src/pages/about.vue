<script setup lang="ts">
defineOptions({
  name: 'AboutPage',
})

const stats = [
  { value: '50+', label: 'реализованных проектов' },
  { value: '100+', label: 'довольных клиентов' },
  { value: '5+', label: 'направлений мерча' },
]

const values = [
  {
    title: 'Качество',
    description: 'Мы внимательно относимся к каждой детали — от идеи и дизайна до финального продукта.',
  },
  {
    title: 'Прозрачность',
    description: 'Открыто выстраиваем работу, соблюдаем договорённости и всегда держим клиента в курсе.',
  },
  {
    title: 'Индивидуальный подход',
    description: 'Подбираем решения под задачу бренда, а не работаем шаблонно и одинаково для всех.',
  },
  {
    title: 'Развитие',
    description: 'Следим за визуальными трендами, новыми технологиями и постоянно улучшаем результат.',
  },
]

const reasons = [
  'Полный цикл — от идеи до готового продукта',
  'Сильный дизайн и современная подача',
  'Понятная коммуникация и соблюдение сроков',
  'Мерч, который усиливает восприятие бренда',
]

const steps = [
  {
    number: '01',
    title: 'Погружаемся в задачу',
    description: 'Изучаем ваш бренд, цели, аудиторию и формат проекта, чтобы предложить сильную концепцию.',
  },
  {
    number: '02',
    title: 'Создаём идею и дизайн',
    description: 'Продумываем визуальное направление, детали и подачу, чтобы мерч выглядел актуально и цельно.',
  },
  {
    number: '03',
    title: 'Запускаем в реализацию',
    description: 'Доводим проект до готового результата и следим, чтобы он соответствовал ожиданиям по качеству.',
  },
]
</script>

<template>
  <div class="overflow-hidden bg-white text-primary">
    <!-- HERO -->
    <section class="relative">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left--20 top-0 h-90 w-90 rounded-full bg-secondary/10 blur-3xl" />
        <div class="absolute right--10 top-20 h-100 w-100 rounded-full bg-primary/5 blur-3xl" />
        <div class="absolute bottom-0 left-1/2 h-60 w-60 rounded-full bg-secondary/8 blur-3xl -translate-x-1/2" />
      </div>

      <div class="relative mx-auto max-w-7xl px-5 pb-24 pt-15 md:px-8 md:pb-32">
        <FadeComponent>
          <div class="mx-auto max-w-6xl text-center">
            <p class="mb-6 text-base text-secondary font-800 tracking-[0.35em] uppercase md:text-lg">
              О нас
            </p>

            <h1 class="text-3xl font-extrabold leading-tight lg:text-7xl md:text-6xl sm:text-4xl">
              Мы создаём <span class="text-secondary"> мерч</span>, <br> который усиливает <br> ваш бренд
            </h1>

            <p class="mx-auto mt-8 max-w-4xl text-lg text-slate-600 leading-8 md:mt-10 md:text-2xl md:leading-11">
              Полный цикл — от идеи до готовой коллекции. Мы создаём мерч,
              который хочется носить, показывать и ассоциировать с вашим брендом.
            </p>

            <div class="mt-10 flex flex-wrap items-center justify-center gap-5 md:mt-14">
              <div class="flex flex-wrap items-center gap-4">
                <RouterLink
                  to="/market"
                  class="inline-block rounded-full bg-secondary px-6 py-3 text-base text-white font-medium transition duration-300 hover:bg-orange-600 md:px-8 md:py-4 md:text-lg"
                >
                  Заказать мерч →
                </RouterLink>

                <a
                  href="/portfolio"
                  class="border border-secondary rounded-full px-6 py-3 text-base text-secondary font-medium transition duration-300 hover:bg-secondary md:px-8 md:py-4 md:text-lg hover:text-white"
                >
                  Смотреть портфолио
                </a>
              </div>
            </div>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- STATS -->
    <section class="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-14">
      <div class="grid gap-4 md:grid-cols-3">
        <FadeComponent
          v-for="(item, index) in stats"
          :key="item.label"
          :delay="index * 120"
        >
          <div class="group border border-slate-200 rounded-[28px] bg-white p-7 shadow-sm transition-all duration-300 hover:border-secondary/25 hover:shadow-xl hover:-translate-y-1">
            <div class="text-4xl font-900 leading-none tracking-[-0.03em] md:text-6xl">
              {{ item.value }}
            </div>
            <div class="mt-3 text-sm text-slate-500 font-600 tracking-[0.14em] uppercase md:text-base">
              {{ item.label }}
            </div>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- ABOUT + MISSION -->
    <section class="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-24">
      <div class="grid gap-8 md:grid-cols-2 md:items-stretch">
        <FadeComponent>
          <div>
            <p class="mb-4 text-sm text-secondary font-800 tracking-[0.28em] uppercase md:text-base">
              Кто мы
            </p>

            <h2 class="max-w-2xl text-4xl font-900 leading-[1] tracking-[-0.03em] md:text-6xl">
              Не просто делаем мерч,
              а помогаем брендам выделяться
            </h2>

            <div class="mt-8 text-base text-slate-600 leading-8 space-y-5 md:text-xl md:leading-9">
              <p>
                Мы работаем с компаниями и предпринимателями, которым важно не просто
                нанести логотип на одежду, а создать продукт, который хочется носить,
                показывать и ассоциировать с брендом.
              </p>

              <p>
                Для нас мерч — это часть имиджа компании, инструмент узнаваемости
                и способ выстроить более сильную связь с клиентами, командой и аудиторией.
              </p>

              <p>
                Поэтому мы продумываем не только производство, но и саму идею,
                визуальную подачу, удобство и впечатление от продукта в целом.
              </p>
            </div>
          </div>
        </FadeComponent>

        <FadeComponent :delay="150">
          <div class="relative h-full overflow-hidden rounded-[34px] bg-primary p-8 text-white shadow-2xl md:p-12">
            <div class="absolute right--8 top--8 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
            <div class="relative">
              <p class="text-sm text-white/55 font-800 tracking-[0.28em] uppercase md:text-base">
                Наша миссия
              </p>

              <h3 class="mt-5 max-w-xl text-3xl font-900 leading-[1.02] tracking-[-0.03em] md:text-5xl">
                Делать мерч современным,
                заметным и полезным для бизнеса
              </h3>

              <p class="mt-6 max-w-xl text-base text-white/75 leading-8 md:mt-8 md:text-xl md:leading-9">
                Мы стремимся создавать вещи, которые не выглядят формально или шаблонно.
                Наша задача — чтобы мерч усиливал образ бренда, вызывал доверие
                и действительно работал на восприятие компании.
              </p>
            </div>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- HISTORY -->
    <section class="relative bg-slate-50">
      <div class="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-26">
        <FadeComponent>
          <div class="mx-auto max-w-5xl text-center">
            <p class="mb-4 text-sm text-secondary font-800 tracking-[0.28em] uppercase md:text-base">
              Наша история
            </p>

            <h2 class="text-4xl font-900 leading-[0.98] tracking-[-0.03em] md:text-6xl xl:text-7xl">
              Мы выросли из идеи
              делать мерч лучше
            </h2>

            <div class="mx-auto mt-8 max-w-4xl text-base text-slate-600 leading-8 space-y-5 md:text-xl md:leading-9">
              <p>
                Brillex появился как проект, в котором хотелось объединить хороший вкус,
                современный подход и понятный сервис. Мы видели, что многим компаниям
                нужен мерч, который будет выглядеть актуально и качественно, а не шаблонно.
              </p>

              <p>
                Со временем мы начали работать с разными задачами, тестировать новые подходы,
                расширять идеи и собирать опыт, который помогает нам создавать сильные решения
                для брендов из разных сфер.
              </p>

              <p>
                Сегодня мы продолжаем развиваться и помогаем клиентам проходить путь
                от первой идеи до готовой коллекции, которую можно с гордостью показывать аудитории.
              </p>
            </div>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- STEPS -->
    <section class="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <FadeComponent>
        <div class="mb-10 max-w-3xl md:mb-14">
          <p class="mb-4 text-sm text-secondary font-800 tracking-[0.28em] uppercase md:text-base">
            Как мы работаем
          </p>

          <h2 class="text-4xl font-900 leading-[0.98] tracking-[-0.03em] md:text-6xl">
            От идеи до готового результата
          </h2>
        </div>
      </FadeComponent>

      <div class="grid gap-5 md:grid-cols-3">
        <FadeComponent
          v-for="(step, index) in steps"
          :key="step.number"
          :delay="index * 120"
        >
          <div class="group h-full border border-slate-200 rounded-[30px] bg-white p-7 shadow-sm transition-all duration-300 hover:border-secondary/20 hover:shadow-xl hover:-translate-y-1.5">
            <div class="text-5xl text-secondary/22 font-900 leading-none tracking-[-0.05em] transition-all duration-300 md:text-6xl group-hover:text-secondary/40">
              {{ step.number }}
            </div>

            <h3 class="mt-5 text-2xl font-900 leading-tight md:text-3xl">
              {{ step.title }}
            </h3>

            <p class="mt-4 text-base text-slate-600 leading-8 md:text-lg">
              {{ step.description }}
            </p>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- VALUES -->
    <section class="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <FadeComponent>
        <div class="mb-10 max-w-3xl md:mb-14">
          <p class="mb-4 text-sm text-secondary font-800 tracking-[0.28em] uppercase md:text-base">
            Наши ценности
          </p>

          <h2 class="text-4xl font-900 leading-[0.98] tracking-[-0.03em] md:text-6xl">
            Принципы, на которых строится Brillex
          </h2>
        </div>
      </FadeComponent>

      <div class="grid gap-5 2xl:grid-cols-4 md:grid-cols-2">
        <FadeComponent
          v-for="(item, index) in values"
          :key="item.title"
          :delay="index * 100"
        >
          <div class="group h-full border border-slate-200 rounded-[30px] bg-white p-8 shadow-sm transition-all duration-300 hover:border-secondary/20 hover:shadow-xl hover:-translate-y-1.5">
            <div class="h-full flex flex-col">
              <div class="h-16 w-16 inline-flex items-center justify-center rounded-2xl bg-secondary/10 transition-transform duration-300 group-hover:scale-110">
                <div class="h-3.5 w-3.5 rounded-full bg-secondary" />
              </div>

              <h3 class="mt-6 min-h-[88px] text-3xl text-primary font-900 leading-[1.02] tracking-[-0.03em] md:text-[40px]">
                {{ item.title }}
              </h3>

              <p class="mt-5 flex-1 text-lg text-slate-600 leading-9 md:text-xl">
                {{ item.description }}
              </p>
            </div>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- WHY US -->
    <section class="relative overflow-hidden bg-primary text-white">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute right-0 top-0 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div class="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div class="grid gap-10 md:grid-cols-2 md:items-center">
          <FadeComponent>
            <div>
              <p class="mb-4 text-sm text-white/55 font-800 tracking-[0.28em] uppercase md:text-base">
                Почему выбирают нас
              </p>

              <h2 class="max-w-2xl text-4xl font-900 leading-[0.98] tracking-[-0.03em] md:text-6xl">
                Мы делаем так, чтобы мерч усиливал ваш бренд
              </h2>

              <p class="mt-7 max-w-2xl text-base text-white/72 leading-8 md:text-xl md:leading-9">
                Для нас важно не просто выполнить заказ, а создать продукт,
                который будет точно соответствовать вашей идее, задачам
                и уровню вашего бренда.
              </p>
            </div>
          </FadeComponent>

          <div class="grid gap-4">
            <FadeComponent
              v-for="(item, index) in reasons"
              :key="item"
              :delay="index * 120"
            >
              <div class="group flex items-start gap-4 border border-white/10 rounded-[28px] bg-white/6 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/9 hover:-translate-y-1">
                <span class="h-10 w-10 inline-flex flex-shrink-0 items-center justify-center rounded-full bg-secondary text-base text-white font-900 transition-transform duration-300 group-hover:scale-110">
                  ✓
                </span>

                <p class="text-base text-white/82 leading-8 md:text-lg">
                  {{ item }}
                </p>
              </div>
            </FadeComponent>
          </div>
        </div>
      </div>
    </section>

    <!-- TEAM -->
    <section class="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <div class="grid gap-10 md:grid-cols-2 md:items-start">
        <FadeComponent>
          <div>
            <p class="mb-4 text-sm text-secondary font-800 tracking-[0.28em] uppercase md:text-base">
              Наша команда
            </p>

            <h2 class="text-4xl font-900 leading-[0.98] tracking-[-0.03em] md:text-6xl">
              За каждым проектом стоит команда,
              которая любит сильные идеи
            </h2>
          </div>
        </FadeComponent>

        <FadeComponent :delay="120">
          <div class="text-base text-slate-600 leading-8 space-y-5 md:text-xl md:leading-9">
            <p>
              В Brillex работают специалисты, которые понимают важность дизайна,
              качества и общей подачи продукта. Мы подходим к каждому проекту
              как к важной части бренда клиента.
            </p>

            <p>
              Нам важно, чтобы результат выглядел современно, ощущался качественно
              и реально решал задачу бизнеса — будь то узнаваемость, командная культура
              или эффектное представление бренда.
            </p>

            <p>
              Мы продолжаем развиваться, следим за трендами и ищем лучшие решения,
              чтобы наши клиенты получали не просто мерч, а сильный инструмент коммуникации.
            </p>
          </div>
        </FadeComponent>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto max-w-7xl px-5 pb-22 md:px-8 md:pb-30">
      <FadeComponent>
        <div class="relative overflow-hidden rounded-[36px] bg-slate-50 p-8 md:p-14">
          <div class="pointer-events-none absolute right--10 top--10 h-48 w-48 rounded-full bg-secondary/12 blur-3xl" />

          <div class="relative mx-auto max-w-4xl text-center">
            <p class="mb-4 text-sm text-secondary font-800 tracking-[0.28em] uppercase md:text-base">
              Свяжитесь с нами
            </p>

            <h2 class="text-4xl text-primary font-900 leading-[0.98] tracking-[-0.03em] md:text-6xl">
              Готовы обсудить ваш проект
              и создать мерч под ваш бренд
            </h2>

            <p class="mx-auto mt-7 max-w-3xl text-base text-slate-600 leading-8 md:text-xl md:leading-9">
              Если вы хотите разработать мерч для компании, бренда или мероприятия —
              свяжитесь с нами. Мы поможем пройти путь от идеи до готового результата.
            </p>

            <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
              <LeadsComponent />

              <a
                href="/portfolio"
                class="inline-flex items-center justify-center border border-slate-200 rounded-2xl bg-white px-8 py-4 text-base text-primary font-800 transition-all duration-300 hover:border-secondary hover:text-secondary hover:shadow-lg hover:-translate-y-1"
              >
                Посмотреть кейсы
              </a>
            </div>
          </div>
        </div>
      </FadeComponent>
    </section>
  </div>
</template>
