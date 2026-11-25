import { beforeEach, describe, expect, it } from 'vitest';
import { originOf, startVisit } from './visit';

const OWN_HOST = 'penumbraindie.com.br';

describe('originOf', () => {
  it.each([
    ['', 'DIRECT'],
    ['https://www.google.com.br/', 'SEARCH'],
    ['https://www.bing.com/search?q=indie', 'SEARCH'],
    ['https://duckduckgo.com/', 'SEARCH'],
    ['https://www.reddit.com/r/indiegaming/', 'OTHER_SITE'],
    ['https://penumbraindie.com.br/catalogo', null],
  ])('%s → %s', (referrer, origin) => {
    expect(originOf(referrer, OWN_HOST)).toBe(origin);
  });
});

describe('startVisit', () => {
  beforeEach(() => sessionStorage.clear());

  it('abre a visita uma vez por aba', () => {
    expect(startVisit('https://www.google.com/', OWN_HOST)).toEqual({
      visitStart: true,
      origin: 'SEARCH',
    });
    expect(startVisit('https://www.google.com/', OWN_HOST)).toEqual({ visitStart: false });
  });

  it('a aba aberta a partir do próprio site continua a visita', () => {
    expect(startVisit('https://penumbraindie.com.br/cadastrar', OWN_HOST)).toEqual({
      visitStart: false,
    });
  });
});
