import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiEnvSchema, parseEnv, rootEnvFile } from './config/env';
import { validateIngestionEnv } from './config/ingestion-env';
import { mulberry32, sample, seedOf } from './evaluation/random';
import { ReleaseStatus, Store } from './generated/prisma/client';
import { IgdbClient } from './modules/ingestion/igdb/igdb.client';
import { classifyStore, type IgdbWebsite, storeLinks } from './modules/ingestion/igdb/store-links';
import { PrismaService } from './prisma/prisma.service';

// Medição das plataformas e dos links de loja do catálogo (B-84), só leitura no banco. A coleta
// busca na IGDB as plataformas e os websites de cada jogo do catálogo e grava um cache fora do
// repositório; o relatório lê o cache e o banco. As regras da amostra foram fixadas pelo autor
// antes da primeira execução (23/11/2026).
//
//   tsx src/measure-stores.ts --cache <pasta> [--offline] > relatorio.md
//
// Grava também <pasta>/amostra.json, com os links sorteados de cada loja para a conferência.

const GAMES_PER_IGDB_QUERY = 500;
const STORES = Object.values(Store);
const SAMPLE_SEED = 84;
const SAMPLE_SIZE = 10;
const OTHER_STORE_TYPES = new Map([
  [25, 'Meta'],
  [26, 'GameJolt'],
]);
// Redes sociais, wikis e comunidades: não são loja nem site oficial.
const SOCIAL_TYPES = new Set([2, 3, 4, 5, 6, 8, 9, 14, 18, 19]);

// As plataformas de cada loja, pelo nome na IGDB: a cobertura de link da loja é contada entre os
// jogos que têm uma delas.
const STORE_PLATFORMS: Record<Store, RegExp> = {
  STEAM: /^(PC \(Microsoft Windows\)|Mac|Linux)$/,
  ITCH: /^(PC \(Microsoft Windows\)|Mac|Linux)$/,
  GOG: /^(PC \(Microsoft Windows\)|Mac|Linux)$/,
  EPIC: /^(PC \(Microsoft Windows\)|Mac)$/,
  PLAYSTATION: /^PlayStation (3|4|5|Vita)$/,
  MICROSOFT: /^Xbox (360|One|Series X\|S)$/,
  NINTENDO: /^(Nintendo Switch( 2)?|Wii U|(New )?Nintendo 3DS)$/,
  APP_STORE: /^iOS$/,
  GOOGLE_PLAY: /^Android$/,
};

interface IgdbPlatform {
  id: number;
  name: string;
  abbreviation?: string;
  slug: string;
}

interface IgdbStoreRecord {
  id: number;
  platforms?: IgdbPlatform[];
  websites?: IgdbWebsite[];
}

interface CatalogGame {
  igdbId: number;
  slug: string;
  name: string;
  releaseStatus: ReleaseStatus;
  steamAppId: number | null;
  storeUrl: string | null;
}

interface Cache {
  fetchedAt: string;
  games: IgdbStoreRecord[];
}

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf('--cache');
  const cacheDir = at >= 0 ? args[at + 1] : undefined;
  if (!cacheDir) throw new Error('Informe a pasta do cache com --cache <pasta>.');
  const cacheFile = join(cacheDir, 'igdb-stores.json');

  if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);
  const { DATABASE_URL } = parseEnv(apiEnvSchema.pick({ DATABASE_URL: true }), process.env);
  const prisma = new PrismaService(DATABASE_URL);
  try {
    const catalog = await prisma.game.findMany({
      where: { inCatalog: true },
      select: {
        igdbId: true,
        slug: true,
        name: true,
        releaseStatus: true,
        steamAppId: true,
        storeUrl: true,
      },
      orderBy: { igdbId: 'asc' },
    });
    if (!args.includes('--offline')) {
      writeFileSync(cacheFile, JSON.stringify(await collect(catalog)));
      console.error(`Cache gravado em ${cacheFile}`);
    }
    const cache = JSON.parse(readFileSync(cacheFile, 'utf8')) as Cache;
    const { report, samples } = measure(catalog, cache);
    writeFileSync(join(cacheDir, 'amostra.json'), JSON.stringify(samples, null, 2));
    process.stdout.write(`${report}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

async function collect(catalog: readonly CatalogGame[]): Promise<Cache> {
  const env = validateIngestionEnv(process.env);
  const igdb = new IgdbClient({
    credentials: { clientId: env.IGDB_CLIENT_ID, clientSecret: env.IGDB_CLIENT_SECRET },
  });
  const games: IgdbStoreRecord[] = [];
  for (let start = 0; start < catalog.length; start += GAMES_PER_IGDB_QUERY) {
    const ids = catalog.slice(start, start + GAMES_PER_IGDB_QUERY).map((g) => g.igdbId);
    games.push(
      ...((await igdb.query(
        'games',
        `fields platforms.name,platforms.abbreviation,platforms.slug,websites.id,websites.type,websites.url; where id = (${ids.join(',')}); limit ${GAMES_PER_IGDB_QUERY};`,
      )) as IgdbStoreRecord[]),
    );
    console.error(`IGDB: ${Math.min(start + GAMES_PER_IGDB_QUERY, catalog.length)} jogos`);
  }
  return { fetchedAt: new Date().toISOString(), games };
}

interface SampledLink {
  store: Store;
  slug: string;
  name: string;
  url: string;
}

function measure(catalog: readonly CatalogGame[], cache: Cache) {
  const records = new Map(cache.games.map((game) => [game.id, game]));
  const lines: string[] = [];
  const out = (line = '') => lines.push(line);
  const total = catalog.length;
  const released = catalog.filter((g) => g.releaseStatus === ReleaseStatus.RELEASED);
  const upcoming = catalog.filter((g) => g.releaseStatus === ReleaseStatus.UPCOMING);
  const platformsOf = (game: CatalogGame) => records.get(game.igdbId)?.platforms ?? [];
  const websitesOf = (game: CatalogGame) => records.get(game.igdbId)?.websites ?? [];
  const linksOf = new Map(
    catalog.map((game) => [game.igdbId, storeLinks(websitesOf(game), game.steamAppId)]),
  );

  out(`# Plataformas e lojas (B-84): medição de ${new Date().toISOString()}`);
  out();
  out(
    `Catálogo local: ${total} jogos (${released.length} lançados, ${upcoming.length} "Em breve"); IGDB consultada em ${cache.fetchedAt}; ${records.size} jogos encontrados nela.`,
  );
  out();

  out('## Cobertura de plataforma');
  out();
  out('| Grupo | Com plataforma | Fração |');
  out('|---|---|---|');
  for (const [label, games] of [
    ['Catálogo', catalog],
    ['Lançados', released],
    ['"Em breve"', upcoming],
  ] as const) {
    const covered = games.filter((g) => platformsOf(g).length > 0).length;
    out(`| ${label} | ${covered} de ${games.length} | ${percent(covered, games.length)} |`);
  }
  out();

  const platforms = new Map<number, IgdbPlatform & { games: number }>();
  for (const game of catalog) {
    for (const platform of platformsOf(game)) {
      const entry = platforms.get(platform.id) ?? { ...platform, games: 0 };
      entry.games++;
      platforms.set(platform.id, entry);
    }
  }
  out('## Plataformas no catálogo');
  out();
  out('| Id IGDB | Nome | Abreviação | Slug | Jogos |');
  out('|---|---|---|---|---|');
  for (const p of [...platforms.values()].sort((a, b) => b.games - a.games || a.id - b.id)) {
    out(`| ${p.id} | ${p.name} | ${p.abbreviation ?? '—'} | ${p.slug} | ${p.games} |`);
  }
  out();

  out('## Cobertura de link por loja');
  out();
  out(
    'Entre os jogos que têm uma das plataformas da loja; a última coluna conta todos os jogos com link dela, com ou sem a plataforma.',
  );
  out();
  out(
    '| Loja | Plataformas que contam | Jogos com a plataforma | Com link | Fração | Com link, no catálogo todo |',
  );
  out('|---|---|---|---|---|---|');
  for (const store of STORES) {
    const pattern = STORE_PLATFORMS[store];
    const names = [...platforms.values()].filter((p) => pattern.test(p.name)).map((p) => p.name);
    const withPlatform = catalog.filter((g) => platformsOf(g).some((p) => pattern.test(p.name)));
    const hasLink = (g: CatalogGame) => linksOf.get(g.igdbId)!.some((l) => l.store === store);
    const linked = withPlatform.filter(hasLink).length;
    out(
      `| ${store} | ${names.join(', ') || '—'} | ${withPlatform.length} | ${linked} | ${percent(linked, withPlatform.length)} | ${catalog.filter(hasLink).length} |`,
    );
  }
  out();

  out('## Outras contagens');
  out();
  const multiple = new Map<Store, number>();
  for (const game of catalog) {
    const counts = new Map<Store, number>();
    for (const website of websitesOf(game)) {
      const store = classifyStore(website);
      if (store !== null) counts.set(store, (counts.get(store) ?? 0) + 1);
    }
    for (const [store, count] of counts)
      if (count > 1) multiple.set(store, (multiple.get(store) ?? 0) + 1);
  }
  out(
    `- Jogos com mais de um link da mesma loja (fica o de menor id): ${[...multiple].map(([s, n]) => `${s} ${n}`).join(', ') || 'nenhum'}.`,
  );
  const storeAsOfficial = catalog.filter(
    (g) => g.storeUrl !== null && classifyStore({ type: 1, url: g.storeUrl }) !== null,
  ).length;
  out(
    `- Jogos cujo \`storeUrl\` é uma loja (o botão "Página oficial" leva a ela hoje): ${storeAsOfficial} (${percent(storeAsOfficial, total)}).`,
  );
  const steamTyped = (g: CatalogGame) => websitesOf(g).some((w) => w.type === 13);
  out(
    `- Steam: ${catalog.filter((g) => g.steamAppId !== null).length} jogos com \`steamAppId\`; ${catalog.filter((g) => steamTyped(g) && g.steamAppId === null).length} com link de tipo 13 e sem \`steamAppId\`; ${catalog.filter((g) => !steamTyped(g) && g.steamAppId !== null).length} com \`steamAppId\` e sem link de tipo 13.`,
  );
  for (const [type, label] of OTHER_STORE_TYPES) {
    const count = catalog.filter((g) => websitesOf(g).some((w) => w.type === type)).length;
    out(`- Loja fora das nove, ${label} (tipo ${type}): ${count} jogos com link.`);
  }
  const hosts = new Map<string, number>();
  for (const game of catalog) {
    for (const website of websitesOf(game)) {
      if (SOCIAL_TYPES.has(website.type) || OTHER_STORE_TYPES.has(website.type)) continue;
      if (website.type === 1 || classifyStore(website) !== null) continue;
      const host = hostOf(website.url);
      hosts.set(host, (hosts.get(host) ?? 0) + 1);
    }
  }
  out(
    `- Links sem classificação, fora do site oficial, das redes sociais e das lojas Meta e GameJolt, pelos domínios mais frequentes: ${
      [...hosts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([h, n]) => `${h} (${n})`)
        .join(', ') || 'nenhum'
    }.`,
  );
  out();

  out(`## Amostra (semente ${SAMPLE_SEED}, ${SAMPLE_SIZE} por loja)`);
  out();
  const samples: SampledLink[] = [];
  for (const store of STORES) {
    const candidates = catalog.flatMap((game) => {
      const link = linksOf.get(game.igdbId)!.find((l) => l.store === store);
      return link ? [{ store, slug: game.slug, name: game.name, url: link.url }] : [];
    });
    const picked =
      candidates.length <= SAMPLE_SIZE
        ? candidates
        : sample(mulberry32(seedOf(SAMPLE_SEED, store)), candidates, SAMPLE_SIZE);
    samples.push(...picked);
    out(`- ${store}: ${picked.length} de ${candidates.length} links.`);
  }
  return { report: lines.join('\n'), samples };
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '(inválido)';
  }
}

function percent(part: number, whole: number) {
  return whole === 0 ? '—' : `${((100 * part) / whole).toFixed(1)}%`;
}

void main();
