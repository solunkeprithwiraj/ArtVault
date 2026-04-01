'use client';

import { useRef, useCallback } from 'react';

interface TouchHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
}

const SWIPE_THRESHOLD = 50;

export function useTouch(handlers: TouchHandlers) {
  const startPos = useRef({ x: 0, y: 0 });
  const startDist = useRef(0);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      startDist.current = getTouchDistance(e.touches);
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length === 1 && startPos.current.x !== 0) {
        const dx = e.changedTouches[0].clientX - startPos.current.x;
        const dy = e.changedTouches[0].clientY - startPos.current.y;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
          if (dx > 0) handlers.onSwipeRight?.();
          else handlers.onSwipeLeft?.();
        } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
          if (dy > 0) handlers.onSwipeDown?.();
          else handlers.onSwipeUp?.();
        }
      }
      startPos.current = { x: 0, y: 0 };
      startDist.current = 0;
    },
    [handlers],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && startDist.current > 0 && handlers.onPinch) {
        const currentDist = getTouchDistance(e.touches);
        const scale = currentDist / startDist.current;
        handlers.onPinch(scale);
      }
    },
    [handlers],
  );

  return { onTouchStart, onTouchEnd, onTouchMove };
}
