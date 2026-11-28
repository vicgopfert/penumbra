import { SitemapSchema } from '@indie/contracts';
import { PUBLIC_CACHE, serverWait } from '@/config/public-cache';
import { apiFetch } from '@/lib/api-client';

export const getSitemap = () =>
  apiFetch('/sitemap', {
    schema: SitemapSchema,
    cache: PUBLIC_CACHE.sitemap,
    signal: serverWait(),
  });
