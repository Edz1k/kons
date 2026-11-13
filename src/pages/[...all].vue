<script setup lang="ts">
// Собирается в dist/404.html — Netlify отдаёт его с кодом 404 на любой несуществующий адрес.
usePageSeo({ title: 'Страница не найдена', noindex: true })
</script>

<template>
  <section class="w-full py-24 md:py-32">
    <div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
      <p class="text-sm text-primary font-extrabold tracking-[0.25em] uppercase">
        Ошибка 404
      </p>
      <h1 class="mt-4 text-4xl font-black leading-[0.95] md:text-6xl md:leading-none">
        Такой страницы нет
      </h1>
      <p class="mx-auto mt-5 max-w-xl text-base text-slate-600 leading-7 md:text-lg">
        Возможно, товар сняли с продажи или в адресе опечатка. Загляните в каталог — там всё, что есть сейчас.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <RouterLink
          to="/market"
          class="inline-block rounded-full bg-primary px-6 py-3 text-base text-white font-medium transition duration-300 hover:bg-orange-600"
        >
          Перейти в каталог
        </RouterLink>
        <RouterLink
          to="/"
          class="inline-block border border-slate-300 rounded-full px-6 py-3 text-base font-medium transition duration-300 hover:border-slate-500"
        >
          На главную
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
