import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccountDeletedPage, { metadata } from './page';

describe('AccountDeletedPage', () => {
  it('confirma a exclusão, diz o que fica por um tempo e leva ao catálogo', () => {
    render(<AccountDeletedPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Conta excluída' })).toBeInTheDocument();
    expect(screen.getByText(/Não dá para desfazer/)).toBeInTheDocument();
    expect(screen.getByText(/por até 6 horas/)).toHaveTextContent('essas mensagens, por até 1 ano');
    expect(screen.getByRole('link', { name: 'Ver o catálogo' })).toHaveAttribute(
      'href',
      '/catalogo',
    );
  });

  it('não é indexada', () => {
    expect(metadata.robots).toEqual({ index: false });
  });
});
