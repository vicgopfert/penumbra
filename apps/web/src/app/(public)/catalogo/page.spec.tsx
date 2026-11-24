import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sampleCollection, sampleGame } from '@/test/catalog';
import { apiError, stubFetch } from '@/test/fetch';
import { renderAwaitingData } from '@/test/render';
import CatalogPage from './page';

vi.mock('next/form', () => import('@/test/next-form'));

const page = (items = [sampleGame()], total = items.length, pageNumber = 1) => ({
  items,
  page: pageNumber,
  pageSize: 24,
  total,
  totalPages: Math.ceil(total / 24),
});

function stubCatalog(
  games: ReturnType<typeof page>,
  collections = () => Response.json([sampleCollection()]),
  platforms = () => Response.json([{ slug: 'ps5', name: 'PS5', gameCount: 2581 }]),
) {
  return stubFetch((path) => {
    if (path.startsWith('/api/games')) return Response.json(games);
    if (path === '/api/collections') return collections();
    if (path === '/api/platforms') return platforms();
    if (path.startsWith('/api/countries')) return Response.json([]);
    return Response.json([{ slug: 'puzzle', name: 'Quebra-cabeça', gameCount: 3607 }]);
  });
}

const renderPage = async (searchParams: Record<string, string | string[]> = {}) =>
  renderAwaitingData(await CatalogPage({ searchParams: Promise.resolve(searchParams) }));

describe('CatalogPage', () => {
  it('repassa os filtros da URL à API e mostra os jogos com o total', async () => {
    const fetchMock = stubCatalog(page([sampleGame()], 30));

    await renderPage({
      genre: 'puzzle',
      portuguese: 'yes',
      country: 'br',
      platform: ['ps5', 'switch'],
      page: '',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/games?platform=ps5&platform=switch&genre=puzzle&portuguese=yes&country=BR',
      expect.anything(),
    );
    expect(screen.getByRole('checkbox', { name: 'PS5 (2.581)' })).toBeChecked();
    expect(screen.getByText('30 jogos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Celeste' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute(
      'href',
      '/catalogo?platform=ps5&platform=switch&genre=puzzle&portuguese=yes&country=BR&page=2',
    );
  });

  it('sem jogos, diz que nada atende e oferece limpar os filtros', async () => {
    stubCatalog(page([], 0));

    await renderPage({ genre: 'puzzle' });

    expect(screen.getByText(/Nenhum jogo com esses filtros/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Limpar filtros' })).not.toHaveLength(0);
  });

  it('página além do fim leva de volta à primeira', async () => {
    stubCatalog(page([], 30, 9));

    await renderPage({ genre: 'puzzle', page: '9' });

    expect(screen.getByRole('link', { name: 'Voltar para a primeira página' })).toHaveAttribute(
      'href',
      '/catalogo?genre=puzzle',
    );
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('URL inválida mostra o problema sem buscar jogos', async () => {
    const fetchMock = stubCatalog(page());

    await renderPage({ page: 'abc' });

    expect(screen.getByRole('alert')).toHaveTextContent('Página: A página deve ser um número.');
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(['/api/collections']);
  });

  it('mostra as coleções em links para a página de cada uma', async () => {
    stubCatalog(page());

    await renderPage();

    const collections = await screen.findByRole('navigation', { name: 'Explore por cultura' });
    expect(within(collections).getByRole('link', { name: 'Brasil' })).toHaveAttribute(
      'href',
      '/colecoes/brasil',
    );
  });

  it('se as coleções falharem, o catálogo continua e elas não aparecem', async () => {
    stubCatalog(page([sampleGame()], 30), () => apiError(500, 'Erro interno'));

    await renderPage();

    expect(await screen.findByText('30 jogos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Celeste' })).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Explore por cultura' }),
    ).not.toBeInTheDocument();
  });

  it('se as opções de plataforma falharem, o catálogo continua sem esse filtro', async () => {
    stubCatalog(page([sampleGame()], 30), undefined, () => apiError(404, 'Não encontrado'));

    await renderPage();

    expect(screen.getByText('30 jogos')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /^Plataforma/ })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: /^Gênero/ })).toBeInTheDocument();
  });

  it('se a API falhar, avisa e oferece tentar de novo na mesma busca', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed');
    });

    await renderPage({ genre: 'puzzle' });

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o catálogo');
    expect(screen.getByRole('link', { name: 'Tentar de novo' })).toHaveAttribute(
      'href',
      '/catalogo?genre=puzzle',
    );
  });
});
