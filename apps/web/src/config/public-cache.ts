import type { PublicCache } from '@/lib/api-client';

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

// As tags que a ingestão revalida no fim de cada execução (POST /internal/revalidate, B-102).
export const PUBLIC_CACHE_TAGS = ['games', 'collections', 'catalog'] as const;

// O catálogo muda na ingestão diária, que revalida tudo; os prazos só valem quando ela não roda.
export const PUBLIC_CACHE = {
  game: { revalidate: DAY, tags: ['games'] },
  collections: { revalidate: HOUR, tags: ['collections'] },
  catalogSearch: { revalidate: HOUR, tags: ['catalog'] },
  catalogOptions: { revalidate: DAY, tags: ['catalog'] },
} satisfies Record<string, PublicCache>;

// Sem o dado no cache, a página espera a API até este limite e depois avisa que o servidor está
// acordando: o Render dorme sem uso e leva até um minuto para voltar.
export const SERVER_WAIT_MS = 8_000;

export const serverWait = () => AbortSignal.timeout(SERVER_WAIT_MS);
