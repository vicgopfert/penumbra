import { getSitemap } from '@/features/sitemap/api';
import { sitemapPaths, sitemapXml } from '@/features/sitemap/sitemap-xml';

// Renderizado a cada pedido, sem ir à API quando a lista está no cache de dados (B-102); a
// ingestão a refaz pela tag catalog. Gerado no build, exigiria a API acordada durante o build.
export const revalidate = 0;

const RETRY_AFTER_SECONDS = 120;

// Um Route Handler, e não a convenção sitemap.ts, para responder 503 com a API acordando: a
// convenção responderia 500. Só respostas 200 da API entram no cache, então nunca sai vazio.
export async function GET() {
  try {
    const xml = sitemapXml(sitemapPaths(await getSitemap()));
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } catch {
    return new Response('O servidor está acordando; tente de novo em instantes.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': String(RETRY_AFTER_SECONDS),
      },
    });
  }
}
