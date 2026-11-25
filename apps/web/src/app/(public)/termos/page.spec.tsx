import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TermsPage from './page';

describe('TermsPage', () => {
  it('mostra o título, a data de vigência e o histórico', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Termos de uso' })).toBeInTheDocument();
    expect(screen.getByText('Em vigor desde 25 de novembro de 2026.')).toBeInTheDocument();
    expect(screen.getByText('25 de novembro de 2026: Primeira versão.')).toBeInTheDocument();
  });

  it('exige 18 anos para criar conta e leva à política de privacidade', () => {
    render(<TermsPage />);

    expect(screen.getByText(/você precisa ter 18 anos ou mais/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
  });
});
