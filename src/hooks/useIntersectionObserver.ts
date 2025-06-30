import { useEffect, useRef } from 'react';

const options = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1,
} as const;

export const useIntersectionObserver = (callback: () => void) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) callback();
      });
    const observer = new IntersectionObserver(handleIntersect, options);
    const curTargetRef = targetRef.current;

    if (curTargetRef) observer.observe(curTargetRef);

    return () => {
      if (curTargetRef) observer.unobserve(curTargetRef);
    };
  }, [callback]);

  return targetRef;
};
