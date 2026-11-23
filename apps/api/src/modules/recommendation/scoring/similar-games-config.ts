import { z } from 'zod';
import { RECOMMENDATION_CONFIG_FILE, readRecommendationConfig } from '../recommendation-config';

const size = z.number().int().positive();

export const similarGamesConfigSchema = z
  .object({
    size,
    minItems: size,
    sizeRationale: z.string().min(1),
    minSimilarity: z.number().min(0).lt(1),
    minSimilarityRationale: z.string().min(1),
    cacheSize: z.number().int().nonnegative(),
    cacheSizeRationale: z.string().min(1),
  })
  .refine(({ minItems, size }) => minItems <= size, {
    error: 'O mínimo de jogos da seção não pode passar o tamanho dela.',
  });

export type SimilarGamesConfig = z.infer<typeof similarGamesConfigSchema>;

export function readSimilarGamesConfig(file = RECOMMENDATION_CONFIG_FILE): SimilarGamesConfig {
  return readRecommendationConfig('similarGames', similarGamesConfigSchema, file);
}
