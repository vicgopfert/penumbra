import type { ReleaseStatus } from '../../../generated/prisma/client';

export interface StoredGame {
  igdbId: number;
  name: string;
  inCatalog: boolean;
  firstReleaseDate: Date | null;
  releaseStatus: ReleaseStatus;
  criteriaVersion: string;
  evaluatedAt: Date;
  popularityCount: number;
}
