import {
  EXIT_KINDS,
  PRODUCT_EVENT_KINDS,
  PRODUCT_EVENTS_MAX,
  PRODUCT_PAGES,
  ProductEventBatchSchema,
  ProductEventSchema,
  RECOMMENDATION_LIST_KINDS,
  VISIT_ORIGINS,
} from '@indie/contracts';
import {
  ExitKind,
  ProductEventKind,
  ProductPage,
  RecommendationListKind,
  VisitOrigin,
} from '../../generated/prisma/client';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message);

describe('contrato dos eventos de uso', () => {
  it.each([
    ['tipos', PRODUCT_EVENT_KINDS, ProductEventKind],
    ['páginas', PRODUCT_PAGES, ProductPage],
    ['listas', RECOMMENDATION_LIST_KINDS, RecommendationListKind],
    ['origens', VISIT_ORIGINS, VisitOrigin],
    ['saídas', EXIT_KINDS, ExitKind],
  ])('tem as mesmas %s do banco', (_, contract, database) => {
    expect([...contract].sort()).toEqual(Object.values(database).sort());
  });

  it.each([
    { kind: 'PAGE_VIEW', page: 'HOME', visitStart: true, origin: 'SEARCH' },
    { kind: 'PAGE_VIEW', page: 'GAME', game: 'celeste', visitStart: false },
    { kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'DISCOVERY', games: ['celeste', 'hades'] },
    { kind: 'LIST_IMPRESSION', list: 'SIMILAR', mode: null, games: ['celeste'] },
    { kind: 'RECOMMENDATION_CLICK', game: 'hades', list: 'INTEREST', mode: 'POPULAR', position: 3 },
    {
      kind: 'RECOMMENDATION_CLICK',
      game: 'hades',
      list: 'MAIN',
      mode: 'BALANCED',
      position: 3,
      listPage: 2,
    },
    { kind: 'WANT_TO_PLAY', game: 'hades' },
    { kind: 'WANT_TO_PLAY', game: 'hades', list: 'UPCOMING', mode: 'BALANCED' },
    { kind: 'EXIT_CLICK', game: 'hades', exit: 'STORE', store: 'STEAM' },
    { kind: 'EXIT_CLICK', game: 'hades', exit: 'OFFICIAL_SITE' },
  ])('aceita $kind', (event) => {
    expect(ProductEventSchema.parse(event)).toEqual(event);
  });

  it('recusa tipo desconhecido', () => {
    expect(messages(ProductEventSchema.safeParse({ kind: 'DISMISS', game: 'hades' }))).toEqual([
      'Tipo de evento desconhecido.',
    ]);
  });

  it('recusa campo fora do tipo, como um IP ou o navegador', () => {
    for (const extra of [{ ip: '203.0.113.7' }, { userAgent: 'Mozilla/5.0' }, { userId: 'x' }]) {
      const event = { kind: 'PAGE_VIEW', page: 'HOME', visitStart: true, ...extra };
      expect(ProductEventSchema.safeParse(event).success).toBe(false);
    }
  });

  it('exige a loja só no clique de saída para loja', () => {
    for (const event of [
      { kind: 'EXIT_CLICK', game: 'hades', exit: 'STORE' },
      { kind: 'EXIT_CLICK', game: 'hades', exit: 'OFFICIAL_SITE', store: 'STEAM' },
    ]) {
      expect(messages(ProductEventSchema.safeParse(event))).toEqual([
        'A loja vai só no clique de saída para loja.',
      ]);
    }
  });

  it('recusa exibição sem jogos e posição fora da lista', () => {
    const impression = { kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'BALANCED', games: [] };
    const click = {
      kind: 'RECOMMENDATION_CLICK',
      game: 'hades',
      list: 'MAIN',
      mode: 'BALANCED',
      position: 0,
    };
    expect(ProductEventSchema.safeParse(impression).success).toBe(false);
    expect(ProductEventSchema.safeParse(click).success).toBe(false);
  });

  it('recusa página do "ver mais" fora do limite e o campo nos outros tipos', () => {
    const click = { kind: 'RECOMMENDATION_CLICK', game: 'hades', list: 'MAIN', mode: null };
    for (const listPage of [0, 1.5, 1001]) {
      expect(ProductEventSchema.safeParse({ ...click, position: 1, listPage }).success).toBe(false);
    }
    expect(
      ProductEventSchema.safeParse({ kind: 'WANT_TO_PLAY', game: 'hades', listPage: 2 }).success,
    ).toBe(false);
  });

  it(`aceita lotes de 1 a ${PRODUCT_EVENTS_MAX} eventos`, () => {
    const event = { kind: 'PAGE_VIEW', page: 'HOME', visitStart: false };
    const batch = (size: number) => ({ events: Array.from({ length: size }, () => event) });

    expect(ProductEventBatchSchema.safeParse(batch(1)).success).toBe(true);
    expect(ProductEventBatchSchema.safeParse(batch(PRODUCT_EVENTS_MAX)).success).toBe(true);
    expect(ProductEventBatchSchema.safeParse(batch(0)).success).toBe(false);
    expect(ProductEventBatchSchema.safeParse(batch(PRODUCT_EVENTS_MAX + 1)).success).toBe(false);
  });
});
