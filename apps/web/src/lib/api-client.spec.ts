import { UserSchema } from '@indie/contracts';
import { describe, expect, it, vi } from 'vitest';
import { apiError, sampleUser, stubFetch } from '@/test/fetch';
import { ApiRequestError, apiFetch, UNEXPECTED_ERROR_MESSAGE } from './api-client';

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(ApiRequestError);
  return error as ApiRequestError;
}

describe('apiFetch', () => {
  it('chama a API pela mesma origem, com o corpo em JSON', async () => {
    const fetchMock = stubFetch(() => Response.json(sampleUser));

    await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c' },
      schema: UserSchema,
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c' }),
    });
  });

  it('no servidor, chama a API direto, sem o rewrite', async () => {
    vi.stubGlobal('window', undefined);
    const fetchMock = stubFetch(() => Response.json(sampleUser));

    await apiFetch('/auth/me', { schema: UserSchema });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/auth/me', expect.anything());
  });

  it('devolve o corpo validado pelo schema', async () => {
    stubFetch(() => Response.json(sampleUser));

    await expect(apiFetch('/auth/me', { schema: UserSchema })).resolves.toEqual(sampleUser);
  });

  it('sem schema, não lê o corpo', async () => {
    stubFetch(() => new Response(null, { status: 204 }));

    await expect(apiFetch('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('transforma o erro da API em ApiRequestError, com status, mensagem e requestId', async () => {
    stubFetch(() => apiError(409, 'E-mail já cadastrado'));

    const error = await failure(apiFetch('/auth/register', { method: 'POST' }));

    expect(error).toMatchObject({
      status: 409,
      messages: ['E-mail já cadastrado'],
      requestId: 'req-1',
    });
  });

  it('separa as mensagens de validação por campo', async () => {
    stubFetch(() => apiError(400, ['email: E-mail inválido.', 'password: Informe a senha.']));

    const error = await failure(apiFetch('/auth/register', { method: 'POST' }));

    expect(error.fieldMessages()).toEqual([
      { field: 'email', message: 'E-mail inválido.' },
      { field: 'password', message: 'Informe a senha.' },
    ]);
  });

  it.each([
    [
      'erro fora do formato da API',
      () => new Response('<html>Bad Gateway</html>', { status: 502 }),
    ],
    ['sucesso fora do contrato', () => Response.json({ id: 1 })],
    [
      'falha de rede',
      () => {
        throw new TypeError('Failed to fetch');
      },
    ],
  ])('%s vira a mensagem genérica', async (_, reply) => {
    stubFetch(reply);

    const error = await failure(apiFetch('/auth/me', { schema: UserSchema }));

    expect(error.messages).toEqual([UNEXPECTED_ERROR_MESSAGE]);
  });

  it('com cache, pede ao Next que guarde o dado com o prazo e as tags', async () => {
    const fetchMock = stubFetch(() => Response.json(sampleUser));

    await apiFetch('/games/celeste', {
      schema: UserSchema,
      cache: { revalidate: 86400, tags: ['games'] },
    });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      next: { revalidate: 86400, tags: ['games'] },
    });
  });

  it('sem cache, não passa opção de cache nenhuma', async () => {
    const fetchMock = stubFetch(() => Response.json(sampleUser));

    await apiFetch('/auth/me', { schema: UserSchema });

    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty('next');
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty('cache');
  });

  it('dado guardado fora do contrato (de antes de um deploy): busca de novo, sem cache', async () => {
    const replies = [Response.json({ id: 1 }), Response.json(sampleUser)];
    const fetchMock = stubFetch(() => replies.shift()!);

    const user = await apiFetch('/games/celeste', {
      schema: UserSchema,
      cache: { revalidate: 86400, tags: ['games'] },
    });

    expect(user).toEqual(sampleUser);
    expect(fetchMock.mock.calls.map(([, init]) => init?.cache)).toEqual([undefined, 'no-store']);
  });

  it('se o dado sem cache também estiver fora do contrato, vira a mensagem genérica', async () => {
    stubFetch(() => Response.json({ id: 1 }));

    const error = await failure(
      apiFetch('/games/celeste', {
        schema: UserSchema,
        cache: { revalidate: 86400, tags: ['games'] },
      }),
    );

    expect(error.messages).toEqual([UNEXPECTED_ERROR_MESSAGE]);
  });
});
