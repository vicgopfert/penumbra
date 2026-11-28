import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

// /api leva ao Render: um robô ali acordaria a API e, ao renderizar a página, gravaria eventos de
// visita (B-100). Os filtros do catálogo geram combinações sem fim; as fichas vêm pelo sitemap. As
// páginas da conta não entram: já têm noindex, e bloqueadas o robô não o veria (docs/seo.md).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/internal/', '/catalogo?'] },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
