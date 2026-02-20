import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export function useIdleTimeout(timeoutMs: number = 30 * 60 * 1000) {
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    setIsIdle(false);
    setShowWarning(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Show warning 2 minutes before timeout
    const warningTime = Math.max(timeoutMs - 120000, 0);
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTime);

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutMs);
  }, [timeoutMs, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer, isAuthenticated]);

  return { isIdle, showWarning, resetTimer };
}
