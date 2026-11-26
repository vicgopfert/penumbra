'use client';

import { type ReactNode, useEffect, useState } from 'react';

export const SLOW_LOADING_MS = 5_000;

export const WAKING_HINT = 'O servidor pode estar acordando; isso leva até um minuto.';

// Nas páginas da conta, que buscam pelo navegador: passado um tempo, explica a espera (B-102).
// As novas tentativas continuam as do React Query.
export function LoadingMessage({ children }: { children?: ReactNode }) {
  const slow = useSlow();
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {children}
      {children && slow && ' '}
      {slow && WAKING_HINT}
    </p>
  );
}

function useSlow() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);
  return slow;
}
