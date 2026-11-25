'use client';

import type { User } from '@indie/contracts';
import Link from 'next/link';
import { useId } from 'react';
import { PRIVACY_PATH } from '@/features/legal/paths';
import {
  USAGE_METRICS_ANCHOR,
  USAGE_METRICS_LABEL,
  UsageMetricsDescription,
} from '@/features/metrics/consent';
import { useUsageMetricsConsent } from '@/features/metrics/hooks';
import { errorMessage } from '@/lib/api-client';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'America/Sao_Paulo',
});

export function UsageMetricsSection({ user }: { user: User }) {
  const id = useId();
  const consent = useUsageMetricsConsent();
  // A resposta da API vale até a sessão do perfil chegar com a mudança.
  const consentAt = (consent.data ?? user).usageMetricsConsentAt;
  const granted = consentAt !== null;

  return (
    <section aria-labelledby={`${id}-titulo`} className="space-y-3">
      <h2 id={`${id}-titulo`} className="text-xl font-semibold">
        Métricas de uso
      </h2>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={granted}
          disabled={consent.isPending}
          aria-describedby={`${id}-descricao`}
          onChange={(event) => consent.mutate(event.target.checked)}
          className="mt-1 size-4"
        />
        <div className="space-y-1">
          <label htmlFor={id} className="font-medium">
            {USAGE_METRICS_LABEL}
          </label>
          <p id={`${id}-descricao`} className="space-y-1 text-sm text-muted-foreground">
            <UsageMetricsDescription
              policyLink={
                <Link href={`${PRIVACY_PATH}#${USAGE_METRICS_ANCHOR}`} className="underline">
                  Política de privacidade
                </Link>
              }
            />
          </p>
        </div>
      </div>
      <p aria-live="polite" className="text-sm">
        {consent.isPending
          ? 'Salvando…'
          : consentAt !== null
            ? `Permissão ligada em ${dateFormat.format(new Date(consentAt))}.`
            : consent.isSuccess
              ? 'Permissão desligada. O que estava registrado na sua conta foi apagado.'
              : 'Permissão desligada.'}
      </p>
      {consent.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(consent.error)}
        </p>
      )}
    </section>
  );
}
