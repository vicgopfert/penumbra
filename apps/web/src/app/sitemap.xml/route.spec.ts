import { describe, expect, it } from 'vitest';
import { apiError, stubFetch } from '@/test/fetch';
import { GET } from './route';

describe('GET /sitemap.xml', () => {
  it('lista as fichas e as coleções que a API devolve', async () => {
    const fetchMock = stubFetch(() =>
      Response.json({ games: ['celeste'], collections: ['brasil'] }),
    );

    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith('/api/sitemap', expect.anything());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    const xml = await response.text();
    expect(xml).toContain('<loc>https://penumbraindie.com.br/jogos/celeste</loc>');
    expect(xml).toContain('<loc>https://penumbraindie.com.br/colecoes/brasil</loc>');
  });

  it.each([
    ['a API não responde', () => Promise.reject(new TypeError('fetch failed'))],
    ['a API ainda não tem a rota', () => apiError(404, 'Cannot GET /api/sitemap')],
  ])('quando %s, responde 503 para o robô voltar depois, sem sitemap vazio', async (_, reply) => {
    stubFetch(reply as () => Response);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('120');
    expect(await response.text()).not.toContain('urlset');
  });
});
