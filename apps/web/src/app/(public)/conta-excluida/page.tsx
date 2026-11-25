import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { CATALOG_PATH } from '@/features/catalog/search-params';
import { PRIVACY_PATH } from '@/features/legal/paths';

export const metadata: Metadata = { title: 'Conta excluída', robots: { index: false } };

export default function AccountDeletedPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Conta excluída</h1>
      <p>
        A sua conta na {siteConfig.name} foi excluída, com a biblioteca, os gostos, as sessões e as
        métricas de uso ligadas a ela. Não dá para desfazer.
      </p>
      <p>Se o seu e-mail estava confirmado, você vai receber um último e-mail com o aviso.</p>
      <p>
        Alguns registros fora do banco ainda ficam por um tempo, como explica a{' '}
        <Link href={PRIVACY_PATH} className="underline">
          Política de privacidade
        </Link>
        : a cópia de segurança do banco, por até 6 horas; os e-mails no provedor de envio, por até
        30 dias; os registros técnicos dos servidores, por até 7 dias; e, se você escreveu para o
        e-mail de contato, essas mensagens, por até 1 ano.
      </p>
      <p>Você pode continuar usando o catálogo sem conta ou criar uma conta nova quando quiser.</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={CATALOG_PATH}>Ver o catálogo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cadastrar">Criar conta</Link>
        </Button>
      </div>
    </main>
  );
}
