import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('libera o site, bloqueia a API, a rota interna e os filtros do catálogo, e aponta o sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/internal/', '/catalogo?'] },
      sitemap: 'https://penumbraindie.com.br/sitemap.xml',
    });
  });
});
