import type { ProductEvent } from '@indie/contracts';
import { Injectable } from '@nestjs/common';
import { hashSecretToken } from '../auth/secret-token';
import { SessionsRepository } from '../auth/sessions.repository';
import { type ProductEventRow, ProductEventsRepository } from './product-events.repository';

// Os eventos ficam 12 meses; a limpeza diária, que roda com a ingestão, apaga os mais antigos.
export const PRODUCT_EVENT_RETENTION_MONTHS = 12;

export function retentionCutoff(now: Date) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - PRODUCT_EVENT_RETENTION_MONTHS);
  return cutoff;
}

@Injectable()
export class ProductEventsService {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly events: ProductEventsRepository,
  ) {}

  // A conta vem da sessão, nunca do navegador. Sem sessão, o evento é anônimo; com sessão e sem
  // consentimento, nada é gravado, porque a lista mostrada a uma conta identifica o perfil dela.
  // Um jogo que não existe mais tira o evento, ou só o jogo, na página vista e na exibição.
  async record(events: readonly ProductEvent[], sessionToken: unknown, now = new Date()) {
    const user =
      typeof sessionToken === 'string'
        ? await this.sessions.findUserOfValidSession(hashSecretToken(sessionToken), now)
        : null;
    if (user && !user.usageMetricsConsentAt) return 0;

    const ids = await this.events.gameIdsBySlug(events.flatMap(slugsOf));
    const base = { userId: user?.id ?? null, occurredAt: now };
    const rows = events.flatMap((event): ProductEventRow[] => {
      const row = toRow(event, (slug) => ids.get(slug));
      return row ? [{ ...base, ...row }] : [];
    });
    return this.events.createMany(rows);
  }
}

function slugsOf(event: ProductEvent): string[] {
  if (event.kind === 'LIST_IMPRESSION') return event.games;
  return event.game === undefined ? [] : [event.game];
}

type RowFields = Omit<ProductEventRow, 'userId' | 'occurredAt'>;

function toRow(event: ProductEvent, idOf: (slug: string) => string | undefined): RowFields | null {
  switch (event.kind) {
    case 'PAGE_VIEW':
      return {
        kind: event.kind,
        page: event.page,
        visitStart: event.visitStart,
        origin: event.origin ?? null,
        gameId: event.game === undefined ? null : (idOf(event.game) ?? null),
      };
    case 'LIST_IMPRESSION': {
      const gameIds = event.games.flatMap((slug) => idOf(slug) ?? []);
      return gameIds.length === 0
        ? null
        : { kind: event.kind, list: event.list, mode: event.mode, gameIds };
    }
    case 'RECOMMENDATION_CLICK':
      return withGame(idOf(event.game), {
        kind: event.kind,
        list: event.list,
        mode: event.mode,
        position: event.position,
        listPage: event.listPage ?? null,
      });
    case 'WANT_TO_PLAY':
      return withGame(idOf(event.game), {
        kind: event.kind,
        list: event.list ?? null,
        mode: event.mode ?? null,
      });
    case 'EXIT_CLICK':
      return withGame(idOf(event.game), {
        kind: event.kind,
        exit: event.exit,
        store: event.store ?? null,
      });
  }
}

const withGame = (gameId: string | undefined, fields: RowFields) =>
  gameId === undefined ? null : { ...fields, gameId };
