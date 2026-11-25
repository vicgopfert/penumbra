import type { ReactNode } from 'react';
import { type LegalHistory, legalConfig } from '@/config/legal';

export const formatLegalDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function LegalPage({
  title,
  history,
  children,
}: {
  title: string;
  history: LegalHistory;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Em vigor desde {formatLegalDate(history[0].date)}.
        </p>
      </header>
      {children}
      <LegalSection id="historico" title="Histórico de versões">
        <ul className="list-disc space-y-1 pl-6">
          {history.map(({ date, change }) => (
            <li key={date}>
              {formatLegalDate(date)}: {change}
            </li>
          ))}
        </ul>
      </LegalSection>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ContactEmail() {
  return (
    <a href={`mailto:${legalConfig.contactEmail}`} className="underline">
      {legalConfig.contactEmail}
    </a>
  );
}
