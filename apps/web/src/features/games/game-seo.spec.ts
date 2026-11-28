import type { GameDetail, GameLanguage } from '@indie/contracts';
import { describe, expect, it } from 'vitest';
import { sampleGameDetail } from '@/test/catalog';
import { gameDescription, gameJsonLd, gameTitle } from './game-seo';

const CLOSING = 'Veja onde jogar e jogos parecidos.';

const language = (locale: string, support: Partial<GameLanguage> = {}): GameLanguage => ({
  locale,
  name: locale,
  interface: false,
  subtitles: false,
  audio: false,
  ...support,
});

const platforms = (...names: string[]): GameDetail['platforms'] =>
  names.map((name) => ({ slug: name.toLowerCase(), name }));

describe('gameTitle', () => {
  it('pergunta o que a ficha responde', () => {
    expect(gameTitle(sampleGameDetail())).toBe(
      'Celeste: tem português? Onde jogar e jogos parecidos',
    );
  });
});

describe('gameDescription', () => {
  it('diz o suporte ao português do Brasil e as plataformas', () => {
    expect(gameDescription(sampleGameDetail())).toBe(
      `Celeste tem português do Brasil: interface e legendas. Para PC e Switch. ${CLOSING}`,
    );
  });

  it.each([
    [
      'só português de Portugal',
      [language('en-US', { audio: true }), language('pt-PT', { subtitles: true })],
      'Celeste tem português de Portugal: legendas.',
    ],
    [
      'as duas variantes, pela do Brasil',
      [language('pt-PT', { interface: true }), language('pt-BR', { audio: true })],
      'Celeste tem português do Brasil: áudio.',
    ],
    ['português sem o tipo de suporte', [language('pt-BR')], 'Celeste tem português do Brasil.'],
    [
      'idiomas sem português',
      [language('en-US', { interface: true })],
      'Celeste não tem português.',
    ],
    ['nenhum idioma informado', [], 'Os idiomas de Celeste não foram informados.'],
  ])('%s', (_, languages, sentence) => {
    expect(gameDescription(sampleGameDetail({ languages, platforms: [] }))).toBe(
      `${sentence} ${CLOSING}`,
    );
  });

  it('o jogo "Em breve" diz para onde vem', () => {
    const game = sampleGameDetail({ releaseStatus: 'UPCOMING', platforms: platforms('PC', 'PS5') });

    expect(gameDescription(game)).toContain('Em breve para PC e PS5.');
  });

  it('mostra até 5 plataformas e conta as outras', () => {
    const game = sampleGameDetail({
      platforms: platforms('Android', 'iOS', 'Mac', 'PC', 'PS4', 'PS5', 'Switch'),
    });

    expect(gameDescription(game)).toContain('Para Android, iOS, Mac, PC, PS4 e mais 2.');
  });

  it('com o nome longo, encolhe a lista de plataformas para caber em 160 caracteres', () => {
    const game = sampleGameDetail({
      name: 'Um Jogo Com Um Nome Realmente Muito Comprido',
      platforms: platforms('Android', 'iOS', 'Mac', 'PC', 'PS4', 'PS5', 'Switch'),
    });

    const description = gameDescription(game);

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain('Para Android, iOS, Mac e mais 4.');
  });

  it('sem plataforma que caiba, tira a frase; e, se ainda passar, corta o texto', () => {
    const name = 'Nome '.repeat(30).trim();
    const description = gameDescription(sampleGameDetail({ name }));

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain('Para PC');
    expect(description.endsWith('…')).toBe(true);
  });
});

describe('gameJsonLd', () => {
  it('descreve o jogo como VideoGame do schema.org', () => {
    expect(gameJsonLd(sampleGameDetail())).toEqual({
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: 'Celeste',
      url: 'https://penumbraindie.com.br/jogos/celeste',
      image: 'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co3byy.jpg',
      description: `Celeste tem português do Brasil: interface e legendas. Para PC e Switch. ${CLOSING}`,
      genre: ['Aventura', 'Plataforma'],
      gamePlatform: ['PC', 'Switch'],
      inLanguage: ['en-US', 'pt-BR'],
      author: [{ '@type': 'Organization', name: 'Extremely OK Games' }],
      publisher: [{ '@type': 'Organization', name: 'Maddy Makes Games' }],
      datePublished: '2018-01-25',
    });
  });

  it('deixa de fora o que a ficha não informa', () => {
    const jsonLd = gameJsonLd(
      sampleGameDetail({
        coverImageId: '',
        genres: [],
        platforms: [],
        languages: [],
        developers: [],
        publishers: [],
        firstReleaseDate: null,
      }),
    );

    for (const key of [
      'image',
      'genre',
      'gamePlatform',
      'inLanguage',
      'author',
      'publisher',
      'datePublished',
    ]) {
      expect(jsonLd).not.toHaveProperty(key);
    }
  });

  it('o jogo "Em breve" não tem data de publicação, mesmo com a data prevista', () => {
    const jsonLd = gameJsonLd(
      sampleGameDetail({ releaseStatus: 'UPCOMING', firstReleaseDate: '2027-03-01' }),
    );

    expect(jsonLd).not.toHaveProperty('datePublished');
  });

  it('a URL usa o slug da API', () => {
    expect(gameJsonLd(sampleGameDetail({ slug: 'hades--1' })).url).toBe(
      'https://penumbraindie.com.br/jogos/hades--1',
    );
  });
});
