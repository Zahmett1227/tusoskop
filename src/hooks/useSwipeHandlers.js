import { useCallback, useEffect, useRef, useState } from "react";

/** Tarayıcı “hareketi azalt” tercihi — kaydırma jestlerini kapatmak için */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const DEFAULT_THRESHOLD_PX = 56;

/**
 * Yatay kaydırma: sola = onSwipeLeft, sağa = onSwipeRight.
 * Dikey kaydırmayı şık seçimiyle karıştırmamak için eğim kontrolü vardır.
 */
export function useSwipeHandlers({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  thresholdPx = DEFAULT_THRESHOLD_PX,
  reducedMotion = false,
}) {
  const startX = useRef(null);
  const startY = useRef(null);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled || reducedMotion || e.touches.length !== 1) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    [enabled, reducedMotion]
  );

  const onTouchEnd = useCallback(
    (e) => {
      if (!enabled || reducedMotion || startX.current == null || e.changedTouches.length !== 1) {
        startX.current = null;
        startY.current = null;
        return;
      }
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX.current;
      const dy = endY - (startY.current ?? 0);
      startX.current = null;
      startY.current = null;

      if (Math.abs(dy) > Math.abs(dx) * 1.25) return;
      if (Math.abs(dx) < thresholdPx) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [enabled, reducedMotion, thresholdPx, onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}
