import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { ContentIndexRepository } from './content-index.repository';
import { readTagVocabulary } from '../tags/tags';
import { ContentIndexService, TAG_VOCABULARY, TFIDF_CONFIG } from './content-index.service';
import { FindSimilarGamesUseCase, SIMILAR_GAMES_CONFIG } from './find-similar-games.use-case';
import {
  GenerateRecommendationsUseCase,
  SCORING_CONFIG,
} from './generate-recommendations.use-case';
import { InternalController } from './internal.controller';
import { RecommendationController } from './recommendation.controller';
import { RecommendationRepository } from './recommendation.repository';
import { readScoringConfig } from './scoring/scoring-config';
import { readSimilarGamesConfig } from './scoring/similar-games-config';
import { SimilarGamesController } from './similar-games.controller';
import { readTfidfConfig } from './tfidf';

@Module({
  imports: [CatalogModule],
  controllers: [RecommendationController, SimilarGamesController, InternalController],
  providers: [
    ContentIndexRepository,
    ContentIndexService,
    RecommendationRepository,
    GenerateRecommendationsUseCase,
    FindSimilarGamesUseCase,
    { provide: TFIDF_CONFIG, useFactory: () => readTfidfConfig() },
    { provide: TAG_VOCABULARY, useFactory: () => readTagVocabulary() },
    { provide: SCORING_CONFIG, useFactory: () => readScoringConfig() },
    { provide: SIMILAR_GAMES_CONFIG, useFactory: () => readSimilarGamesConfig() },
  ],
  exports: [ContentIndexService],
})
export class RecommendationModule {}
