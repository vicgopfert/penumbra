import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { JsonLd } from '@/components/json-ld';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { listCollectionsOrNull } from '@/features/collections/api';
import { CollectionShowcase } from '@/features/collections/collection-showcase';
import { COLLECTIONS_LOADING } from '@/features/collections/collection-states';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// O nome do site no resultado da busca vem deste WebSite, lido só na página inicial (B-114).
const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: absoluteUrl('/'),
};

// Renderizada a cada pedido, sem ir à API quando as coleções estão no cache de dados (B-102).
// Gerada no build, guardaria a resposta da API daquele momento; e force-dynamic desligaria o cache.
export const revalidate = 0;

// A vitrine vem num Suspense: com a API acordando, o resto da página não espera por ela.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
      <JsonLd data={WEBSITE} />
      <h1 className="text-2xl font-semibold">{siteConfig.name}</h1>
      <p>{siteConfig.description}</p>
      <Button asChild>
        <Link href="/catalogo">Ver o catálogo</Link>
      </Button>
      <section aria-labelledby="explore-by-culture" className="space-y-4 pt-6">
        <h2 id="explore-by-culture" className="text-xl font-semibold">
          Explore por cultura
        </h2>
        <Suspense fallback={<p>{COLLECTIONS_LOADING}</p>}>
          <CollectionShowcase collections={listCollectionsOrNull()} titleAs="h3" retryHref="/" />
        </Suspense>
      </section>
    </main>
  );
}
