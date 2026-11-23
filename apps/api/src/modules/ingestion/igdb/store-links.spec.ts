import type { Store } from '../../../generated/prisma/client';
import { classifyStore, steamStoreUrl, storeLinks } from './store-links';

const OFFICIAL = 1;
const TWITTER = 5;

describe('classifyStore', () => {
  it.each<[number, string, Store]>([
    [10, 'https://apps.apple.com/app/id1', 'APP_STORE'],
    [11, 'https://apps.apple.com/app/id1', 'APP_STORE'],
    [12, 'https://play.google.com/store/apps/details?id=a', 'GOOGLE_PLAY'],
    [13, 'https://store.steampowered.com/app/1', 'STEAM'],
    [15, 'https://estudio.itch.io/jogo', 'ITCH'],
    [16, 'https://store.epicgames.com/p/jogo', 'EPIC'],
    [17, 'https://www.gog.com/game/jogo', 'GOG'],
    [22, 'https://www.xbox.com/games/store/jogo/1', 'MICROSOFT'],
    [23, 'https://store.playstation.com/concept/1', 'PLAYSTATION'],
    [24, 'https://www.nintendo.com/us/store/products/jogo', 'NINTENDO'],
  ])('pelo tipo próprio da IGDB: %i é %s', (type, url, store) => {
    expect(classifyStore({ type, url })).toBe(store);
  });

  it.each<[string, Store]>([
    ['https://store.steampowered.com/app/1/Jogo/', 'STEAM'],
    ['https://estudio.itch.io/jogo', 'ITCH'],
    ['https://store.epicgames.com/pt-BR/p/jogo', 'EPIC'],
    ['https://www.epicgames.com/store/en-US/p/jogo', 'EPIC'],
    ['https://www.gog.com/en/game/jogo', 'GOG'],
    ['https://store.playstation.com/pt-br/product/UP0001', 'PLAYSTATION'],
    ['https://www.playstation.com/pt-br/games/jogo/', 'PLAYSTATION'],
    ['https://www.xbox.com/pt-BR/games/store/jogo/9N', 'MICROSOFT'],
    ['https://www.microsoft.com/store/apps/9N', 'MICROSOFT'],
    ['https://www.nintendo.com/us/store/products/jogo-switch/', 'NINTENDO'],
    [
      'https://www.nintendo.co.uk/Games/Nintendo-Switch-download-software/Jogo-eshop.html',
      'NINTENDO',
    ],
    ['https://apps.apple.com/br/app/jogo/id1', 'APP_STORE'],
    ['https://itunes.apple.com/us/app/jogo/id1', 'APP_STORE'],
    ['https://play.google.com/store/apps/details?id=a', 'GOOGLE_PLAY'],
  ])('pelo endereço quando o tipo não é de loja: %s', (url, store) => {
    expect(classifyStore({ type: OFFICIAL, url })).toBe(store);
  });

  it.each([
    'https://www.celestegame.com',
    'https://twitter.com/jogo',
    'https://www.nintendo.com/us/whatsnew/jogo',
    'https://www.epicgames.com/site/en-US/news',
    'https://steamcommunity.com/app/1',
    'https://notitch.io.example.com',
  ])('não é loja: %s', (url) => {
    expect(classifyStore({ type: OFFICIAL, url })).toBeNull();
  });

  it('não aceita link fora de http e https, nem endereço inválido', () => {
    expect(classifyStore({ type: 13, url: 'steam://run/1' })).toBeNull();
    expect(classifyStore({ type: 13, url: 'não é um link' })).toBeNull();
  });
});

describe('storeLinks', () => {
  it('fica com um link por loja, o de menor id na IGDB', () => {
    const links = storeLinks(
      [
        { id: 30, type: 23, url: 'https://store.playstation.com/en-us/concept/2' },
        { id: 10, type: 23, url: 'https://store.playstation.com/pt-br/concept/1' },
        { id: 20, type: TWITTER, url: 'https://twitter.com/jogo' },
        { id: 40, type: 15, url: ' https://estudio.itch.io/jogo ' },
      ],
      null,
    );

    expect(links).toEqual([
      { store: 'PLAYSTATION', url: 'https://store.playstation.com/pt-br/concept/1' },
      { store: 'ITCH', url: 'https://estudio.itch.io/jogo' },
    ]);
  });

  it('monta o link da Steam pelo id do jogo nela, no lugar do link da IGDB', () => {
    const links = storeLinks(
      [{ id: 1, type: 13, url: 'https://store.steampowered.com/app/999/Outro/' }],
      504230,
    );

    expect(links).toEqual([{ store: 'STEAM', url: steamStoreUrl(504230) }]);
    expect(steamStoreUrl(504230)).toBe('https://store.steampowered.com/app/504230');
  });

  it('sem o id da Steam, usa o link da IGDB; sem nenhum dos dois, não há Steam', () => {
    expect(
      storeLinks([{ id: 1, type: 13, url: 'https://store.steampowered.com/app/7' }], null),
    ).toEqual([{ store: 'STEAM', url: 'https://store.steampowered.com/app/7' }]);
    expect(storeLinks([], null)).toEqual([]);
    expect(storeLinks([], 7)).toEqual([{ store: 'STEAM', url: steamStoreUrl(7) }]);
  });
});
