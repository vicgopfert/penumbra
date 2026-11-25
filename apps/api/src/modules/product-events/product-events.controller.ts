import { type ProductEventBatch, ProductEventBatchSchema } from '@indie/contracts';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { minutes, SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SESSION_COOKIE } from '../auth/auth-settings';
import { ACCOUNT_THROTTLER, IP_THROTTLER } from '../auth/auth-throttle';
import { ProductEventsService } from './product-events.service';

// Por IP, só na memória e por 1 minuto, também para quem não tem conta: protege o banco contra
// envios em massa. Base legal: legítimo interesse (docs/privacidade.md).
export const PRODUCT_EVENTS_LIMIT = { limit: 60, ttl: minutes(1) };

@ApiTags('events')
@Controller('events')
export class ProductEventsController {
  constructor(private readonly events: ProductEventsService) {}

  @Public()
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ [IP_THROTTLER]: PRODUCT_EVENTS_LIMIT })
  @SkipThrottle({ [ACCOUNT_THROTTLER]: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({
    schema: {
      example: {
        events: [
          { kind: 'PAGE_VIEW', page: 'GAME', game: 'celeste', visitStart: true, origin: 'SEARCH' },
          { kind: 'EXIT_CLICK', game: 'celeste', exit: 'STORE', store: 'STEAM' },
        ],
      },
    },
  })
  @ApiNoContentResponse({
    description:
      'Eventos recebidos. Sem sessão, gravados sem conta; com sessão, ligados à conta só com o consentimento das métricas de uso, e sem ele nada é gravado',
  })
  @ApiBadRequestResponse({ description: 'Tipo de evento desconhecido, campo a mais ou lote vazio' })
  @ApiForbiddenResponse({ description: 'Origem da requisição diferente do frontend' })
  @ApiTooManyRequestsResponse({ description: 'Mais de 60 envios por minuto vindos do mesmo IP' })
  async record(
    @Body({ schema: ProductEventBatchSchema }) body: ProductEventBatch,
    @Req() request: Request,
  ) {
    await this.events.record(body.events, request.cookies?.[SESSION_COOKIE]);
  }
}
