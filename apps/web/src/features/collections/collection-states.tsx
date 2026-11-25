import Link from 'next/link';
import { ServerWaking } from '@/components/server-waking';

export const COLLECTIONS_LOADING = 'Carregando coleções…';

export function CollectionsUnavailable({
  retryHref,
  noindex,
}: {
  retryHref: string;
  noindex: boolean;
}) {
  return (
    <ServerWaking
      title="Não foi possível carregar as coleções"
      retryHref={retryHref}
      noindex={noindex}
    />
  );
}

export function CollectionUnavailable({ retryHref }: { retryHref: string }) {
  return <ServerWaking title="Não foi possível carregar a coleção" retryHref={retryHref} />;
}

export function PageBeyondCollection({ firstPageHref }: { firstPageHref: string }) {
  return (
    <p>
      Esta página não existe nesta coleção.{' '}
      <Link href={firstPageHref} className="underline">
        Voltar para a primeira página
      </Link>
    </p>
  );
}
