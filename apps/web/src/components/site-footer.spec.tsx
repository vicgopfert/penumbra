import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('traz os links da política de privacidade e dos termos de uso', () => {
    render(<SiteFooter />);

    const links = within(screen.getByRole('navigation', { name: 'Rodapé' }))
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      ['Privacidade', '/privacidade'],
      ['Termos de uso', '/termos'],
    ]);
  });

  it('mantém a atribuição à IGDB', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('link', { name: 'IGDB.com' })).toHaveAttribute(
      'href',
      'https://www.igdb.com',
    );
  });
});
