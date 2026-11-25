import type { GameDetail } from '@indie/contracts';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sampleGameDetail } from '@/test/catalog';
import { apiError, stubFetch } from '@/test/fetch';
import { renderWithQuery } from '@/test/render';
import GamePage, { generateMetadata } from './page';

const NOT_FOUND = 'NEXT_NOT_FOUND';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error(NOT_FOUND);
  },
}));

// A seção é um componente assíncrono do servidor, com spec próprio; aqui só importa onde ela entra.
vi.mock('@/features/games/similar-games', () => ({
  SimilarGames: ({ slug }: { slug: string }) => <p data-testid="similar-games">{slug}</p>,
}));

const props = (slug = 'celeste') => ({ params: Promise.resolve({ slug }) });

// Quem abre a ficha nestes testes não entrou: a sessão responde 401.
const stubGame = (game: GameDetail) =>
  stubFetch((path) =>
    path === '/api/auth/me' ? apiError(401, 'Sessão ausente ou expirada') : Response.json(game),
  );

// O valor de um item da ficha, como "Português" ou "Publicação".
const fact = (term: string) => screen.getByText(term, { selector: 'dt' }).nextElementSibling;

const renderPage = async (slug?: string) => renderWithQuery(await GamePage(props(slug)));

describe('GamePage', () => {
  it('busca o jogo pelo slug e mostra a ficha', async () => {
    const fetchMock = stubGame(sampleGameDetail());

    await renderPage();

    expect(fetchMock).toHaveBeenCalledWith('/api/games/celeste', expect.anything());
    expect(screen.getByRole('heading', { level: 1, name: 'Celeste' })).toBeInTheDocument();
    expect(screen.getByText('Ajude Madeline a escalar a montanha Celeste.')).toBeInTheDocument();
    expect(fact('Desenvolvimento')).toHaveTextContent('Extremely OK Games');
    expect(fact('Publicação')).toHaveTextContent('Maddy Makes Games');
    expect(fact('País do estúdio')).toHaveTextContent('Canadá (fonte: IGDB)');
    expect(fact('Português')).toHaveTextContent('Português (Brasil): interface e legendas');
  });

  it('convida quem não entrou a entrar para avaliar, voltando para a ficha', async () => {
    stubGame(sampleGameDetail());

    await renderPage();

    expect(await screen.findByRole('link', { name: 'Entre' })).toHaveAttribute(
      'href',
      '/entrar?next=%2Fjogos%2Fceleste',
    );
  });

  it('a capa grande vem da CDN da IGDB, carregada logo', async () => {
    stubGame(sampleGameDetail());

    const { container } = await renderPage();

    const cover = container.querySelector('img');
    expect(cover).toHaveAttribute(
      'src',
      'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co3byy.jpg',
    );
    expect(cover).not.toHaveAttribute('loading', 'lazy');
  });

  it('a página oficial e a IGDB abrem em nova aba', async () => {
    stubGame(sampleGameDetail());

    await renderPage();

    for (const [name, href] of [
      ['Página oficial', 'https://www.celestegame.com'],
      ['IGDB', 'https://www.igdb.com/games/celeste'],
    ] as const) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('gêneros, temas e país levam ao catálogo filtrado', async () => {
    stubGame(sampleGameDetail());

    await renderPage();

    expect(screen.getByRole('link', { name: 'Plataforma' })).toHaveAttribute(
      'href',
      '/catalogo?genre=platform',
    );
    expect(screen.getByRole('link', { name: 'Ação' })).toHaveAttribute(
      'href',
      '/catalogo?theme=action',
    );
    expect(screen.getByRole('link', { name: 'Canadá' })).toHaveAttribute(
      'href',
      '/catalogo?country=CA',
    );
  });

  it('as etiquetas levam ao catálogo filtrado, com a atribuição à comunidade Steam', async () => {
    stubGame(sampleGameDetail());

    await renderPage();

    expect(screen.getByRole('link', { name: 'Difícil' })).toHaveAttribute(
      'href',
      '/catalogo?tag=difficult',
    );
    expect(fact('Etiquetas')).toHaveTextContent(/^Plataforma de PrecisãoDifícil/);
    const attribution = screen.getByRole('link', { name: 'Etiquetas da comunidade Steam' });
    expect(attribution).toHaveAttribute('href', 'https://store.steampowered.com/app/504230');
    expect(attribution).toHaveAttribute('target', '_blank');
  });

  it('as etiquetas da reserva dizem que vieram da IGDB, sem link para a Steam', async () => {
    stubGame(sampleGameDetail({ tagSource: 'IGDB', steamAppId: null }));

    await renderPage();

    expect(fact('Etiquetas')).toHaveTextContent(
      'Etiquetas atribuídas pelo resumo e pelas palavras-chave da IGDB',
    );
    expect(screen.queryByRole('link', { name: /comunidade Steam/ })).toBeNull();
  });

  it('jogo em breve tem o selo e a data prevista', async () => {
    stubGame(sampleGameDetail({ releaseStatus: 'UPCOMING', firstReleaseDate: null }));

    await renderPage();

    expect(screen.getByText('Em breve')).toBeInTheDocument();
    expect(screen.getByText('Sem data prevista')).toBeInTheDocument();
  });

  it('sem os dados opcionais, diz que não foram informados', async () => {
    stubGame(
      sampleGameDetail({
        coverImageId: '',
        themes: [],
        tags: [],
        tagSource: null,
        steamAppId: null,
        developers: [],
        publishers: [],
        studioCountry: null,
        languages: [],
        officialUrl: null,
      }),
    );

    const { container } = await renderPage();

    expect(container.querySelector('img')).not.toBeInTheDocument();
    for (const term of ['Temas', 'Etiquetas', 'Desenvolvimento', 'Publicação', 'País do estúdio']) {
      expect(fact(term)).toHaveTextContent('Não informado');
    }
    expect(fact('Português')).toHaveTextContent('Idiomas não informados');
    expect(screen.getByText('Link oficial não informado')).toBeInTheDocument();
    expect(screen.queryByText(/Todos os idiomas/)).not.toBeInTheDocument();
  });

  it('as coleções do jogo levam à página de cada uma, na ordem recebida', async () => {
    stubGame(
      sampleGameDetail({
        collections: [
          { slug: 'japao', name: 'Japão' },
          { slug: 'mitologia-nordica', name: 'Mitologia nórdica' },
        ],
      }),
    );

    await renderPage();

    const links = within(fact('Coleções') as HTMLElement).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Japão', '/colecoes/japao'],
      ['Mitologia nórdica', '/colecoes/mitologia-nordica'],
    ]);
  });

  it('jogo fora de todas as coleções não mostra o item', async () => {
    stubGame(sampleGameDetail({ collections: [] }));

    await renderPage();

    expect(screen.queryByText('Coleções', { selector: 'dt' })).not.toBeInTheDocument();
  });

  it('mostra "Onde jogar" logo depois da página oficial, antes do resumo', async () => {
    stubGame(sampleGameDetail());

    await renderPage();

    const whereToPlay = screen.getByRole('region', { name: 'Onde jogar' });
    expect(whereToPlay).toHaveTextContent('Plataformas: PC, Switch');
    expect(within(whereToPlay).getByRole('link', { name: 'Steam' })).toHaveAttribute(
      'href',
      'https://store.steampowered.com/app/504230',
    );
    const official = screen.getByRole('link', { name: 'Página oficial' });
    const summary = screen.getByRole('heading', { name: 'Resumo' });
    expect(official.compareDocumentPosition(whereToPlay)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(whereToPlay.compareDocumentPosition(summary)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('mostra os jogos semelhantes no fim da ficha, pelo slug do jogo', async () => {
    stubGame(sampleGameDetail());

    await renderPage();

    const similar = screen.getByTestId('similar-games');
    expect(similar).toHaveTextContent('celeste');
    expect(screen.getByRole('article').compareDocumentPosition(similar)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('jogo inexistente ou fora do catálogo vira a página 404', async () => {
    stubFetch(() => apiError(404, 'Jogo não encontrado.'));

    await expect(GamePage(props('nao-existe'))).rejects.toThrow(NOT_FOUND);
  });

  it('se a API falhar, avisa que o servidor está acordando, fora do índice dos buscadores', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed');
    });

    await renderPage();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar o jogo');
    expect(alert).toHaveTextContent('O servidor está acordando');
    // Só depois das tentativas automáticas o link aparece (/jogos/celeste).
    expect(screen.queryByRole('link', { name: 'Tentar de novo' })).not.toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"][content="noindex"]')).not.toBeNull();
    expect(screen.queryByTestId('similar-games')).not.toBeInTheDocument();
  });
});

describe('generateMetadata', () => {
  it('usa o nome, o resumo e a capa grande do jogo', async () => {
    stubGame(sampleGameDetail());

    expect(await generateMetadata(props())).toEqual({
      title: 'Celeste',
      description: 'Ajude Madeline a escalar a montanha Celeste.',
      openGraph: {
        title: 'Celeste',
        description: 'Ajude Madeline a escalar a montanha Celeste.',
        images: ['https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co3byy.jpg'],
      },
    });
  });

  it('sem capa, não indica imagem', async () => {
    stubGame(sampleGameDetail({ coverImageId: '' }));

    const metadata = await generateMetadata(props());

    expect(metadata.openGraph).not.toHaveProperty('images');
  });

  it('jogo inexistente dá título de não encontrado, sem interromper a renderização', async () => {
    stubFetch(() => apiError(404, 'Jogo não encontrado.'));

    await expect(generateMetadata(props('nao-existe'))).resolves.toEqual({
      title: 'Jogo não encontrado',
    });
  });
});
