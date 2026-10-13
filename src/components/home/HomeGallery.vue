<script setup lang="ts">
import type { Photo } from './content'
import type { UnwrapRefCarouselApi } from '~/components/ui/carousel/interface'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'
import { ref } from 'vue'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '~/components/ui/carousel'
import { cn } from '~/lib/utils'

/**
 * Меняющаяся галерея на shadcn-vue Carousel (Embla).
 * fade — одна картинка за раз с плавной сменой (блок 4),
 * без fade — лента из нескольких карточек (блок 8).
 */
const props = withDefaults(defineProps<{
  photos: Photo[]
  fade?: boolean
  delay?: number
  itemClass?: string
  label: string
}>(), {
  fade: false,
  delay: 3500,
  itemClass: 'basis-full',
})

const plugins = [
  Autoplay({ delay: props.delay, stopOnInteraction: false, stopOnMouseEnter: true }),
  ...(props.fade ? [Fade()] : []),
]

const api = ref<UnwrapRefCarouselApi>()
const selected = ref(0)
const snapCount = ref(0)

function onInit(value: UnwrapRefCarouselApi) {
  api.value = value
  if (!value)
    return
  const sync = () => {
    snapCount.value = value.scrollSnapList().length
    selected.value = value.selectedScrollSnap()
  }
  sync()
  value.on('select', sync)
  value.on('reInit', sync)
}
</script>

<template>
  <Carousel
    :opts="{ loop: true, align: 'start' }"
    :plugins="plugins"
    class="group/gallery"
    :aria-label="label"
    @init-api="onInit"
  >
    <CarouselContent>
      <CarouselItem
        v-for="(photo, index) in photos"
        :key="`${photo.src}-${index}`"
        :class="cn(itemClass)"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${index + 1} из ${photos.length}`"
      >
        <div class="overflow-hidden rounded-3xl bg-neutral-100">
          <img
            :src="photo.src"
            :alt="photo.alt"
            loading="lazy"
            decoding="async"
            class="aspect-[3/2] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
          >
        </div>
      </CarouselItem>
    </CarouselContent>

    <CarouselPrevious class="left-3 size-11 border-0 bg-white/90 shadow-md backdrop-blur md:left-5 hover:bg-white">
      <ArrowLeft class="size-5" />
      <span class="sr-only">Предыдущее фото</span>
    </CarouselPrevious>
    <CarouselNext class="right-3 size-11 border-0 bg-white/90 shadow-md backdrop-blur md:right-5 hover:bg-white">
      <ArrowRight class="size-5" />
      <span class="sr-only">Следующее фото</span>
    </CarouselNext>

    <div v-if="snapCount > 1" class="mt-5 flex justify-center gap-2">
      <button
        v-for="index in snapCount"
        :key="index"
        type="button"
        class="h-2 rounded-full transition-all duration-300"
        :class="selected === index - 1 ? 'w-8 bg-primary' : 'w-2 bg-black/15 hover:bg-black/30'"
        :aria-label="`Показать фото ${index}`"
        :aria-current="selected === index - 1"
        @click="api?.scrollTo(index - 1)"
      />
    </div>
  </Carousel>
</template>
