import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { readTagVocabulary, tagAliases } from '../tags/tags';
import { CatalogService, FILTER_OPTION_MIN_GAMES, TAG_ALIASES } from './catalog.service';
import { FeatureLabels } from './feature-labels';
import { WhereToPlay } from './where-to-play';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogRepository,
    CatalogService,
    { provide: FILTER_OPTION_MIN_GAMES, useValue: 20 },
    { provide: TAG_ALIASES, useFactory: () => tagAliases(readTagVocabulary()) },
    { provide: FeatureLabels, useFactory: () => FeatureLabels.fromFile() },
    { provide: WhereToPlay, useFactory: () => WhereToPlay.fromFiles() },
  ],
  exports: [FeatureLabels, CatalogService],
})
export class CatalogModule {}
