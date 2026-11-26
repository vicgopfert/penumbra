import type { CollectionSummary } from '@indie/contracts';
import { screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { sampleCollection } from '@/test/catalog';
import { renderAwaitingData } from '@/test/render';
import { CollectionLinks, CollectionShowcase } from './collection-showcase';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: vi.fn() }),
}));

const renderShowcase = (collections: CollectionSummary[] | null) =>
  renderAwaitingData(
    <Suspense fallback={<p>Carregando</p>}>
      <CollectionShowcase
        collections={Promise.resolve(collections)}
        titleAs="h2"
        retryHref="/colecoes"
      />
    </Suspense>,
  );

describe('CollectionShowcase', () => {
  it('mostra cada coleção na ordem recebida, com a descrição, a contagem e o link', async () => {
    await renderShowcase([
      sampleCollection(),
      sampleCollection({
        slug: 'mundo-celta',
        name: 'Mundo celta',
        description: 'Mitos e lendas celtas.',
        gameCount: 1,
      }),
    ]);

    const titles = await screen.findAllByRole('heading', { level: 2 });
    expect(titles.map((title) => title.textContent)).toEqual(['Brasil', 'Mundo celta']);
    expect(screen.getByRole('link', { name: 'Brasil' })).toHaveAttribute(
      'href',
      '/colecoes/brasil',
    );
    expect(screen.getByText('Mitos e lendas celtas.')).toBeInTheDocument();
    expect(screen.getByText('29 jogos')).toBeInTheDocument();
    expect(screen.getByText('1 jogo')).toBeInTheDocument();
  });

  it('se a API falhar, avisa que o servidor está acordando, sem tirar a página do índice', async () => {
    await renderShowcase(null);

    expect(await screen.findByText(/Não foi possível carregar as coleções/)).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar as coleções');
    expect(alert).toHaveTextContent('O servidor está acordando');
    // Só depois das tentativas automáticas o link aparece (/colecoes).
    expect(screen.queryByRole('link', { name: 'Tentar de novo' })).not.toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"][content="noindex"]')).toBeNull();
  });
});

describe('CollectionLinks', () => {
  const renderLinks = (collections: CollectionSummary[] | null) =>
    renderAwaitingData(
      <Suspense fallback={null}>
        <CollectionLinks collections={Promise.resolve(collections)} />
      </Suspense>,
    );

  it('lista os nomes em links', async () => {
    await renderLinks([sampleCollection(), sampleCollection({ slug: 'japao', name: 'Japão' })]);

    expect(await screen.findByRole('link', { name: 'Japão' })).toHaveAttribute(
      'href',
      '/colecoes/japao',
    );
    expect(screen.getByRole('link', { name: 'Brasil' })).toBeInTheDocument();
  });

  it('sem as coleções, não mostra nada', async () => {
    const { container } = await renderLinks(null);

    expect(container).toBeEmptyDOMElement();
  });
});
