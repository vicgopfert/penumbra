import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/config/site';
import { EmailConfirmationBanner } from '@/features/auth/email-confirmation-banner';
import { Providers } from './providers';
import './globals.css';

// Sem canonical aqui: a página que não define o seu herdaria o da raiz.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <SiteHeader />
          <EmailConfirmationBanner />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
