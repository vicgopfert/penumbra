import { ApiErrorSchema, type ProductEvent, UserSchema } from '@indie/contracts';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { BackgroundTasks } from '../src/common/background-tasks';
import { configureApp } from '../src/configure-app';
import { ProductEventsRepository } from '../src/modules/product-events/product-events.repository';
import { usageReport } from '../src/modules/product-events/usage-report';
import { PrismaService } from '../src/prisma/prisma.service';
import { CatalogBuilder } from './support/catalog-builder';
import { createApp, sessionHelpers } from './support/e2e-app';

const pageView: ProductEvent = {
  kind: 'PAGE_VIEW',
  page: 'GAME',
  game: 'celeste',
  visitStart: true,
};

describe('Eventos de uso (POST /api/events)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let helpers: ReturnType<typeof sessionHelpers>;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    helpers = sessionHelpers(app);
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE "User", "Game", "Feature", "Company", "ProductEvent", "AccountDeletion" CASCADE`;
    const catalog = new CatalogBuilder(prisma);
    await catalog.game({ name: 'Celeste', genres: ['Platform'] });
    await catalog.game({ name: 'Hades', genres: ['Roguelike'] });
  });

  afterAll(() => app.close());

  const origin = () => app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN');
  const send = (events: unknown[], cookie?: string) => {
    const call = helpers.server().post('/api/events').set('Origin', origin());
    return (cookie ? call.set('Cookie', cookie) : call).send({ events });
  };
  const rows = () => prisma.productEvent.findMany({ orderBy: { id: 'asc' } });
  const gameId = async (slug: string) =>
    (await prisma.game.findUniqueOrThrow({ where: { slug } })).id;
  const registerWithConsent = async (email: string) => {
    const response = await helpers
      .server()
      .post('/api/auth/register')
      .set('Origin', origin())
      .send({ email, displayName: 'Jogadora', password: 'senha-forte', usageMetricsConsent: true });
    await app.get(BackgroundTasks).drain();
    return String(response.headers['set-cookie']).split(';')[0]!;
  };
  const me = async (cookie: string) =>
    UserSchema.parse((await helpers.as(cookie).get('/api/auth/me')).body);

  it('sem sessão, grava o evento sem conta e com o id do jogo', async () => {
    const response = await send([pageView]);

    expect(response.status).toBe(204);
    expect(await rows()).toMatchObject([
      { kind: 'PAGE_VIEW', page: 'GAME', visitStart: true, userId: null },
    ]);
    expect((await rows())[0]?.gameId).toBe(await gameId('celeste'));
  });

  it('grava a exibição numa linha só, com os ids na ordem da lista', async () => {
    await send([
      { kind: 'LIST_IMPRESSION', list: 'SIMILAR', mode: null, games: ['hades', 'celeste'] },
    ]);

    expect((await rows()).map((row) => row.gameIds)).toEqual([
      [await gameId('hades'), await gameId('celeste')],
    ]);
  });

  it('recusa tipo desconhecido, campo a mais e lote vazio com 400, sem gravar nada', async () => {
    const unknown = await send([{ kind: 'DISMISS', game: 'hades' }]);
    const extra = await send([{ ...pageView, ip: '203.0.113.7' }]);
    const empty = await send([]);

    for (const response of [unknown, extra, empty]) expect(response.status).toBe(400);
    expect(String(ApiErrorSchema.parse(unknown.body).message)).toContain(
      'Tipo de evento desconhecido.',
    );
    expect(await prisma.productEvent.count()).toBe(0);
  });

  it('recusa o envio vindo de outro site', async () => {
    const response = await helpers
      .server()
      .post('/api/events')
      .send({ events: [pageView] });

    expect(response.status).toBe(403);
  });

  it('com sessão e sem consentimento, responde 204 e não grava nada', async () => {
    const cookie = await helpers.register('jogadora@example.com');

    expect((await send([pageView], cookie)).status).toBe(204);
    expect(await prisma.productEvent.count()).toBe(0);
    expect((await me(cookie)).usageMetricsConsentAt).toBeNull();
  });

  it('com o consentimento dado no cadastro, liga os eventos à conta', async () => {
    const cookie = await registerWithConsent('jogadora@example.com');
    const user = await me(cookie);

    await send([pageView], cookie);

    expect(user.usageMetricsConsentAt).not.toBeNull();
    expect((await rows()).map((row) => row.userId)).toEqual([user.id]);
  });

  it('retirar o consentimento apaga só os eventos da conta, e dar de novo grava outra data', async () => {
    const cookie = await registerWithConsent('jogadora@example.com');
    const first = (await me(cookie)).usageMetricsConsentAt;
    await send([pageView], cookie);
    await send([pageView]);

    const withdrawn = await helpers.as(cookie).patch('/api/me', { usageMetricsConsent: false });

    expect(withdrawn.status).toBe(200);
    expect(UserSchema.parse(withdrawn.body).usageMetricsConsentAt).toBeNull();
    expect((await rows()).map((row) => row.userId)).toEqual([null]);

    await send([pageView], cookie);
    expect(await prisma.productEvent.count()).toBe(1);

    const granted = await helpers.as(cookie).patch('/api/me', { usageMetricsConsent: true });
    const again = UserSchema.parse(granted.body).usageMetricsConsentAt;
    expect(again).not.toBeNull();
    expect(again).not.toBe(first);
    const repeated = await helpers.as(cookie).patch('/api/me', { usageMetricsConsent: true });
    expect(UserSchema.parse(repeated.body).usageMetricsConsentAt).toBe(again);
  });

  it('a exclusão da conta apaga os eventos dela', async () => {
    const cookie = await registerWithConsent('jogadora@example.com');
    await send([pageView], cookie);

    await prisma.user.delete({ where: { id: (await me(cookie)).id } });

    expect(await prisma.productEvent.count()).toBe(0);
  });

  it('nenhuma coluna guarda IP, e-mail, navegador ou identificador de visita', async () => {
    const columns = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'ProductEvent'`;
    const names = columns.map(({ column_name }) => column_name).sort();

    expect(names).toEqual(
      [
        'id',
        'kind',
        'occurredAt',
        'userId',
        'page',
        'visitStart',
        'origin',
        'gameId',
        'gameIds',
        'list',
        'mode',
        'position',
        'listPage',
        'exit',
        'store',
      ].sort(),
    );
    for (const name of names) expect(name).not.toMatch(/ip|mail|agent|address|visitId|session/i);
  });

  it('a limpeza apaga só os eventos mais antigos que o corte', async () => {
    const now = new Date();
    await prisma.productEvent.createMany({
      data: [
        { kind: 'PAGE_VIEW', page: 'HOME', occurredAt: new Date('2024-01-01T00:00:00Z') },
        { kind: 'PAGE_VIEW', page: 'HOME', occurredAt: now },
      ],
    });

    const removed = await app.get(ProductEventsRepository).deleteOlderThan(new Date('2025-01-01'));

    expect(removed).toBe(1);
    expect((await rows()).map((row) => row.occurredAt)).toEqual([now]);
  });

  it('o relatório conta o funil, a volta em 7 dias e a taxa por mil jogos exibidos', async () => {
    const at = (iso: string) => new Date(iso);
    const user = (email: string, createdAt: string, consent: boolean, onboarded: boolean) =>
      prisma.user.create({
        data: {
          email,
          passwordHash: 'hash',
          displayName: 'Jogadora',
          createdAt: at(createdAt),
          usageMetricsConsentAt: consent ? at(createdAt) : null,
          onboardingCompletedAt: onboarded ? at(createdAt) : null,
        },
      });
    const voltou = await user('voltou@example.com', '2026-11-02T13:00:00Z', true, true);
    const sumiu = await user('sumiu@example.com', '2026-11-03T13:00:00Z', true, true);
    await user('sem-consentimento@example.com', '2026-11-04T13:00:00Z', false, false);
    const [celeste, hades] = [await gameId('celeste'), await gameId('hades')];
    await prisma.productEvent.createMany({
      data: [
        ...['SEARCH', 'SEARCH', 'DIRECT', 'OTHER_SITE'].map((origin) => ({
          kind: 'PAGE_VIEW' as const,
          page: 'HOME' as const,
          visitStart: true,
          origin: origin as 'SEARCH',
          occurredAt: at('2026-11-02T12:00:00Z'),
        })),
        {
          kind: 'LIST_IMPRESSION',
          list: 'MAIN',
          mode: 'BALANCED',
          gameIds: [celeste, hades],
          occurredAt: at('2026-11-02T14:00:00Z'),
          userId: voltou.id,
        },
        {
          kind: 'RECOMMENDATION_CLICK',
          list: 'MAIN',
          mode: 'BALANCED',
          gameId: hades,
          position: 2,
          occurredAt: at('2026-11-02T14:01:00Z'),
          userId: voltou.id,
        },
        // Na 2ª página do "ver mais", a posição 3 é a 23ª da lista.
        {
          kind: 'RECOMMENDATION_CLICK',
          list: 'INTEREST',
          mode: 'BALANCED',
          gameId: celeste,
          position: 3,
          listPage: 2,
          occurredAt: at('2026-11-02T14:02:00Z'),
          userId: voltou.id,
        },
        // No mesmo dia do cadastro não conta como volta; três dias depois, conta.
        {
          kind: 'PAGE_VIEW',
          page: 'HOME',
          occurredAt: at('2026-11-03T20:00:00Z'),
          userId: sumiu.id,
        },
        {
          kind: 'PAGE_VIEW',
          page: 'HOME',
          occurredAt: at('2026-11-05T12:00:00Z'),
          userId: voltou.id,
        },
        {
          kind: 'EXIT_CLICK',
          exit: 'STORE',
          store: 'STEAM',
          gameId: hades,
          occurredAt: at('2026-11-05T12:05:00Z'),
        },
      ],
    });

    await prisma.accountDeletion.createMany({
      data: [{ deletedOn: at('2026-11-03') }, { deletedOn: at('2026-11-08') }],
    });

    const report = await usageReport(
      prisma,
      { label: '2026-11-01', at: at('2026-11-01T03:00:00Z') },
      { label: '2026-11-08', at: at('2026-11-08T03:00:00Z') },
      at('2026-11-20T00:00:00Z'),
      20,
    );

    expect(report).toContain('| **Total** | **4** |');
    expect(report).toContain('| Cadastros | 3 | 75.0% |');
    expect(report).toContain('| Partida a frio concluída | 2 | 66.7% |');
    expect(report).toContain('| Volta em 7 dias | 1 de 2 | 50.0% |');
    expect(report).toContain('| MAIN | BALANCED | 2 | 1 | 500.0 | 0 | 0.0 |');
    expect(report).toContain('| STORE | STEAM | 1 |');
    expect(report).toContain('| MAIN | 1 a 5 | 1 |');
    expect(report).toContain('| INTEREST | 21 a 50 | 1 |');
    expect(report).toContain('Contas com consentimento: 2 de 3.');
    expect(report).toContain('Contas excluídas no período: 1.');
  });
});

describe('Limite por IP dos eventos de uso', () => {
  let app: INestApplication<App>;

  // Com o throttler de verdade: a aplicação dos outros testes o desliga.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.get(PrismaService).$executeRaw`TRUNCATE "ProductEvent"`;
  });

  afterAll(() => app.close());

  it('o 61º envio no mesmo minuto recebe 429', async () => {
    const origin = app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN');
    const send = () =>
      request(app.getHttpServer())
        .post('/api/events')
        .set('Origin', origin)
        .send({ events: [{ kind: 'PAGE_VIEW', page: 'HOME', visitStart: false }] });

    for (let attempt = 0; attempt < 60; attempt++) expect((await send()).status).toBe(204);

    expect((await send()).status).toBe(429);
  });
});
