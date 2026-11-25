import { z } from 'zod';
import { DISCOVERY_MODES } from './auth';
import { STORES } from './catalog';
import { RECOMMENDATIONS_PAGE_MAX } from './recommendation';

// Métricas de uso (B-100). A lista de tipos é fechada: um tipo novo entra no contrato, no enum do
// banco e na política de privacidade no mesmo PR. Nenhum evento leva IP, e-mail, navegador ou
// identificador de visita; a conta só é ligada pela API, com o consentimento gravado nela.
export const PRODUCT_EVENT_KINDS = [
  'PAGE_VIEW',
  'LIST_IMPRESSION',
  'RECOMMENDATION_CLICK',
  'WANT_TO_PLAY',
  'EXIT_CLICK',
] as const;

export const PRODUCT_PAGES = [
  'HOME',
  'CATALOG',
  'GAME',
  'COLLECTIONS',
  'COLLECTION',
  'RECOMMENDATIONS',
  'RECOMMENDATION_LIST',
  'PROFILE',
  'ONBOARDING',
  'ACCOUNT',
  'LEGAL',
  'OTHER',
] as const;

export type ProductPage = (typeof PRODUCT_PAGES)[number];

// Só o tipo da lista: a chave da prateleira por jogo traz um jogo da biblioteca.
export const RECOMMENDATION_LIST_KINDS = [
  'MAIN',
  'LIKED_GAME',
  'INTEREST',
  'UPCOMING',
  'SIMILAR',
] as const;

export type RecommendationListKind = (typeof RECOMMENDATION_LIST_KINDS)[number];

// De onde veio a visita, em categoria, sem o endereço da página de origem.
export const VISIT_ORIGINS = ['DIRECT', 'SEARCH', 'OTHER_SITE'] as const;

export type VisitOrigin = (typeof VISIT_ORIGINS)[number];

export const EXIT_KINDS = ['STORE', 'OFFICIAL_SITE'] as const;

export const PRODUCT_EVENTS_MAX = 20;
export const IMPRESSION_GAMES_MAX = 50;
export const LIST_POSITION_MAX = 1000;

const GameSlugSchema = z.string().min(1).max(200);
const ListKindSchema = z.enum(RECOMMENDATION_LIST_KINDS);
// Os semelhantes da ficha não dependem do modo.
const ModeSchema = z.enum(DISCOVERY_MODES).nullable();

export const ProductEventSchema = z.discriminatedUnion(
  'kind',
  [
    z.strictObject({
      kind: z.literal('PAGE_VIEW'),
      page: z.enum(PRODUCT_PAGES),
      game: GameSlugSchema.optional(),
      // Primeira página da aba: é ela que conta como visita, e só ela leva a origem.
      visitStart: z.boolean(),
      origin: z.enum(VISIT_ORIGINS).optional(),
    }),
    z.strictObject({
      kind: z.literal('LIST_IMPRESSION'),
      list: ListKindSchema,
      mode: ModeSchema,
      games: z.array(GameSlugSchema).min(1).max(IMPRESSION_GAMES_MAX),
    }),
    z.strictObject({
      kind: z.literal('RECOMMENDATION_CLICK'),
      game: GameSlugSchema,
      list: ListKindSchema,
      mode: ModeSchema,
      position: z.number().int().min(1).max(LIST_POSITION_MAX),
      // Só no "ver mais", onde a posição conta dentro da página; o relatório calcula a posição na
      // lista inteira com o tamanho da página da configuração da API.
      listPage: z.number().int().min(1).max(RECOMMENDATIONS_PAGE_MAX).optional(),
    }),
    // A lista e o modo só quando o jogo foi aberto por uma recomendação na mesma aba.
    z.strictObject({
      kind: z.literal('WANT_TO_PLAY'),
      game: GameSlugSchema,
      list: ListKindSchema.optional(),
      mode: ModeSchema.optional(),
    }),
    z
      .strictObject({
        kind: z.literal('EXIT_CLICK'),
        game: GameSlugSchema,
        exit: z.enum(EXIT_KINDS),
        store: z.enum(STORES).optional(),
      })
      .refine(({ exit, store }) => (exit === 'STORE') === (store !== undefined), {
        error: 'A loja vai só no clique de saída para loja.',
        path: ['store'],
      }),
  ],
  { error: 'Tipo de evento desconhecido.' },
);

export type ProductEvent = z.infer<typeof ProductEventSchema>;

export const ProductEventBatchSchema = z.strictObject({
  events: z.array(ProductEventSchema).min(1).max(PRODUCT_EVENTS_MAX),
});

export type ProductEventBatch = z.infer<typeof ProductEventBatchSchema>;
