import type { FeatureType, ReleaseStatus } from '../../../generated/prisma/client';
import type { IgdbWebsite } from '../igdb/store-links';

// O jogo como a ingestão o entende, já traduzido da IGDB: é o que critério, alertas e gravação usam.
export interface MappedCompany {
  igdbId: number;
  name: string;
  countryCode: number | null;
  isDeveloper: boolean;
  isPublisher: boolean;
}

export interface MappedFeature {
  type: FeatureType;
  igdbId: number;
  name: string;
  slug: string;
  // Só nas etiquetas da Steam (GameFeature.rank).
  rank?: number | null;
}

export interface MappedLanguageSupport {
  languageIgdbId: number;
  interface: boolean;
  subtitles: boolean;
  audio: boolean;
}

export interface MappedPlatform {
  igdbId: number;
  slug: string;
  name: string;
  abbreviation: string | null;
}

export interface MappedGame {
  igdbId: number;
  slug: string;
  name: string;
  summary: string | null;
  coverImageId: string | null;
  firstReleaseDate: Date | null;
  releaseStatus: ReleaseStatus;
  isCancelled: boolean;
  storeUrl: string | null;
  studioCountryCode: number | null;
  ratingCount: number;
  hypes: number;
  companies: MappedCompany[];
  features: MappedFeature[];
  languages: MappedLanguageSupport[];
  platforms: MappedPlatform[];
  // Os links da IGDB, para os links de loja: o da Steam depende do id do jogo nela, que a ingestão
  // só conhece depois do mapeamento.
  websites: IgdbWebsite[];
}
