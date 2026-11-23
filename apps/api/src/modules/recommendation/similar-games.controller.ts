import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  FindSimilarGamesUseCase,
  GAME_NOT_FOUND,
  SIMILAR_GAMES_UNAVAILABLE,
} from './find-similar-games.use-case';

const SIMILAR_EXAMPLE = {
  items: [
    {
      game: {
        slug: 'ori-and-the-blind-forest',
        name: 'Ori and the Blind Forest',
        coverImageId: 'co1y3z',
        releaseStatus: 'RELEASED',
        firstReleaseDate: '2015-03-11',
        genres: [
          { slug: 'adventure', name: 'Aventura' },
          { slug: 'platform', name: 'Plataforma' },
        ],
      },
      reason: {
        kind: 'features',
        features: [
          { slug: 'metroidvania', name: 'Metroidvania' },
          { slug: 'difficult', name: 'Difícil' },
        ],
      },
    },
  ],
};

@ApiTags('recommendations')
@Controller('games')
export class SimilarGamesController {
  constructor(private readonly similarGames: FindSimilarGamesUseCase) {}

  @Public()
  @Get(':slug/similar')
  @ApiParam({ name: 'slug', description: 'Slug do jogo, o mesmo da ficha' })
  @ApiOkResponse({
    description:
      'Jogos semelhantes ao da ficha, em ordem de cosseno com ele, sem termo de popularidade: a mesma lista para qualquer visitante, com ou sem sessão. Nunca inclui o próprio jogo; inclui os "Em breve". reason traz o que os dois jogos têm em comum, até 3 etiquetas, gêneros ou temas pela contribuição ao cosseno, como o motivo das recomendações; pode vir nulo. Tamanho, semelhança mínima e mínimo de jogos em config/recommendation.json; abaixo do mínimo, items vem vazio e a ficha não mostra a seção',
    schema: { example: SIMILAR_EXAMPLE },
  })
  @ApiNotFoundResponse({
    description: `Slug inexistente ou jogo fora do catálogo: "${GAME_NOT_FOUND}"`,
  })
  @ApiServiceUnavailableResponse({
    description: `Índice de conteúdo carregando ou com falha: "${SIMILAR_GAMES_UNAVAILABLE}"`,
  })
  findSimilar(@Param('slug') slug: string) {
    return this.similarGames.find(slug);
  }
}
