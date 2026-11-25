import Link from 'next/link';
import { PRIVACY_PATH, TERMS_PATH } from '@/features/legal/paths';

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-muted-foreground">
        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            <li>
              <Link href={PRIVACY_PATH} className="underline">
                Privacidade
              </Link>
            </li>
            <li>
              <Link href={TERMS_PATH} className="underline">
                Termos de uso
              </Link>
            </li>
          </ul>
        </nav>
        <p>
          Dados de jogos fornecidos pelo{' '}
          <a
            href="https://www.igdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            IGDB.com
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
