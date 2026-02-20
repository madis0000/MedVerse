import { useState, useEffect, useCallback } from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, setOpen, toggle, close };
}
