import { useEffect, useRef } from "react";

export function useSwipeBack(onBack: () => void, threshold = 80) {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches.item(0);
      if (!touch) return;
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches.item(0);
      if (!touch) return;
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      if (dx > threshold && Math.abs(dy) < 100 && startX.current < 30) {
        onBack();
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onBack, threshold]);
}
