import type { SimilarGames } from '@indie/contracts';
import { Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { FeatureLabels } from '../catalog/feature-labels';
import type { ContentIndex } from './content-index';
import { ContentIndexService } from './content-index.service';
import { presentReason } from './present-attributes';
import { RecommendationRepository } from './recommendation.repository';
import { commonAttributes, SimilarGamesCache, similarGames } from './scoring/similar-games';
import type { SimilarGamesConfig } from './scoring/similar-games-config';

export const SIMILAR_GAMES_CONFIG = Symbol('SIMILAR_GAMES_CONFIG');

export const SIMILAR_GAMES_UNAVAILABLE =
  'Os jogos semelhantes ainda não estão disponíveis; tente novamente em alguns instantes.';

export const GAME_NOT_FOUND = 'Jogo não encontrado.';

interface IndexState {
  positionBySlug: ReadonlyMap<string, number>;
  cache: SimilarGamesCache;
}

@Injectable()
export class FindSimilarGamesUseCase {
  private readonly stateByIndex = new WeakMap<ContentIndex, IndexState>();

  constructor(
    private readonly contentIndex: ContentIndexService,
    private readonly repository: RecommendationRepository,
    private readonly catalog: CatalogService,
    private readonly labels: FeatureLabels,
    @Inject(SIMILAR_GAMES_CONFIG) private readonly config: SimilarGamesConfig,
  ) {}

  // O jogo da ficha vem do índice, sem consulta ao banco: fora dele, 404. Um vizinho que saiu do
  // catálogo depois da última carga fica de fora, e o mínimo de jogos vale depois disso.
  async find(slug: string): Promise<SimilarGames> {
    const index = this.contentIndex.index;
    if (!index) throw new ServiceUnavailableException(SIMILAR_GAMES_UNAVAILABLE);

    const { positionBySlug, cache } = this.state(index);
    const position = positionBySlug.get(slug);
    if (position === undefined) throw new NotFoundException(GAME_NOT_FOUND);

    const source = index.games[position]!;
    const neighbors = [...cache.of(source.id, () => similarGames(index, position, this.config))];
    if (neighbors.length < this.config.minItems) return { items: [] };

    const games = neighbors.map((neighbor) => index.games[neighbor]!);
    const rows = new Map(
      (await this.repository.findGames(games.map(({ id }) => id))).map((row) => [row.id, row]),
    );
    const reasonOf = commonAttributes(index, source);
    const items = games.flatMap((game) => {
      const row = rows.get(game.id);
      if (!row?.inCatalog) return [];
      return [
        { game: this.catalog.toSummary(row), reason: presentReason(this.labels, reasonOf(game)) },
      ];
    });
    return { items: items.length >= this.config.minItems ? items : [] };
  }

  // Um mapa de slugs e um cache para cada índice carregado: a recarga cria outros.
  private state(index: ContentIndex): IndexState {
    let state = this.stateByIndex.get(index);
    if (state === undefined) {
      state = {
        positionBySlug: new Map(index.games.map(({ slug }, position) => [slug, position])),
        cache: new SimilarGamesCache(this.config.cacheSize),
      };
      this.stateByIndex.set(index, state);
    }
    return state;
  }
}
