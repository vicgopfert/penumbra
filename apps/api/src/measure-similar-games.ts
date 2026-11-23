import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { apiEnvSchema, parseEnv, rootEnvFile } from './config/env';
import { mulberry32, sample } from './evaluation/random';
import { ReleaseStatus } from './generated/prisma/client';
import type { ContentIndex, ContentVector } from './modules/recommendation/content-index';
import { ContentIndexService } from './modules/recommendation/content-index.service';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { SimilarGamesCache, similarGames } from './modules/recommendation/scoring/similar-games';
import { readSimilarGamesConfig } from './modules/recommendation/scoring/similar-games-config';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';

// Medição dos jogos semelhantes da ficha (B-50) no catálogo do banco, só leitura. As regras que
// escolhem a semelhança mínima e a capacidade do cache foram fixadas pelo autor antes da primeira
// execução (23/11/2026) e estão aqui, para a escolha ser refeita do mesmo jeito.
//
//   node --expose-gc dist/measure-similar-games.js > relatorio.md

const MIN_SIMILARITY_GRID = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
// O maior valor da grade com no máximo esta fração dos jogos sem a seção.
const MAX_WITHOUT_SECTION = 0.05;
// Se o cache com o catálogo inteiro couber nisto, a capacidade cobre o catálogo com folga.
const CACHE_MEMORY_LIMIT_MB = 10;
const FULL_CATALOG_CAPACITY = 30_000;
const SAMPLE_SEED = 50;
const SAMPLE_SIZE = 10;
const PERCENTILES = [5, 10, 25, 50, 75, 90];
const MB = 1024 * 1024;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: rootEnvFile,
      validate: (env) => parseEnv(apiEnvSchema.pick({ DATABASE_URL: true }), env),
    }),
    PrismaModule,
    RecommendationModule,
  ],
})
class MeasureModule {}

interface Neighbors {
  positions: number[];
  values: number[];
}

async function measure() {
  if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);
  const app = await NestFactory.createApplicationContext(MeasureModule, { logger: ['error'] });
  try {
    const contentIndex = app.get(ContentIndexService);
    await contentIndex.settled();
    const index = contentIndex.index;
    if (!index) throw new Error('O índice de conteúdo não carregou.');
    const config = readSimilarGamesConfig();
    const lines: string[] = [];
    const out = (line = '') => lines.push(line);

    // Um vizinho a mais que o tamanho, para ver se o corte cai num empate.
    const times: number[] = [];
    const all = index.games.map((game, position): Neighbors => {
      const start = performance.now();
      const positions = similarGames(index, position, { size: config.size + 1, minSimilarity: 0 });
      times.push(performance.now() - start);
      return { positions, values: positions.map((p) => dot(game, index.games[p]!)) };
    });
    const total = index.games.length;

    out(`# Jogos semelhantes na ficha (B-50): medição de ${new Date().toISOString()}`);
    out();
    out(
      `Catálogo do índice: ${total} jogos; tamanho ${config.size}, mínimo de ${config.minItems} jogos na seção.`,
    );
    out();
    out('## Cosseno do 1º e do 6º vizinho');
    out();
    out(`| Vizinho | ${PERCENTILES.map((p) => `p${p}`).join(' | ')} | Jogos sem ele |`);
    out(`|---|${PERCENTILES.map(() => '---').join('|')}|---|`);
    for (const rank of [1, config.size]) {
      const values = all.flatMap(({ values }) => values.slice(rank - 1, rank));
      out(
        `| ${rank}º | ${PERCENTILES.map((p) => percentile(values, p).toFixed(3)).join(' | ')} | ${total - values.length} |`,
      );
    }
    out();

    out('## Semelhança mínima');
    out();
    out(
      `Regra fixada antes de medir: o maior valor da grade com no máximo ${percent(MAX_WITHOUT_SECTION)} dos jogos sem a seção.`,
    );
    out();
    out('| Semelhança mínima | Jogos sem a seção | Fração |');
    out('|---|---|---|');
    let chosen = MIN_SIMILARITY_GRID[0]!;
    for (const minimum of MIN_SIMILARITY_GRID) {
      const without = all.filter((n) => shown(n, minimum, config.size) < config.minItems).length;
      if (without / total <= MAX_WITHOUT_SECTION) chosen = minimum;
      out(`| ${minimum} | ${without} | ${percent(without / total)} |`);
    }
    out();
    out(`**Pela regra: ${chosen}.**`);
    out();

    const withSection = all.filter((n) => shown(n, chosen, config.size) >= config.minItems);
    const neighbors = withSection.flatMap(({ positions, values }) =>
      positions.slice(0, shown({ positions, values }, chosen, config.size)),
    );
    const upcoming = (positions: readonly number[]) =>
      positions.filter((p) => index.games[p]!.releaseStatus === ReleaseStatus.UPCOMING).length;
    const catalogPositions = index.games.map((_, p) => p);
    out('## Jogos "Em breve" e empates, com a semelhança mínima escolhida');
    out();
    out(
      `- "Em breve" entre os vizinhos mostrados: ${upcoming(neighbors)} de ${neighbors.length} (${percent(upcoming(neighbors) / neighbors.length)}); no catálogo: ${percent(upcoming(catalogPositions) / total)}.`,
    );
    const tiedAtCut = all.filter(
      ({ values }) =>
        values.length > config.size && values[config.size - 1] === values[config.size],
    ).length;
    out(
      `- Jogos em que o ${config.size}º vizinho empata com o ${config.size + 1}º (o desempate decide quem aparece): ${tiedAtCut} (${percent(tiedAtCut / total)}).`,
    );
    out();

    out('## Tempo da seleção (varredura do índice inteiro), no local');
    out();
    out(
      `Mediana ${percentile(times, 50).toFixed(2)} ms, p95 ${percentile(times, 95).toFixed(2)} ms, máximo ${Math.max(...times).toFixed(2)} ms, em ${total} jogos.`,
    );
    out();

    const perEntry = cacheMemory(index, all, config.size);
    const fullMb = (perEntry * total) / MB;
    const capacity =
      fullMb <= CACHE_MEMORY_LIMIT_MB
        ? FULL_CATALOG_CAPACITY
        : Math.floor((CACHE_MEMORY_LIMIT_MB * MB) / perEntry);
    out('## Memória do cache');
    out();
    out(
      `Regra fixada antes de medir: se o catálogo inteiro couber em ${CACHE_MEMORY_LIMIT_MB} MB, a capacidade é ${FULL_CATALOG_CAPACITY}; se não, a maior que caiba.`,
    );
    out();
    out(
      `- Cache cheio com os ${total} jogos: ${fullMb.toFixed(1)} MB (${perEntry.toFixed(0)} bytes por jogo, heap mais arrayBuffers, depois do gc).`,
    );
    out(`- **Pela regra: ${capacity}.**`);
    out();

    out('## Amostra (ilustração, sem critério)');
    out();
    const names = await namesOf(app.get(PrismaService));
    const random = mulberry32(SAMPLE_SEED);
    for (const position of sample(random, catalogPositions, SAMPLE_SIZE)) {
      const game = index.games[position]!;
      const n = all[position]!;
      const count = shown(n, chosen, config.size);
      const list = n.positions
        .slice(0, count)
        .map((p, i) => `${names.get(index.games[p]!.id)} (${n.values[i]!.toFixed(3)})`);
      out(
        `- **${names.get(game.id)}**: ${count < config.minItems ? `sem a seção (${count} acima do mínimo)` : list.join('; ')}`,
      );
    }

    process.stdout.write(`${lines.join('\n')}\n`);
  } finally {
    await app.close();
  }
}

// Quantos dos primeiros `size` vizinhos chegam à semelhança mínima; estão em ordem decrescente.
function shown({ values }: Neighbors, minimum: number, size: number) {
  let count = 0;
  while (count < Math.min(size, values.length) && values[count]! >= minimum) count++;
  return count;
}

function dot(a: ContentVector, b: ContentVector) {
  let sum = 0;
  for (let i = 0, j = 0; i < a.featurePositions.length && j < b.featurePositions.length;) {
    if (a.featurePositions[i] === b.featurePositions[j]) sum += a.weights[i++]! * b.weights[j++]!;
    else if (a.featurePositions[i]! < b.featurePositions[j]!) i++;
    else j++;
  }
  return sum;
}

// Os bytes de cada jogo no cache, com a lista no tamanho da seção: a diferença de heap e
// arrayBuffers entre o cache vazio e cheio, cada um medido depois do gc.
function cacheMemory(index: ContentIndex, all: readonly Neighbors[], size: number): number {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (!gc) throw new Error('Rode com node --expose-gc.');
  const used = () => {
    gc();
    const { heapUsed, arrayBuffers } = process.memoryUsage();
    return heapUsed + arrayBuffers;
  };
  const before = used();
  const cache = new SimilarGamesCache(index.games.length);
  index.games.forEach(({ id }, position) =>
    cache.of(id, () => all[position]!.positions.slice(0, size)),
  );
  const after = used();
  if (cache.size !== index.games.length) throw new Error('O cache não guardou todos os jogos.');
  return (after - before) / index.games.length;
}

async function namesOf(prisma: PrismaService) {
  const games = await prisma.game.findMany({
    where: { inCatalog: true },
    select: { id: true, name: true },
  });
  return new Map(games.map(({ id, name }) => [id, name]));
}

function percentile(values: readonly number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? NaN;
}

function percent(fraction: number) {
  return `${(fraction * 100).toFixed(1)}%`;
}

void measure();
