import { existsSync } from 'node:fs';
import { apiEnvSchema, parseEnv, rootEnvFile } from './config/env';
import { usageReport } from './modules/product-events/usage-report';
import { readScoringConfig } from './modules/recommendation/scoring/scoring-config';
import { PrismaService } from './prisma/prisma.service';

// Relatório das métricas de uso (B-100), só leitura no banco. Datas no horário de Brasília, que
// não tem horário de verão desde 2019; o fim é exclusivo. Contra produção, o DATABASE_URL do
// terminal vale mais que o do .env.
//
//   pnpm events:report --from 2026-11-25 --to 2026-12-02 > relatorio.md
//
// As definições estão em docs/metricas-de-uso.md. O tamanho da página do "ver mais", para a
// posição na lista inteira, vem da configuração atual (config/recommendation.json).

const BRASILIA = '-03:00';

async function main() {
  const { from, to } = period(process.argv.slice(2));
  if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);
  const { DATABASE_URL } = parseEnv(apiEnvSchema.pick({ DATABASE_URL: true }), process.env);
  const prisma = new PrismaService(DATABASE_URL);
  try {
    const { pageSize } = readScoringConfig().lists;
    console.log(await usageReport(prisma, from, to, new Date(), pageSize));
  } finally {
    await prisma.$disconnect();
  }
}

function period(args: string[]) {
  const value = (flag: string) => {
    const at = args.indexOf(flag);
    const date = at >= 0 ? args[at + 1] : undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Informe ${flag} AAAA-MM-DD.`);
    }
    return { label: date, at: new Date(`${date}T00:00:00${BRASILIA}`) };
  };
  return { from: value('--from'), to: value('--to') };
}

void main();
