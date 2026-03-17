import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
}

export function useInfiniteScroll({
  threshold = 0.1,
  rootMargin = '100px',
  onLoadMore,
  hasMore,
  loading = false,
}: UseInfiniteScrollOptions) {
  const [isEnabled, setIsEnabled] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!hasMore || loading || !isEnabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMoreRef.current();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, isEnabled, rootMargin, threshold]);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  return { loaderRef, disable, enable };
}
