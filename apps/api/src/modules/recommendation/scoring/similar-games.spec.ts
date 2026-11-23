import { ReleaseStatus } from '../../../generated/prisma/client';
import type { ContentIndex } from '../content-index';
import { gameId, gameOf, scoringIndex, tasteIndex } from './scoring.fixture';
import { commonAttributes, SimilarGamesCache, similarGames } from './similar-games';
import { sourceSimilarity } from './source-similarity';
import { seededTieBreak } from './tie-break';

const positionOf = (index: ContentIndex, slug: string) => index.positionByGameId.get(gameId(slug))!;

const slugsOf = (index: ContentIndex, positions: readonly number[]) =>
  positions.map((position) => index.games[position]!.slug);

const cosine = (index: ContentIndex, source: string, target: string) => {
  const { positions, values } = sourceSimilarity(index, gameOf(index, source));
  const j = positions.indexOf(positionOf(index, target));
  return j < 0 ? 0 : values[j]!;
};

describe('similarGames', () => {
  const index = scoringIndex();

  it('ordena pelo cosseno com o jogo da ficha e nunca inclui o próprio jogo', () => {
    const neighbors = slugsOf(
      index,
      similarGames(index, positionOf(index, 'dead-cells'), { size: 50, minSimilarity: 0 }),
    );

    expect(neighbors).not.toContain('dead-cells');
    expect(neighbors).toEqual(expect.arrayContaining(['hades', 'spelunky', 'celeste']));
    const values = neighbors.map((slug) => cosine(index, 'dead-cells', slug));
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('não usa a popularidade: os empatados saem pelo sorteio com o jogo da ficha como semente', () => {
    const twins = ['hades', 'popular-rogue', 'obscure-rogue'];
    const source = 'hades';
    const neighbors = slugsOf(
      index,
      similarGames(index, positionOf(index, source), { size: 2, minSimilarity: 0 }),
    );

    const tied = twins.filter((slug) => slug !== source).map(gameId);
    const expected = tied.sort(seededTieBreak(gameId(source))).map((id) => id.slice(2));
    expect(neighbors).toEqual(expected);
  });

  it('corta pela semelhança mínima e pelo tamanho', () => {
    const position = positionOf(index, 'dead-cells');
    const all = similarGames(index, position, { size: 50, minSimilarity: 0 });
    const minimum = cosine(index, 'dead-cells', index.games[all[2]!]!.slug);

    const above = slugsOf(
      index,
      similarGames(index, position, { size: 50, minSimilarity: minimum }),
    );

    expect(above.every((slug) => cosine(index, 'dead-cells', slug) >= minimum)).toBe(true);
    expect(above.length).toBeLessThan(all.length);
    expect(similarGames(index, position, { size: 2, minSimilarity: 0 })).toEqual(all.slice(0, 2));
  });

  it('inclui os jogos "Em breve"', () => {
    const taste = tasteIndex();

    const neighbors = similarGames(taste, positionOf(taste, 'saga-1'), {
      size: 50,
      minSimilarity: 0,
    });

    expect(slugsOf(taste, neighbors)).toContain('saga-soon');
    expect(gameOf(taste, 'saga-soon').releaseStatus).toBe(ReleaseStatus.UPCOMING);
  });

  it('devolve lista vazia para jogo sem atributos', () => {
    expect(
      similarGames(index, positionOf(index, 'no-tags'), { size: 6, minSimilarity: 0 }),
    ).toEqual([]);
  });
});

describe('commonAttributes', () => {
  const index = scoringIndex();
  const reasonOf = (source: string, target: string) =>
    commonAttributes(index, gameOf(index, source))(gameOf(index, target));

  it('mostra os atributos dos dois jogos pela contribuição ao cosseno, até 3', () => {
    const reason = reasonOf('inside', 'limbo');
    const limbo = gameOf(index, 'limbo');
    const contribution = (slug: string) => {
      const position = index.features.findIndex((feature) => feature.slug === slug);
      return limbo.weights[limbo.featurePositions.indexOf(position)]! ** 2;
    };

    const slugs = reason!.features.map(({ slug }) => slug);
    expect(slugs.sort()).toEqual(['horror', 'platform', 'puzzle']);
    const ordered = reason!.features.map(({ slug }) => contribution(slug));
    expect(ordered).toEqual([...ordered].sort((a, b) => b - a));
  });

  it('segue a ordem de grupos do motivo: a etiqueta de prateleira vem antes', () => {
    expect(reasonOf('celeste', 'free-solo')!.features.map(({ slug }) => slug)).toEqual([
      'rock-climbing',
    ]);
  });

  it('não mostra o que só um dos jogos tem', () => {
    const slugs = reasonOf('dead-cells', 'hades')!.features.map(({ slug }) => slug);

    expect(slugs).not.toContain('platform');
    expect(slugs).not.toContain('pixel-art');
  });
});

describe('SimilarGamesCache', () => {
  it('calcula cada jogo uma vez só', () => {
    const cache = new SimilarGamesCache(10);
    const compute = jest.fn(() => [3, 1, 2]);

    expect([...cache.of('g-1', compute)]).toEqual([3, 1, 2]);
    expect([...cache.of('g-1', compute)]).toEqual([3, 1, 2]);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('guarda também a lista vazia', () => {
    const cache = new SimilarGamesCache(10);
    const compute = jest.fn(() => []);

    cache.of('g-1', compute);
    cache.of('g-1', compute);

    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('tira o usado há mais tempo quando passa da capacidade', () => {
    const cache = new SimilarGamesCache(2);
    const compute = jest.fn(() => [1]);

    cache.of('g-1', compute);
    cache.of('g-2', compute);
    cache.of('g-1', compute);
    cache.of('g-3', compute);
    cache.of('g-1', compute);
    cache.of('g-2', compute);

    expect(cache.size).toBe(2);
    expect(compute).toHaveBeenCalledTimes(4);
  });
});
