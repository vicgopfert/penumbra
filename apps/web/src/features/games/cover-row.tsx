import type { GameSummary } from '@indie/contracts';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { GAME_SLUG_ATTRIBUTE } from '@/features/metrics/game-slug-attribute';
import { cn } from '@/lib/utils';
import { GameCover } from './game-cover';

const COLUMNS = { 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6' } as const;

// Só as capas: o nome vai no link para leitores de tela e no title para quem passa o mouse; a
// legenda, quando houver, vem abaixo da capa, fora do link. Abaixo de 640 px, a fileira rola na
// horizontal em vez de encolher as capas.
export function CoverRow<Item extends { game: GameSummary }>({
  items,
  columns = 5,
  caption,
}: {
  items: readonly Item[];
  columns?: keyof typeof COLUMNS;
  caption?: (item: Item) => ReactNode;
}) {
  return (
    <ul
      className={cn(
        'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:overflow-visible sm:pb-0',
        COLUMNS[columns],
      )}
    >
      {items.map((item) => (
        <li
          key={item.game.slug}
          {...{ [GAME_SLUG_ATTRIBUTE]: item.game.slug }}
          className="w-24 shrink-0 snap-start space-y-1 sm:w-auto"
        >
          <Link
            href={`/jogos/${item.game.slug}`}
            aria-label={item.game.name}
            title={item.game.name}
            className="block rounded-md hover:opacity-90"
          >
            <GameCover name={item.game.name} coverImageId={item.game.coverImageId} size="fluid" />
          </Link>
          {caption?.(item)}
        </li>
      ))}
    </ul>
  );
}
