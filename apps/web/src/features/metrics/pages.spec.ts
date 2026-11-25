import { describe, expect, it } from 'vitest';
import { pageOf } from './pages';

describe('pageOf', () => {
  it.each([
    ['/', { page: 'HOME' }],
    ['/catalogo', { page: 'CATALOG' }],
    ['/jogos/celeste', { page: 'GAME', game: 'celeste' }],
    ['/jogos/caf%C3%A9', { page: 'GAME', game: 'café' }],
    ['/colecoes', { page: 'COLLECTIONS' }],
    ['/colecoes/horror-cosmico', { page: 'COLLECTION' }],
    ['/recomendacoes', { page: 'RECOMMENDATIONS' }],
    ['/recomendacoes/para-voce', { page: 'RECOMMENDATION_LIST' }],
    ['/perfil', { page: 'PROFILE' }],
    ['/boas-vindas', { page: 'ONBOARDING' }],
    ['/redefinir-senha', { page: 'ACCOUNT' }],
    ['/cadastrar', { page: 'ACCOUNT' }],
    ['/conta-excluida', { page: 'ACCOUNT' }],
    ['/privacidade', { page: 'LEGAL' }],
    ['/termos', { page: 'LEGAL' }],
    ['/nao-existe', { page: 'OTHER' }],
    ['/jogos', { page: 'OTHER' }],
    ['/jogos/celeste/extra', { page: 'OTHER' }],
  ])('%s', (pathname, expected) => {
    expect(pageOf(pathname)).toEqual(expected);
  });
});
