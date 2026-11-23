import type { Store } from '../../../generated/prisma/client';

export interface IgdbWebsite {
  id: number;
  type: number;
  url: string;
}

export interface StoreLink {
  store: Store;
  url: string;
}

// Códigos conferidos na API da IGDB (website_types, 23/11/2026). Meta (25) e GameJolt (26)
// também são lojas, mas ficam fora das nove do F-34.
const STORE_BY_WEBSITE_TYPE: ReadonlyMap<number, Store> = new Map([
  [10, 'APP_STORE'],
  [11, 'APP_STORE'],
  [12, 'GOOGLE_PLAY'],
  [13, 'STEAM'],
  [15, 'ITCH'],
  [16, 'EPIC'],
  [17, 'GOG'],
  [22, 'MICROSOFT'],
  [23, 'PLAYSTATION'],
  [24, 'NINTENDO'],
]);

const isHost = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

// Pelo endereço, nos links sem tipo de loja: o site oficial e os outros tipos às vezes apontam
// para uma loja.
const STORE_BY_URL: readonly [Store, (url: URL) => boolean][] = [
  ['STEAM', ({ hostname }) => hostname === 'store.steampowered.com'],
  ['ITCH', ({ hostname }) => isHost(hostname, 'itch.io')],
  [
    'EPIC',
    ({ hostname, pathname }) =>
      hostname === 'store.epicgames.com' ||
      (isHost(hostname, 'epicgames.com') && pathname.includes('/store/')),
  ],
  ['GOG', ({ hostname }) => isHost(hostname, 'gog.com')],
  ['PLAYSTATION', ({ hostname }) => isHost(hostname, 'playstation.com')],
  [
    'MICROSOFT',
    ({ hostname }) => isHost(hostname, 'xbox.com') || isHost(hostname, 'microsoft.com'),
  ],
  [
    'NINTENDO',
    ({ hostname, href }) => /(^|\.)nintendo\./.test(hostname) && /eshop|store/i.test(href),
  ],
  ['APP_STORE', ({ hostname }) => hostname === 'apps.apple.com' || hostname === 'itunes.apple.com'],
  ['GOOGLE_PLAY', ({ hostname }) => hostname === 'play.google.com'],
];

// A loja de um link da IGDB: pelo tipo, quando a IGDB tem tipo próprio para ela; pelo endereço nos
// outros casos. Só links http e https: eles viram href na ficha.
export function classifyStore({ type, url }: Pick<IgdbWebsite, 'type' | 'url'>): Store | null {
  const parsed = webUrl(url);
  if (parsed === null) return null;
  const byType = STORE_BY_WEBSITE_TYPE.get(type);
  if (byType !== undefined) return byType;
  return STORE_BY_URL.find(([, matches]) => matches(parsed))?.[0] ?? null;
}

export const steamStoreUrl = (appId: number) => `https://store.steampowered.com/app/${appId}`;

// Um link por loja, o de menor id na IGDB; a Steam pelo id do jogo nela, quando houver. O link
// fica como a IGDB o registra, inclusive o regional, e sem parâmetro de afiliado acrescentado.
export function storeLinks(
  websites: readonly IgdbWebsite[],
  steamAppId: number | null,
): StoreLink[] {
  const byStore = new Map<Store, IgdbWebsite>();
  for (const website of [...websites].sort((a, b) => a.id - b.id)) {
    const store = classifyStore(website);
    if (store !== null && !byStore.has(store)) byStore.set(store, website);
  }
  const links = [...byStore].map(([store, { url }]) => ({ store, url: url.trim() }));
  if (steamAppId === null) return links;
  return [
    ...links.filter(({ store }) => store !== 'STEAM'),
    { store: 'STEAM', url: steamStoreUrl(steamAppId) },
  ];
}

function webUrl(url: string): URL | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null;
  } catch {
    return null;
  }
}
