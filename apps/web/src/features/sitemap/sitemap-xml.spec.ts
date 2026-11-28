import { describe, expect, it } from 'vitest';
import { sitemapPaths, sitemapXml } from './sitemap-xml';

describe('sitemapPaths', () => {
  it('lista as páginas fixas, as coleções e as fichas, sem a conta e sem os filtros', () => {
    expect(sitemapPaths({ games: ['celeste', 'hades--1'], collections: ['brasil'] })).toEqual([
      '/',
      '/catalogo',
      '/colecoes',
      '/colecoes/brasil',
      '/jogos/celeste',
      '/jogos/hades--1',
      '/privacidade',
      '/termos',
    ]);
  });
});

describe('sitemapXml', () => {
  it('monta o urlset do protocolo com os endereços absolutos de produção', () => {
    expect(sitemapXml(['/', '/jogos/celeste'])).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '<url><loc>https://penumbraindie.com.br/</loc></url>',
        '<url><loc>https://penumbraindie.com.br/jogos/celeste</loc></url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('escapa os caracteres reservados do XML', () => {
    expect(sitemapXml(["/jogos/o'neil&co"])).toContain(
      '<loc>https://penumbraindie.com.br/jogos/o&apos;neil&amp;co</loc>',
    );
  });
});
