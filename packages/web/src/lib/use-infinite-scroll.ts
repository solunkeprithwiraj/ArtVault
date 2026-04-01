'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(
  onLoadMore: () => void,
  options: { enabled: boolean; loading: boolean },
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  const setSentinel = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    if (!options.enabled || options.loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [options.enabled, options.loading]);

  return setSentinel;
}
