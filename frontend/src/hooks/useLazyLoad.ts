import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
}

export function useLazyLoad<T extends HTMLElement = HTMLImageElement>(
  options: UseLazyLoadOptions = {}
) {
  const {
    rootMargin = '50px',
    threshold = 0,
    onLoad,
  } = options;

  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleIntersect = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting && !hasLoaded) {
        setIsIntersecting(true);
        setHasLoaded(true);
        onLoad?.();
      }
    },
    [hasLoaded, onLoad]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect, rootMargin, threshold]);

  return { ref, isIntersecting, hasLoaded };
}
