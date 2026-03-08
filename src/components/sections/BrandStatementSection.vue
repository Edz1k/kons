<template>
  <section class="overflow-hidden py-12">
    <div class="mx-auto max-w-7xl px-4 text-center lg:px-8 sm:px-6">
      <h2 class="font-bold leading-[0.95] tracking-tight uppercase">
        <FadeComponent>
          <span class="block text-5xl text-black lg:text-8xl md:text-7xl">
            СДЕЛАЕМ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            БРЕНД ОДЕЖДЫ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            ВНУТРИ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            ВАШЕЙ
          </span>
        </FadeComponent>

        <FadeComponent>
          <span class="block text-5xl text-secondary lg:text-8xl md:text-7xl">
            КОМПАНИИ
          </span>
        </FadeComponent>
      </h2>
    </div>

    <!-- декоративные картинки -->
    <div class="pointer-events-none relative">
      <FadeComponent>
        <img
          src="/pictures/crocs.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          class="absolute bottom-[-70px] left-0 w-[30%] object-contain"
        >
      </FadeComponent>

      <FadeComponent>
        <img
          src="/pictures/sumka.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          class="absolute bottom-0 right-0 w-[35%] rotate-340 object-contain"
        >
      </FadeComponent>
    </div>
  </section>
</template>
