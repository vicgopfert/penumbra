import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TermsPage from './page';

describe('TermsPage', () => {
  it('mostra o título, a data de vigência e o histórico', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Termos de uso' })).toBeInTheDocument();
    expect(screen.getByText('Em vigor desde 26 de novembro de 2026.')).toBeInTheDocument();
    expect(screen.getByText('24 de novembro de 2026: Primeira versão.')).toBeInTheDocument();
  });

  it('a exclusão da conta é feita no perfil, sem pedido por e-mail', () => {
    render(<TermsPage />);

    expect(
      screen.getByText(/excluir a conta a qualquer momento no seu perfil/),
    ).toBeInTheDocument();
  });

  it('exige 18 anos para criar conta e leva à política de privacidade', () => {
    render(<TermsPage />);

    expect(screen.getByText(/você precisa ter 18 anos ou mais/)).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: 'Política de privacidade' })) {
      expect(link).toHaveAttribute('href', '/privacidade');
    }
  });
});
