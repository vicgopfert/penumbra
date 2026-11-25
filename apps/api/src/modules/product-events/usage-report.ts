import { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

// Relatório das métricas de uso (B-100), com as definições do docs/metricas-de-uso.md. Os eventos
// de quem está na conta só existem com o consentimento dela; os números de conta vêm das datas
// já guardadas no User.

const RETURN_DAYS = 7;
// O consentimento dado no cadastro grava a mesma hora do pedido; a conta é criada no mesmo instante.
const SIGNUP_CONSENT_WINDOW = "interval '1 minute'";

type Count = { count: bigint };

export type Bound = { label: string; at: Date };

// A posição na lista inteira: no "ver mais", a posição conta dentro da página, e o clique leva o
// número dela; pageSize é o tamanho da página na configuração da API (lists.pageSize).
export async function usageReport(
  prisma: PrismaService,
  from: Bound,
  to: Bound,
  now: Date,
  pageSize: number,
) {
  const inPeriod = Prisma.sql`"occurredAt" >= ${from.at} AND "occurredAt" < ${to.at}`;
  const lines: string[] = [];
  const out = (line = '') => lines.push(line);
  const count = async (query: Prisma.Sql) =>
    Number((await prisma.$queryRaw<Count[]>(query))[0]?.count ?? 0);

  out(`# Métricas de uso de ${from.label} a ${to.label} (fim exclusivo, horário de Brasília)`);
  out();
  out(`Gerado em ${now.toISOString()}.`);
  out();

  const origins = await prisma.$queryRaw<{ origin: string | null; count: bigint }[]>`
    SELECT "origin", count(*) AS count FROM "ProductEvent"
    WHERE "kind" = 'PAGE_VIEW' AND "visitStart" AND ${inPeriod}
    GROUP BY "origin" ORDER BY count DESC`;
  const visits = origins.reduce((sum, row) => sum + Number(row.count), 0);
  out('## Visitas por origem');
  out();
  out('| Origem | Visitas |');
  out('| --- | ---: |');
  for (const { origin, count } of origins) out(`| ${origin ?? '(sem origem)'} | ${count} |`);
  out(`| **Total** | **${visits}** |`);
  out();

  const pages = await prisma.$queryRaw<{ page: string; count: bigint }[]>`
    SELECT "page", count(*) AS count FROM "ProductEvent"
    WHERE "kind" = 'PAGE_VIEW' AND ${inPeriod}
    GROUP BY "page" ORDER BY count DESC`;
  out('## Páginas vistas');
  out();
  out('| Página | Vistas |');
  out('| --- | ---: |');
  for (const { page, count } of pages) out(`| ${page} | ${count} |`);
  out();

  const createdInPeriod = Prisma.sql`"createdAt" >= ${from.at} AND "createdAt" < ${to.at}`;
  const signups = await count(Prisma.sql`
    SELECT count(*) AS count FROM "User" WHERE ${createdInPeriod}`);
  const onboarded = await count(Prisma.sql`
    SELECT count(*) AS count FROM "User"
    WHERE ${createdInPeriod} AND "onboardingCompletedAt" IS NOT NULL`);
  const consentAtSignup = Prisma.sql`
    "usageMetricsConsentAt" IS NOT NULL
    AND "usageMetricsConsentAt" - "createdAt" < ${Prisma.raw(SIGNUP_CONSENT_WINDOW)}`;
  const windowClosed = Prisma.sql`
    "createdAt" <= ${new Date(now.getTime() - RETURN_DAYS * 86_400_000)}`;
  const cohort = await count(Prisma.sql`
    SELECT count(*) AS count FROM "User"
    WHERE ${createdInPeriod} AND ${consentAtSignup} AND ${windowClosed}`);
  const returned = await count(Prisma.sql`
    SELECT count(*) AS count FROM "User" u
    WHERE ${createdInPeriod} AND ${consentAtSignup} AND ${windowClosed}
    AND EXISTS (
      SELECT 1 FROM "ProductEvent" e
      WHERE e."userId" = u."id"
      AND (e."occurredAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
        > (u."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
      AND e."occurredAt" <= u."createdAt" + ${Prisma.raw(`interval '${RETURN_DAYS} days'`)}
    )`);
  out('## Funil');
  out();
  out('| Etapa | Número | Sobre a etapa anterior |');
  out('| --- | ---: | ---: |');
  out(`| Visitas | ${visits} | |`);
  out('| Experimentar | — (B-105) | |');
  out(`| Cadastros | ${signups} | ${percent(signups, visits)} |`);
  out(`| Partida a frio concluída | ${onboarded} | ${percent(onboarded, signups)} |`);
  out(`| Volta em ${RETURN_DAYS} dias | ${returned} de ${cohort} | ${percent(returned, cohort)} |`);
  out();
  out(
    `A volta conta só as contas com consentimento desde o cadastro e com os ${RETURN_DAYS} dias já ` +
      'passados: um evento num dia seguinte ao do cadastro, até 7 dias depois dele.',
  );
  out();
  // As datas de AccountDeletion já estão no dia de Brasília (B-52).
  const deletions = await count(Prisma.sql`
    SELECT count(*) AS count FROM "AccountDeletion"
    WHERE "deletedOn" >= ${from.label}::date AND "deletedOn" < ${to.label}::date`);
  out(
    `Contas excluídas no período: ${deletions}. Os cadastros acima contam só as contas que ainda ` +
      'existem, e a exclusão não guarda a data do cadastro.',
  );
  out();

  const listRows = await prisma.$queryRaw<
    { list: string; mode: string | null; shown: bigint; clicks: bigint; wants: bigint }[]
  >`
    SELECT "list", "mode",
      sum(cardinality("gameIds")) FILTER (WHERE "kind" = 'LIST_IMPRESSION') AS shown,
      count(*) FILTER (WHERE "kind" = 'RECOMMENDATION_CLICK') AS clicks,
      count(*) FILTER (WHERE "kind" = 'WANT_TO_PLAY') AS wants
    FROM "ProductEvent"
    WHERE "list" IS NOT NULL AND ${inPeriod}
    GROUP BY "list", "mode" ORDER BY "list", "mode"`;
  out('## Recomendações por lista e modo');
  out();
  out('| Lista | Modo | Jogos exibidos | Cliques | Por mil | "Quero jogar" | Por mil |');
  out('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
  for (const { list, mode, shown, clicks, wants } of listRows) {
    const exhibitions = Number(shown ?? 0);
    out(
      `| ${list} | ${mode ?? '—'} | ${exhibitions} | ${clicks} | ${perThousand(Number(clicks), exhibitions)} | ` +
        `${wants} | ${perThousand(Number(wants), exhibitions)} |`,
    );
  }
  const unattributed = await count(Prisma.sql`
    SELECT count(*) AS count FROM "ProductEvent"
    WHERE "kind" = 'WANT_TO_PLAY' AND "list" IS NULL AND ${inPeriod}`);
  out();
  out(`"Quero jogar" sem recomendação antes, na mesma aba: ${unattributed}.`);
  out();

  const positions = await prisma.$queryRaw<{ list: string; bucket: string; count: bigint }[]>`
    SELECT "list",
      CASE WHEN absolute <= 5 THEN '1 a 5' WHEN absolute <= 10 THEN '6 a 10'
        WHEN absolute <= 20 THEN '11 a 20' WHEN absolute <= 50 THEN '21 a 50'
        ELSE '51 ou mais' END AS bucket,
      count(*) AS count
    FROM (
      SELECT "list", (coalesce("listPage", 1) - 1) * ${pageSize} + "position" AS absolute
      FROM "ProductEvent" WHERE "kind" = 'RECOMMENDATION_CLICK' AND ${inPeriod}
    ) clicks
    GROUP BY "list", bucket ORDER BY "list", min(absolute)`;
  out('## Cliques por posição na lista');
  out();
  out(`Posição na lista inteira, com páginas de ${pageSize} jogos no "ver mais".`);
  out();
  out('| Lista | Posição | Cliques |');
  out('| --- | --- | ---: |');
  for (const { list, bucket, count } of positions) out(`| ${list} | ${bucket} | ${count} |`);
  out();

  const exits = await prisma.$queryRaw<{ exit: string; store: string | null; count: bigint }[]>`
    SELECT "exit", "store", count(*) AS count FROM "ProductEvent"
    WHERE "kind" = 'EXIT_CLICK' AND ${inPeriod}
    GROUP BY "exit", "store" ORDER BY count DESC`;
  out('## Cliques de saída');
  out();
  out('| Tipo | Loja | Cliques |');
  out('| --- | --- | ---: |');
  for (const { exit, store, count } of exits) out(`| ${exit} | ${store ?? '—'} | ${count} |`);
  out();

  const perDay = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT ("occurredAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date AS day,
      count(*) AS count
    FROM "ProductEvent" WHERE ${inPeriod} GROUP BY day ORDER BY day`;
  const total = await count(Prisma.sql`SELECT count(*) AS count FROM "ProductEvent"`);
  const linked = await count(Prisma.sql`
    SELECT count(*) AS count FROM "ProductEvent" WHERE "userId" IS NOT NULL`);
  const consenting = await count(Prisma.sql`
    SELECT count(*) AS count FROM "User" WHERE "usageMetricsConsentAt" IS NOT NULL`);
  const accounts = await count(Prisma.sql`SELECT count(*) AS count FROM "User"`);
  const [size] = await prisma.$queryRaw<{ size: string }[]>`
    SELECT pg_size_pretty(pg_total_relation_size('"ProductEvent"')) AS size`;
  out('## Volume');
  out();
  out('| Dia | Linhas |');
  out('| --- | ---: |');
  for (const { day, count } of perDay) out(`| ${day.toISOString().slice(0, 10)} | ${count} |`);
  out();
  out(`- Linhas na tabela: ${total}, das quais ${linked} ligadas a uma conta.`);
  out(`- Tamanho da tabela com os índices: ${size?.size ?? '—'}.`);
  out(`- Contas com consentimento: ${consenting} de ${accounts}.`);

  return lines.join('\n');
}

function percent(part: number, whole: number) {
  return whole === 0 ? '—' : `${((100 * part) / whole).toFixed(1)}%`;
}

function perThousand(part: number, whole: number) {
  return whole === 0 ? '—' : ((1000 * part) / whole).toFixed(1);
}
