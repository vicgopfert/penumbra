import {
  CountryOptionSchema,
  FeatureOptionSchema,
  type FeatureQuery,
  GamePageSchema,
  type GameSearchQuery,
  PlatformOptionSchema,
} from '@indie/contracts';
import { PUBLIC_CACHE, serverWait } from '@/config/public-cache';
import { apiFetch } from '@/lib/api-client';
import { toSearchParams } from './search-params';

export const searchGames = (query: GameSearchQuery) =>
  apiFetch(`/games?${toSearchParams(query).toString()}`, {
    schema: GamePageSchema,
    cache: PUBLIC_CACHE.catalogSearch,
    signal: serverWait(),
  });

export const listFeatures = (type: FeatureQuery['type']) =>
  apiFetch(`/features?type=${type}`, {
    schema: FeatureOptionSchema.array(),
    cache: PUBLIC_CACHE.catalogOptions,
    signal: serverWait(),
  });

export const listCountries = () =>
  apiFetch('/countries', {
    schema: CountryOptionSchema.array(),
    cache: PUBLIC_CACHE.catalogOptions,
    signal: serverWait(),
  });

// Sem as opções de plataforma, o catálogo continua com os outros filtros: a falha vira lista vazia,
// que esconde o filtro (a Vercel publica a web antes de o Render publicar a rota, B-85).
export const listPlatformsOrEmpty = () =>
  apiFetch('/platforms', {
    schema: PlatformOptionSchema.array(),
    cache: PUBLIC_CACHE.catalogOptions,
    signal: serverWait(),
  }).catch(() => []);
