import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WhereToPlay } from './where-to-play';

const section = () => screen.getByRole('region', { name: 'Onde jogar' });

describe('WhereToPlay', () => {
  it('lista as plataformas e um botão por loja, que abre a página do jogo em nova aba', () => {
    render(
      <WhereToPlay
        platforms={[
          { slug: 'win', name: 'PC' },
          { slug: 'switch', name: 'Switch' },
        ]}
        stores={[
          { store: 'GOG', name: 'GOG', url: 'https://www.gog.com/en/game/celeste' },
          { store: 'STEAM', name: 'Steam', url: 'https://store.steampowered.com/app/504230' },
        ]}
      />,
    );

    expect(section()).toHaveTextContent('Plataformas: PC, Switch');
    const stores = within(section()).getByRole('list', { name: 'Lojas' });
    const links = within(stores).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['GOG', 'Steam']);
    expect(links[1]).toHaveAttribute('href', 'https://store.steampowered.com/app/504230');
    expect(links[1]).toHaveAttribute('target', '_blank');
    expect(links[1]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('plataforma sem loja aparece sem botão', () => {
    render(<WhereToPlay platforms={[{ slug: 'switch', name: 'Switch' }]} stores={[]} />);

    expect(section()).toHaveTextContent('Plataformas: Switch');
    expect(within(section()).queryByRole('list', { name: 'Lojas' })).not.toBeInTheDocument();
  });

  it('jogo sem plataforma informada diz "Não informado"', () => {
    render(<WhereToPlay platforms={[]} stores={[]} />);

    expect(section()).toHaveTextContent('Plataformas: Não informado');
  });
});
