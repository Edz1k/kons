import type { Ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

interface UseInfiniteScrollTriggerOptions {
  target: Ref<HTMLElement | null>
  enabled: Ref<boolean>
  loading: Ref<boolean>
  loadingMore: Ref<boolean>
  hasMore: Ref<boolean>
  initialized: Ref<boolean>
  itemsCount: Ref<number>
  onLoadMore: () => Promise<void> | void
  rootMargin?: string
}

export function useInfiniteScrollTrigger(options: UseInfiniteScrollTriggerOptions) {
  const {
    target,
    enabled,
    loading,
    loadingMore,
    hasMore,
    initialized,
    itemsCount,
    onLoadMore,
    rootMargin = '300px',
  } = options

  useIntersectionObserver(
    target,
    async ([entry]) => {
      if (!enabled.value)
        return

      if (!entry?.isIntersecting)
        return

      if (!initialized.value)
        return

      if (loading.value || loadingMore.value)
        return

      if (!hasMore.value)
        return

      if (!itemsCount.value)
        return

      await onLoadMore()
    },
    {
      rootMargin,
    },
  )
}
