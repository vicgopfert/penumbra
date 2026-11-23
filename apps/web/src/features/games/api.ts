import { GameDetailSchema, SimilarGamesSchema } from '@indie/contracts';
import { cache } from 'react';
import { apiFetch } from '@/lib/api-client';

// A página e os metadados pedem o mesmo jogo na mesma renderização: uma chamada só.
export const getGame = cache((slug: string) =>
  apiFetch(`/games/${encodeURIComponent(slug)}`, { schema: GameDetailSchema }),
);

// A seção chega em streaming, e a resposta da ficha só termina quando ela resolve: numa API
// lenta, a página ficaria carregando. Passado o tempo-limite, a ficha termina sem a seção (B-50).
export const SIMILAR_GAMES_TIMEOUT_MS = 3_000;

export const getSimilarGames = (slug: string) =>
  apiFetch(`/games/${encodeURIComponent(slug)}/similar`, {
    schema: SimilarGamesSchema,
    signal: AbortSignal.timeout(SIMILAR_GAMES_TIMEOUT_MS),
  });
