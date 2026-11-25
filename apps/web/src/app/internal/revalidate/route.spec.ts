import { revalidateTag } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';
const post = (authorization?: string) =>
  POST(
    new Request('http://localhost/internal/revalidate', {
      method: 'POST',
      headers: authorization ? { authorization } : {},
    }),
  );

beforeEach(() => {
  vi.mocked(revalidateTag).mockClear();
  vi.stubEnv('REVALIDATE_SECRET', SECRET);
});

afterEach(() => vi.unstubAllEnvs());

describe('POST /internal/revalidate', () => {
  it('com o segredo, revalida os jogos, as coleções e o catálogo sem fazer ninguém esperar', async () => {
    const response = post(`Bearer ${SECRET}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: ['games', 'collections', 'catalog'] });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ['games', 'max'],
      ['collections', 'max'],
      ['catalog', 'max'],
    ]);
  });

  it.each([
    ['sem cabeçalho', undefined],
    ['com o segredo errado', 'Bearer outro-segredo-com-pelo-menos-32-caracteres'],
    ['sem o Bearer', SECRET],
  ])('%s, responde 401 e não revalida nada', (_, authorization) => {
    expect(post(authorization).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('sem o segredo configurado, ou curto demais, responde 503', () => {
    vi.stubEnv('REVALIDATE_SECRET', 'curto');

    expect(post('Bearer curto').status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
