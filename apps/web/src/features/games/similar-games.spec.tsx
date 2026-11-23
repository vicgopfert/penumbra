import type { SimilarGames as SimilarGamesResponse } from '@indie/contracts';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sampleGame } from '@/test/catalog';
import { apiError, stubFetch } from '@/test/fetch';
import { SIMILAR_GAMES_TIMEOUT_MS } from './api';
import { SimilarGames } from './similar-games';

const response: SimilarGamesResponse = {
  items: [
    {
      game: sampleGame({ slug: 'ori', name: 'Ori' }),
      reason: {
        kind: 'features',
        features: [
          { slug: 'metroidvania', name: 'Metroidvania' },
          { slug: 'platform', name: 'Plataforma' },
        ],
      },
    },
    {
      game: sampleGame({ slug: 'silksong', name: 'Silksong', releaseStatus: 'UPCOMING' }),
      reason: null,
    },
  ],
};

const renderSection = async () => {
  const section = await SimilarGames({ slug: 'celeste' });
  return render(<>{section}</>);
};

describe('SimilarGames', () => {
  it('mostra as capas com o link da ficha, o "Em breve" e o que os jogos têm em comum', async () => {
    const fetchMock = stubFetch(() => Response.json(response));

    await renderSection();

    const [path, init] = fetchMock.mock.calls[0]!;
    expect(path).toBe('/api/games/celeste/similar');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const section = screen.getByRole('region', { name: 'Jogos semelhantes' });
    const [ori, silksong] = within(section).getAllByRole('listitem');
    expect(within(ori!).getByRole('link', { name: 'Ori' })).toHaveAttribute('href', '/jogos/ori');
    expect(ori).toHaveTextContent('Em comum: Metroidvania, Plataforma');
    expect(ori).not.toHaveTextContent('Em breve');
    expect(within(silksong!).getByRole('link', { name: 'Silksong' })).toBeInTheDocument();
    expect(silksong).toHaveTextContent('Em breve');
    expect(silksong).not.toHaveTextContent('Em comum');
  });

  it('não aparece quando a lista vem vazia', async () => {
    stubFetch(() => Response.json({ items: [] }));

    const { container } = await renderSection();

    expect(container).toBeEmptyDOMElement();
  });

  it('não aparece com o índice indisponível nem com outro erro', async () => {
    for (const reply of [
      () => apiError(503, 'Os jogos semelhantes ainda não estão disponíveis.'),
      () => apiError(404, 'Jogo não encontrado.'),
      () => Response.json({ inesperado: true }),
    ]) {
      stubFetch(reply);

      const { container, unmount } = await renderSection();

      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('não aparece quando a API passa do tempo-limite', async () => {
    const timer = new AbortController();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timer.signal);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Tempo esgotado', 'TimeoutError')),
            );
          }),
      ),
    );

    const pending = SimilarGames({ slug: 'celeste' });
    timer.abort();

    expect(await pending).toBeNull();
    expect(timeout).toHaveBeenCalledWith(SIMILAR_GAMES_TIMEOUT_MS);
    expect(SIMILAR_GAMES_TIMEOUT_MS).toBe(3_000);
  });
});
