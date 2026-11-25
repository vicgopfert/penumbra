import { BadRequestException } from '@nestjs/common';
import { BackgroundTasks } from '../../common/background-tasks';
import type { User } from '../../generated/prisma/client';
import type { Email, Mailer } from '../mail/mailer';
import type { UsersRepository } from '../users/users.repository';
import { AccountDeletionService, brasiliaDay, WRONG_PASSWORD } from './account-deletion.service';
import type { AuthSettings } from './auth-settings';
import type { PasswordHasher } from './password-hasher';

const NOW = new Date('2026-11-26T01:30:00Z');
const SETTINGS: AuthSettings = {
  sessionTtlDays: 7,
  secureCookie: true,
  webOrigin: 'https://penumbraindie.com.br',
};

const account = (emailConfirmedAt: Date | null) =>
  ({
    id: 'conta-1',
    email: 'jogadora@example.com',
    passwordHash: 'hash(senha-forte)',
    emailConfirmedAt,
  }) as User;

describe('AccountDeletionService', () => {
  let deleted: { id: string; deletedOn: Date }[];
  let sent: Email[];
  let tasks: BackgroundTasks;
  let alreadyGone: boolean;

  const service = () => {
    const users = {
      deleteAccount: (id: string, deletedOn: Date) => {
        if (alreadyGone) return Promise.resolve(false);
        deleted.push({ id, deletedOn });
        return Promise.resolve(true);
      },
    } as unknown as UsersRepository;
    const passwords = {
      verify: (hash: string, password: string) => Promise.resolve(hash === `hash(${password})`),
    } as unknown as PasswordHasher;
    const mailer: Mailer = { send: (email) => Promise.resolve(void sent.push(email)) };
    return new AccountDeletionService(users, passwords, tasks, mailer, SETTINGS);
  };

  beforeEach(() => {
    deleted = [];
    sent = [];
    tasks = new BackgroundTasks();
    alreadyGone = false;
  });

  it('com a senha certa, apaga a conta com o dia de Brasília e avisa o endereço confirmado', async () => {
    await service().delete(account(new Date('2026-11-20T00:00:00Z')), 'senha-forte', NOW);
    await tasks.drain();

    expect(deleted).toEqual([{ id: 'conta-1', deletedOn: new Date('2026-11-25') }]);
    expect(sent.map(({ to, subject }) => [to, subject])).toEqual([
      ['jogadora@example.com', 'A sua conta na Penumbra foi excluída'],
    ]);
  });

  it('com a senha errada, recusa no campo e não apaga nada', async () => {
    await expect(service().delete(account(null), 'outra-senha', NOW)).rejects.toEqual(
      new BadRequestException(WRONG_PASSWORD),
    );
    expect(deleted).toEqual([]);
  });

  it('não avisa endereço sem confirmação, nem conta que outro pedido já apagou', async () => {
    await service().delete(account(null), 'senha-forte', NOW);
    alreadyGone = true;
    await service().delete(account(new Date()), 'senha-forte', NOW);
    await tasks.drain();

    expect(sent).toEqual([]);
  });

  it('o dia de Brasília vira à meia-noite de lá, às 3h em UTC', () => {
    expect(brasiliaDay(new Date('2026-11-26T02:59:59Z'))).toEqual(new Date('2026-11-25'));
    expect(brasiliaDay(new Date('2026-11-26T03:00:00Z'))).toEqual(new Date('2026-11-26'));
  });
});
