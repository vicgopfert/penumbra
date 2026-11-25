'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const WAKING_RETRY_MS = 10_000;
export const WAKING_MAX_RETRIES = 6;

// A API do Render dorme sem uso e leva até um minuto para voltar (B-102). A página pede de novo
// sozinha, sem recarregar: o componente continua montado enquanto o dado não chega, e a contagem
// fica na memória. O Next não deixa a página responder 503, então o estado sai do índice dos
// buscadores pelo noindex (docs/cache.md), só quando o estado é a página toda: na página inicial,
// as coleções são uma seção dela.
export function ServerWaking({
  title,
  retryHref,
  noindex = true,
}: {
  title: string;
  retryHref: string;
  noindex?: boolean;
}) {
  const router = useRouter();
  const [retries, setRetries] = useState(0);
  const waiting = retries < WAKING_MAX_RETRIES;

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setRetries((count) => count + 1);
      router.refresh();
    }, WAKING_RETRY_MS);
    return () => clearTimeout(timer);
  }, [waiting, retries, router]);

  return (
    <>
      {noindex && <meta name="robots" content="noindex" />}
      <Alert variant={waiting ? 'default' : 'destructive'}>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {waiting ? (
            <p role="status">
              O servidor está acordando, o que leva até um minuto. Tentando de novo…
            </p>
          ) : (
            <>
              <p>O servidor não respondeu; tente de novo em instantes.</p>
              {/* Recarrega a página inteira: uma navegação para a mesma URL poderia reusar o resultado. */}
              <a href={retryHref} className="underline">
                Tentar de novo
              </a>
            </>
          )}
        </AlertDescription>
      </Alert>
    </>
  );
}
