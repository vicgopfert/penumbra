import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BackgroundTasks } from '../../common/background-tasks';
import type { User } from '../../generated/prisma/client';
import { MAILER, type Mailer } from '../mail/mailer';
import { UsersRepository } from '../users/users.repository';
import { accountDeletedEmail } from './account-emails';
import { AUTH_SETTINGS, type AuthSettings } from './auth-settings';
import { PasswordHasher } from './password-hasher';

// No formato dos erros de validação ("campo: mensagem"), para o formulário mostrar no campo. Não
// é 401: na web, o 401 quer dizer sessão vencida e tira a pessoa da conta.
export const WRONG_PASSWORD = 'password: Senha incorreta.';

const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

// O dia no horário de Brasília, que não tem horário de verão desde 2019.
export const brasiliaDay = (now: Date) =>
  new Date(new Date(now.getTime() - BRASILIA_OFFSET_MS).toISOString().slice(0, 10));

// Exclusão imediata e definitiva, confirmada pela senha atual (B-52). O aviso só vai para endereço
// confirmado, como o de senha alterada, e sai depois de a conta ser apagada.
@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordHasher,
    private readonly tasks: BackgroundTasks,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings,
  ) {}

  async delete(user: User, password: string, now = new Date()) {
    if (!(await this.passwords.verify(user.passwordHash, password))) {
      throw new BadRequestException(WRONG_PASSWORD);
    }
    const deleted = await this.users.deleteAccount(user.id, brasiliaDay(now));
    if (deleted && user.emailConfirmedAt) {
      const email = accountDeletedEmail(user.email, now, this.settings.webOrigin);
      this.tasks.run('aviso de conta excluída', () => this.mailer.send(email));
    }
  }
}
