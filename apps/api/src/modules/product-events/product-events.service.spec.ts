import type { ProductEvent } from '@indie/contracts';
import type { User } from '../../generated/prisma/client';
import { hashSecretToken } from '../auth/secret-token';
import type { SessionsRepository } from '../auth/sessions.repository';
import type { ProductEventRow, ProductEventsRepository } from './product-events.repository';
import { ProductEventsService, retentionCutoff } from './product-events.service';

const NOW = new Date('2026-11-25T12:00:00Z');
const GAMES = new Map([
  ['celeste', 'id-celeste'],
  ['hades', 'id-hades'],
]);

const account = (usageMetricsConsentAt: Date | null) =>
  ({ id: 'conta-1', usageMetricsConsentAt }) as User;

class FakeEvents implements Pick<ProductEventsRepository, 'gameIdsBySlug' | 'createMany'> {
  readonly rows: ProductEventRow[] = [];

  gameIdsBySlug(slugs: readonly string[]) {
    return Promise.resolve(new Map([...GAMES].filter(([slug]) => slugs.includes(slug))));
  }

  createMany(rows: ProductEventRow[]) {
    this.rows.push(...rows);
    return Promise.resolve(rows.length);
  }
}

describe('ProductEventsService', () => {
  let events: FakeEvents;
  let sessionUser: User | null;

  const service = () => {
    const sessions = {
      findUserOfValidSession: (tokenHash: string) =>
        Promise.resolve(tokenHash === hashSecretToken('token-valido') ? sessionUser : null),
    } as unknown as SessionsRepository;
    return new ProductEventsService(sessions, events as unknown as ProductEventsRepository);
  };

  beforeEach(() => {
    events = new FakeEvents();
    sessionUser = null;
  });

  const pageView: ProductEvent = { kind: 'PAGE_VIEW', page: 'HOME', visitStart: true };

  it('sem sessão, grava o evento sem conta, com a hora do servidor', async () => {
    await service().record([pageView], undefined, NOW);

    expect(events.rows).toEqual([
      {
        kind: 'PAGE_VIEW',
        page: 'HOME',
        visitStart: true,
        origin: null,
        gameId: null,
        userId: null,
        occurredAt: NOW,
      },
    ]);
  });

  it('com sessão e consentimento, liga o evento à conta', async () => {
    sessionUser = account(new Date('2026-11-20T00:00:00Z'));

    await service().record([pageView], 'token-valido', NOW);

    expect(events.rows.map((row) => row.userId)).toEqual(['conta-1']);
  });

  it('com sessão e sem consentimento, não grava nada', async () => {
    sessionUser = account(null);

    expect(await service().record([pageView], 'token-valido', NOW)).toBe(0);
    expect(events.rows).toEqual([]);
  });

  it('com sessão inválida, grava como visitante', async () => {
    sessionUser = account(null);

    await service().record([pageView], 'token-inventado', NOW);

    expect(events.rows.map((row) => row.userId)).toEqual([null]);
  });

  it('troca os slugs pelos ids e tira o que não existe mais', async () => {
    await service().record(
      [
        { kind: 'PAGE_VIEW', page: 'GAME', game: 'sumiu', visitStart: false },
        { kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'BALANCED', games: ['hades', 'sumiu'] },
        { kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'BALANCED', games: ['sumiu'] },
        { kind: 'RECOMMENDATION_CLICK', game: 'sumiu', list: 'MAIN', mode: null, position: 1 },
        {
          kind: 'RECOMMENDATION_CLICK',
          game: 'hades',
          list: 'INTEREST',
          mode: 'POPULAR',
          position: 4,
          listPage: 3,
        },
        { kind: 'EXIT_CLICK', game: 'celeste', exit: 'STORE', store: 'STEAM' },
        { kind: 'WANT_TO_PLAY', game: 'hades', list: 'UPCOMING', mode: 'DISCOVERY' },
      ],
      undefined,
      NOW,
    );

    const base = { userId: null, occurredAt: NOW };
    expect(events.rows).toEqual([
      { ...base, kind: 'PAGE_VIEW', page: 'GAME', visitStart: false, origin: null, gameId: null },
      { ...base, kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'BALANCED', gameIds: ['id-hades'] },
      {
        ...base,
        kind: 'RECOMMENDATION_CLICK',
        list: 'INTEREST',
        mode: 'POPULAR',
        position: 4,
        listPage: 3,
        gameId: 'id-hades',
      },
      { ...base, kind: 'EXIT_CLICK', exit: 'STORE', store: 'STEAM', gameId: 'id-celeste' },
      { ...base, kind: 'WANT_TO_PLAY', list: 'UPCOMING', mode: 'DISCOVERY', gameId: 'id-hades' },
    ]);
  });

  it('guarda os eventos por 12 meses', () => {
    expect(retentionCutoff(NOW)).toEqual(new Date('2025-11-25T12:00:00Z'));
  });
});
