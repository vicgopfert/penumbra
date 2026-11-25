import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IngestionStatus } from './generated/prisma/client';
import { rootEnvFile } from './config/env';
import { validateIngestionEnv } from './config/ingestion-env';
import { AccountTokensRepository } from './modules/auth/account-tokens.repository';
import { CredentialsModule } from './modules/auth/credentials.module';
import { SessionsRepository } from './modules/auth/sessions.repository';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { RunIngestionUseCase } from './modules/ingestion/run-ingestion.use-case';
import { ProductEventsRepository } from './modules/product-events/product-events.repository';
import { retentionCutoff } from './modules/product-events/product-events.service';
import { PrismaModule } from './prisma/prisma.module';

// Aplicação sem servidor HTTP: a ingestão nunca disputa recursos com a API.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: rootEnvFile,
      validate: validateIngestionEnv,
    }),
    PrismaModule,
    IngestionModule,
    CredentialsModule,
  ],
  providers: [ProductEventsRepository],
})
class IngestionAppModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(IngestionAppModule);
  try {
    const result = await app.get(RunIngestionUseCase).execute();
    // A limpeza das sessões e dos tokens vencidos e dos eventos de uso com mais de 12 meses
    // aproveita a execução diária da ingestão.
    const now = new Date();
    const sessions = await app.get(SessionsRepository).deleteExpired(now);
    const tokens = await app.get(AccountTokensRepository).deleteExpired(now);
    new Logger('Credentials').log(`${sessions} sessões e ${tokens} tokens vencidos removidos`);
    const events = await app.get(ProductEventsRepository).deleteOlderThan(retentionCutoff(now));
    new Logger('ProductEvents').log(`${events} eventos de uso com mais de 12 meses removidos`);
    process.exitCode = result.status === IngestionStatus.SUCCEEDED ? 0 : 1;
  } finally {
    await app.close();
  }
}

void main();
