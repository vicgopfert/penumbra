import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApiErrorSchema, UserSchema } from '@indie/contracts';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { BackgroundTasks } from '../src/common/background-tasks';
import { configureApp } from '../src/configure-app';
import { brasiliaDay } from '../src/modules/auth/account-deletion.service';
import { MAILER } from '../src/modules/mail/mailer';
import { PrismaService } from '../src/prisma/prisma.service';
import { CatalogBuilder } from './support/catalog-builder';
import { createApp, sessionHelpers } from './support/e2e-app';
import { FakeMailer } from './support/fake-mailer';

const PASSWORD = 'senha-forte';

// Cada modelo ligado ao User, com a coluna da chave, lido do schema: um modelo novo entra sozinho
// na conferência de que nada da conta sobra.
function userTables() {
  const schema = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf8');
  return [...schema.matchAll(/^model (?<model>\w+) \{\n(?<body>[\s\S]*?)^\}/gm)].flatMap(
    ({ groups }) =>
      [
        ...(groups?.body ?? '').matchAll(
          /^\s+\w+\s+User\??\s+@relation\(fields: \[(?<key>\w+)\]/gm,
        ),
      ].map((relation) => ({ table: groups?.model ?? '', key: relation.groups?.key ?? '' })),
  );
}

describe('Exclusão da própria conta (DELETE /api/me)', () => {
  const mailer = new FakeMailer();
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let helpers: ReturnType<typeof sessionHelpers>;

  beforeAll(async () => {
    app = await createApp((builder) => builder.overrideProvider(MAILER).useValue(mailer));
    prisma = app.get(PrismaService);
    helpers = sessionHelpers(app);
    await prisma.$executeRaw`TRUNCATE "User", "Game", "Feature", "Company" CASCADE`;
    const catalog = new CatalogBuilder(prisma);
    await catalog.game({ name: 'Celeste', genres: ['Platform'], themes: ['Horror'] });
    await catalog.game({ name: 'Hades', genres: ['Roguelike'] });
    // Só os atributos com peso no vetor podem ser escolhidos como gosto.
    await prisma.feature.updateMany({ data: { idf: 1 } });
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE "User", "ProductEvent", "AccountDeletion" CASCADE`;
    mailer.clear();
  });

  afterAll(() => app.close());

  const origin = () => app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN');
  const idOf = async (cookie: string) =>
    UserSchema.parse((await helpers.as(cookie).get('/api/auth/me')).body).id;
  const deleteAccount = (cookie: string, password = PASSWORD) =>
    helpers
      .server()
      .delete('/api/me')
      .set('Cookie', cookie)
      .set('Origin', origin())
      .send({ password });
  const rowsOf = async (userId: string) =>
    Object.fromEntries(
      await Promise.all(
        userTables().map(async ({ table, key }) => {
          const [row] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT count(*) AS count FROM "${table}" WHERE "${key}" = $1::uuid`,
            userId,
          );
          return [table, Number(row?.count)] as const;
        }),
      ),
    );

  // Um pouco de tudo: nota, lista, gosto, evento de uso com consentimento, link de confirmação
  // pendente e duas sessões.
  async function fullAccount(email: string) {
    const cookie = await helpers.register(email);
    const as = helpers.as(cookie);
    await as.put('/api/me/ratings/celeste', { score: 5 });
    await as.put('/api/me/lists/want-to-play/hades');
    await as.put('/api/me/preferences', { genres: ['platform', 'roguelike'], themes: ['horror'] });
    await as.patch('/api/me', { usageMetricsConsent: true });
    await helpers
      .server()
      .post('/api/events')
      .set('Cookie', cookie)
      .set('Origin', origin())
      .send({ events: [{ kind: 'PAGE_VIEW', page: 'HOME', visitStart: true }] });
    await helpers
      .server()
      .post('/api/auth/login')
      .set('Origin', origin())
      .send({ email, password: PASSWORD });
    return { cookie, id: await idOf(cookie) };
  }

  it('confere que o schema tem as tabelas ligadas à conta', () => {
    expect(
      userTables()
        .map(({ table }) => table)
        .sort(),
    ).toEqual(
      ['AccountToken', 'ListEntry', 'ProductEvent', 'Rating', 'Session', 'UserPreference'].sort(),
    );
  });

  it('com a senha certa, apaga a conta e tudo o que é dela, e só dela', async () => {
    const jogadora = await fullAccount('jogadora@example.com');
    const outra = await fullAccount('outra@example.com');
    const before = await rowsOf(jogadora.id);
    expect(Object.entries(before).filter(([, count]) => count === 0)).toEqual([]);
    const outraBefore = await rowsOf(outra.id);

    const response = await deleteAccount(jogadora.cookie);

    expect(response.status).toBe(204);
    expect(String(response.headers['set-cookie'])).toMatch(/^sid=;.*Expires=Thu, 01 Jan 1970/);
    expect(await prisma.user.count({ where: { id: jogadora.id } })).toBe(0);
    expect(Object.entries(await rowsOf(jogadora.id)).filter(([, count]) => count !== 0)).toEqual(
      [],
    );
    expect(await rowsOf(outra.id)).toEqual(outraBefore);
    expect((await helpers.as(jogadora.cookie).get('/api/auth/me')).status).toBe(401);
    const login = await helpers
      .server()
      .post('/api/auth/login')
      .set('Origin', origin())
      .send({ email: 'jogadora@example.com', password: PASSWORD });
    expect(login.status).toBe(401);
  });

  it('conta a exclusão só pela data, no dia de Brasília', async () => {
    const { cookie } = await fullAccount('jogadora@example.com');

    await deleteAccount(cookie);

    const rows = await prisma.accountDeletion.findMany();
    expect(rows.map(({ deletedOn }) => deletedOn)).toEqual([brasiliaDay(new Date())]);
    expect(Object.keys(rows[0]!).sort()).toEqual(['deletedOn', 'id']);
  });

  it('com a senha errada, responde 400 no campo e não apaga nada', async () => {
    const { cookie, id } = await fullAccount('jogadora@example.com');
    const before = await rowsOf(id);

    const response = await deleteAccount(cookie, 'senha-errada');

    expect(response.status).toBe(400);
    expect(ApiErrorSchema.parse(response.body).message).toBe('password: Senha incorreta.');
    expect(await rowsOf(id)).toEqual(before);
    expect(await prisma.accountDeletion.count()).toBe(0);
  });

  it('sem senha responde 400; sem sessão, 401; vindo de outro site, 403', async () => {
    const { cookie } = await fullAccount('jogadora@example.com');

    const noPassword = await helpers
      .server()
      .delete('/api/me')
      .set('Cookie', cookie)
      .set('Origin', origin())
      .send({});
    const noSession = await helpers.server().delete('/api/me').set('Origin', origin()).send({
      password: PASSWORD,
    });
    const otherSite = await helpers
      .server()
      .delete('/api/me')
      .set('Cookie', cookie)
      .send({ password: PASSWORD });

    expect([noPassword.status, noSession.status, otherSite.status]).toEqual([400, 401, 403]);
    expect(await prisma.user.count()).toBe(1);
  });

  it('avisa por e-mail só o endereço confirmado, sem o nome da pessoa', async () => {
    const confirmed = await fullAccount('confirmada@example.com');
    const unconfirmed = await fullAccount('pendente@example.com');
    await prisma.user.update({
      where: { id: confirmed.id },
      data: { emailConfirmedAt: new Date(), displayName: 'Nome Que Não Vai' },
    });
    await app.get(BackgroundTasks).drain();
    mailer.clear();

    await deleteAccount(confirmed.cookie);
    await deleteAccount(unconfirmed.cookie);
    await app.get(BackgroundTasks).drain();

    expect(mailer.sent.map(({ to, subject }) => [to, subject])).toEqual([
      ['confirmada@example.com', 'A sua conta na Penumbra foi excluída'],
    ]);
    expect(mailer.sent[0]?.text).not.toContain('Nome Que Não Vai');
  });
});

describe('Limite das tentativas de exclusão da conta', () => {
  let app: INestApplication<App>;

  // Com o throttler de verdade: a aplicação dos outros testes o desliga.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MAILER)
      .useValue(new FakeMailer())
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.get(PrismaService).$executeRaw`TRUNCATE "User" CASCADE`;
  });

  afterAll(() => app.close());

  it('a 6ª senha errada no mesmo minuto recebe 429', async () => {
    const origin = app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN');
    const registered = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Origin', origin)
      .send({ email: 'jogadora@example.com', displayName: 'Jogadora', password: PASSWORD });
    await app.get(BackgroundTasks).drain();
    const cookie = String(registered.headers['set-cookie']).split(';')[0]!;
    const attempt = () =>
      request(app.getHttpServer())
        .delete('/api/me')
        .set('Cookie', cookie)
        .set('Origin', origin)
        .send({ password: 'senha-errada' });

    for (let index = 0; index < 5; index++) expect((await attempt()).status).toBe(400);

    expect((await attempt()).status).toBe(429);
  });
});
