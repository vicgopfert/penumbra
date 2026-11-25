import type { SimilarGame } from '@indie/contracts';
import { TrackedList } from '@/features/metrics/tracked-list';
import { getSimilarGames } from './api';
import { CoverRow } from './cover-row';
import { UpcomingBadge } from './upcoming-badge';

// Carregada à parte da ficha, dentro de um Suspense. Sem jogos, com o índice indisponível, com
// qualquer erro ou passado o tempo-limite, a ficha fica sem a seção.
export async function SimilarGames({ slug }: { slug: string }) {
  const items = await getSimilarGames(slug).then(
    ({ items }) => items,
    () => [],
  );
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="similar-games" className="space-y-3">
      <h2 id="similar-games" className="font-medium">
        Jogos semelhantes
      </h2>
      <TrackedList list="SIMILAR" mode={null} games={items.map(({ game }) => game.slug)}>
        <CoverRow items={items} columns={6} caption={SimilarGameCaption} />
      </TrackedList>
    </section>
  );
}

function SimilarGameCaption({ game, reason }: SimilarGame) {
  return (
    <>
      <UpcomingBadge releaseStatus={game.releaseStatus} />
      {reason && (
        <p className="text-xs text-muted-foreground">
          Em comum: {reason.features.map(({ name }) => name).join(', ')}
        </p>
      )}
    </>
  );
}
