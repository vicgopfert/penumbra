'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/hooks';
import { pageOf } from './pages';
import { flush, type MetricsGate, setMetricsGate, track } from './tracker';

// Sem conta, os eventos são anônimos; com conta, só saem com o consentimento das métricas de uso.
export function MetricsProvider() {
  const session = useSession();
  const gate: MetricsGate = !session.isSuccess
    ? 'pending'
    : session.data === null || session.data.usageMetricsConsentAt !== null
      ? 'allowed'
      : 'blocked';
  useEffect(() => setMetricsGate(gate), [gate]);

  const pathname = usePathname();
  useEffect(() => {
    track({ kind: 'PAGE_VIEW', ...pageOf(pathname), visitStart: false });
  }, [pathname]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  return null;
}
