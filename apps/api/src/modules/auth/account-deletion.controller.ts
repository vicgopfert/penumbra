import { type DeleteAccountInput, DeleteAccountSchema } from '@indie/contracts';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../generated/prisma/client';
import { AccountDeletionService } from './account-deletion.service';
import {
  AUTH_SETTINGS,
  type AuthSettings,
  SESSION_COOKIE,
  sessionCookieOptions,
} from './auth-settings';
import { ACCOUNT_LOGIN_LIMIT, ACCOUNT_THROTTLER, IP_THROTTLER, LOGIN_LIMIT } from './auth-throttle';

@ApiTags('users')
@Controller('me')
export class AccountDeletionController {
  constructor(
    private readonly deletion: AccountDeletionService,
    @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings,
  ) {}

  // A senha atual é tentada como no login: os mesmos limites freiam quem a adivinha com a sessão
  // de outra pessoa.
  @Delete()
  @UseGuards(ThrottlerGuard)
  @Throttle({ [IP_THROTTLER]: LOGIN_LIMIT, [ACCOUNT_THROTTLER]: ACCOUNT_LOGIN_LIMIT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiBody({ schema: { example: { password: 'senha-forte' } } })
  @ApiNoContentResponse({
    description:
      'Conta excluída de vez, com a biblioteca, os gostos, as sessões, os links e os eventos de uso; cookie apagado',
  })
  @ApiBadRequestResponse({ description: 'Senha ausente ou incorreta' })
  @ApiUnauthorizedResponse({ description: 'Sem sessão válida' })
  @ApiForbiddenResponse({ description: 'Origem da requisição diferente do frontend' })
  @ApiTooManyRequestsResponse({
    description: 'Mais de 5 tentativas por minuto do mesmo IP ou 10 em 15 minutos na mesma conta',
  })
  async delete(
    @CurrentUser() user: User,
    @Body({ schema: DeleteAccountSchema }) body: DeleteAccountInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.deletion.delete(user, body.password);
    response.clearCookie(SESSION_COOKIE, sessionCookieOptions(this.settings));
  }
}
