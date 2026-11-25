'use client';

import type { DiscoveryMode, RecommendationListKind } from '@indie/contracts';
import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react';
import { GAME_SLUG_ATTRIBUTE } from './game-slug-attribute';
import { track } from './tracker';

const VISIBLE_SHARE = 0.5;

// Uma exibição é um jogo com metade da capa ou do cartão na tela, contado uma vez por lista e por
// carga; os jogos que aparecem juntos viram um evento só. O clique num jogo guarda a posição dele
// na lista mostrada e, no "ver mais", a página.
export function TrackedList({
  list,
  mode,
  games,
  listPage,
  children,
}: {
  list: RecommendationListKind;
  mode: DiscoveryMode | null;
  games: readonly string[];
  listPage?: number | undefined;
  children: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const shown = games.join(' ');

  useEffect(() => {
    if (!container.current || typeof IntersectionObserver === 'undefined') return;
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => slugOf(entry.target))
          .filter((slug) => slug && !seen.has(slug));
        visible.forEach((slug) => seen.add(slug));
        if (visible.length > 0) track({ kind: 'LIST_IMPRESSION', list, mode, games: visible });
      },
      { threshold: VISIBLE_SHARE },
    );
    for (const item of container.current.querySelectorAll(`[${GAME_SLUG_ATTRIBUTE}]`)) {
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, [list, mode, shown]);

  // Só lê o clique, de passagem: quem age é o link do jogo.
  const onClick = (event: MouseEvent) => {
    const item = (event.target as Element).closest('a')?.closest(`[${GAME_SLUG_ATTRIBUTE}]`);
    const game = item ? slugOf(item) : '';
    const position = games.indexOf(game) + 1;
    if (position === 0) return;
    track({
      kind: 'RECOMMENDATION_CLICK',
      game,
      list,
      mode,
      position,
      ...(listPage !== undefined && { listPage }),
    });
  };

  return (
    <div ref={container} onClickCapture={onClick}>
      {children}
    </div>
  );
}

const slugOf = (element: Element) => element.getAttribute(GAME_SLUG_ATTRIBUTE) ?? '';
