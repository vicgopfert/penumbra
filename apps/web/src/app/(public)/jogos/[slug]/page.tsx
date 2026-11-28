import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { JsonLd } from '@/components/json-ld';
import { CATALOG_PATH } from '@/features/catalog/search-params';
import { getGame } from '@/features/games/api';
import { GameDetails } from '@/features/games/game-details';
import { gameDescription, gameJsonLd, gameTitle } from '@/features/games/game-seo';
import { GameUnavailable } from '@/features/games/game-states';
import { gameHref } from '@/features/games/paths';
import { SimilarGames } from '@/features/games/similar-games';
import { ApiRequestError } from '@/lib/api-client';
import { igdbImageUrl } from '@/lib/igdb';

type GamePageProps = { params: Promise<{ slug: string }> };

async function loadGame(slug: string) {
  try {
    return { game: await getGame(slug) };
  } catch (error) {
    const missing = error instanceof ApiRequestError && error.status === 404;
    return { game: null, missing };
  }
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { game, missing } = await loadGame((await params).slug);
  if (!game) return { title: missing ? 'Jogo não encontrado' : 'Jogo' };

  const title = gameTitle(game);
  const description = gameDescription(game);
  return {
    title,
    description,
    alternates: { canonical: gameHref(game.slug) },
    openGraph: {
      title,
      description,
      ...(game.coverImageId && { images: [igdbImageUrl(game.coverImageId, 'cover_big_2x')] }),
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const { game, missing } = await loadGame(slug);
  // Jogo inexistente ou fora do catálogo responde 404. Este segmento não tem loading.tsx de
  // propósito: com ele, a resposta começa em streaming e o 404 sairia com status 200. Os jogos
  // semelhantes chegam em streaming só depois desta decisão, sem mudar o status nem segurar a ficha.
  if (missing) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link href={CATALOG_PATH} className="text-sm underline">
        Voltar ao catálogo
      </Link>
      {game ? (
        <>
          <JsonLd data={gameJsonLd(game)} />
          <GameDetails game={game} />
          <Suspense fallback={null}>
            <SimilarGames slug={game.slug} />
          </Suspense>
        </>
      ) : (
        <GameUnavailable retryHref={gameHref(slug)} />
      )}
    </main>
  );
}
