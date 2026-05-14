import { useState, useCallback } from 'react';

interface UseModalReturn<T> {
  isOpen: boolean;
  payload: T | null;
  open: (payload?: T) => void;
  close: () => void;
}

export function useModal<T = undefined>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<T | null>(null);

  const open = useCallback((data?: T) => {
    setPayload(data ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
  }, []);

  return { isOpen, payload, open, close };
}
