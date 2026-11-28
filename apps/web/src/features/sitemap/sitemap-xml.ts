import type { Sitemap } from '@indie/contracts';
import { CATALOG_PATH } from '@/features/catalog/search-params';
import { COLLECTIONS_PATH, collectionHref } from '@/features/collections/paths';
import { gameHref } from '@/features/games/paths';
import { PRIVACY_PATH, TERMS_PATH } from '@/features/legal/paths';
import { absoluteUrl } from '@/lib/site-url';

// Sem lastmod: o syncedAt de todo jogo muda a cada ingestão, e o Google ignora um lastmod em que
// não dá para confiar. changefreq e priority o Google também ignora (docs/seo.md).
export const sitemapPaths = ({ games, collections }: Sitemap) => [
  '/',
  CATALOG_PATH,
  COLLECTIONS_PATH,
  ...collections.map((slug) => collectionHref(slug)),
  ...games.map(gameHref),
  PRIVACY_PATH,
  TERMS_PATH,
];

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (char) => XML_ENTITIES[char]!);

export function sitemapXml(paths: string[]) {
  const urls = paths.map((path) => `<url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
