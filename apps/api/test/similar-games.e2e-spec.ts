import { ApiErrorSchema, SimilarGamesSchema } from '@indie/contracts';
import { type INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { ReleaseStatus } from '../src/generated/prisma/client';
import { ContentIndexRepository } from '../src/modules/recommendation/content-index.repository';
import { ContentIndexService } from '../src/modules/recommendation/content-index.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { CatalogBuilder } from './support/catalog-builder';
import { createApp, sessionHelpers } from './support/e2e-app';

const PLATFORM_FANTASY = { genres: ['Platform', 'Adventure'], themes: ['Fantasy'] };

describe('Jogos semelhantes (GET /games/:slug/similar)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let helpers: ReturnType<typeof sessionHelpers>;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    helpers = sessionHelpers(app);
  });

  // O IDF vem da ingestão; aqui todo atributo vale 1, e o índice é recarregado com o catálogo novo.
  // Com a semelhança mínima da configuração (0,5), Hollow Knight tem 4 vizinhos: Celeste, com só
  // metade dos gêneros e outro tema, fica abaixo dela.
  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE "User", "Game", "Feature", "Company" CASCADE`;
    const catalog = new CatalogBuilder(prisma);
    const games = [
      { name: 'Hollow Knight', ...PLATFORM_FANTASY, popularity: 0.9 },
      { name: 'Ori', ...PLATFORM_FANTASY, popularity: 0.8 },
      {
        name: 'Hollow Knight Silksong',
        ...PLATFORM_FANTASY,
        status: ReleaseStatus.UPCOMING,
        popularity: 0.95,
      },
      { name: 'Dead Cells', genres: ['Platform', 'Adventure'], themes: ['Fantasy', 'Action'] },
      { name: 'Rain World', genres: ['Platform', 'Adventure'], themes: ['Survival'] },
      { name: 'Celeste', genres: ['Platform'], themes: ['Action'], popularity: 0.99 },
      { name: 'Retirado', ...PLATFORM_FANTASY, inCatalog: false },
      { name: 'Darkwood', genres: ['Shooter'], themes: ['Horror'] },
    ];
    for (const game of games) await catalog.game(game);
    await prisma.feature.updateMany({ data: { idf: 1 } });
    await app.get(ContentIndexService).reload();
  });

  afterAll(() => app.close());

  const similar = async (slug: string, request = helpers.server().get.bind(helpers.server())) => {
    const response = await request(`/api/games/${slug}/similar`);
    expect(response.status).toBe(200);
    return SimilarGamesSchema.parse(response.body);
  };
  const slugsOf = async (slug: string) => (await similar(slug)).items.map((i) => i.game.slug);

  it('traz os semelhantes sem o próprio jogo, com o "Em breve" e sem quem está abaixo do mínimo', async () => {
    const slugs = await slugsOf('hollow-knight');

    expect(slugs).not.toContain('hollow-knight');
    expect([...slugs].sort()).toEqual(
      ['dead-cells', 'hollow-knight-silksong', 'ori', 'rain-world'].sort(),
    );
    expect(slugs.slice(2)).toEqual(['dead-cells', 'rain-world']);
    const { items } = await similar('hollow-knight');
    const silksong = items.find((i) => i.game.slug === 'hollow-knight-silksong')!;
    expect(silksong.game.releaseStatus).toBe(ReleaseStatus.UPCOMING);
  });

  it('mostra o que os dois jogos têm em comum, com os nomes em português', async () => {
    const { items } = await similar('hollow-knight');
    const ori = items.find((i) => i.game.slug === 'ori')!;
    const rainWorld = items.find((i) => i.game.slug === 'rain-world')!;

    expect(ori.reason!.features.map((f) => f.name).sort()).toEqual(
      ['Aventura', 'Fantasia', 'Plataforma'].sort(),
    );
    expect(rainWorld.reason!.features.map((f) => f.name).sort()).toEqual(
      ['Aventura', 'Plataforma'].sort(),
    );
  });

  it('dá a mesma resposta com e sem sessão, para qualquer usuário', async () => {
    const jogadora = await helpers.register('jogadora@example.com');
    const outra = await helpers.register('outra@example.com');
    await helpers.as(jogadora).put('/api/me/ratings/ori', { score: 5 });

    const anonymous = await similar('hollow-knight');

    expect(await similar('hollow-knight', helpers.as(jogadora).get)).toEqual(anonymous);
    expect(await similar('hollow-knight', helpers.as(outra).get)).toEqual(anonymous);
  });

  it('vem vazia abaixo do mínimo de jogos', async () => {
    expect(await similar('darkwood')).toEqual({ items: [] });
  });

  it('aplica o mínimo depois de tirar o vizinho que saiu do catálogo desde a última carga', async () => {
    await prisma.game.updateMany({ where: { slug: 'rain-world' }, data: { inCatalog: false } });

    expect(await similar('hollow-knight')).toEqual({ items: [] });
  });

  it('responde 404 para jogo inexistente ou fora do catálogo', async () => {
    for (const slug of ['nao-existe', 'retirado']) {
      const response = await helpers.server().get(`/api/games/${slug}/similar`);

      expect(response.status).toBe(404);
      expect(ApiErrorSchema.parse(response.body).message).toBe('Jogo não encontrado.');
    }
    expect(await slugsOf('ori')).not.toContain('retirado');
  });
});

describe('Jogos semelhantes com o índice indisponível', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp((builder) =>
      builder
        .overrideProvider(ContentIndexRepository)
        .useValue({ loadRows: () => Promise.reject(new Error('banco fora do ar')) }),
    );
  });

  afterAll(() => app.close());

  it('responde 503 com mensagem clara, nunca lista vazia', async () => {
    const response = await sessionHelpers(app).server().get('/api/games/hollow-knight/similar');

    expect(response.status).toBe(503);
    expect(ApiErrorSchema.parse(response.body).message).toBe(
      'Os jogos semelhantes ainda não estão disponíveis; tente novamente em alguns instantes.',
    );
  });
});
