import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { legalConfig } from '@/config/legal';
import PrivacyPage from './page';

describe('PrivacyPage', () => {
  it('mostra o título e a data de vigência da última versão', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de privacidade' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Em vigor desde 25 de novembro de 2026.')).toBeInTheDocument();
  });

  it('identifica o controlador e dá o contato', () => {
    render(<PrivacyPage />);

    expect(screen.getByText(new RegExp(legalConfig.controllerName))).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: legalConfig.contactEmail })) {
      expect(link).toHaveAttribute('href', `mailto:${legalConfig.contactEmail}`);
    }
  });

  it('descreve cada grupo de dados com o quê, para quê, base legal e prazo', () => {
    render(<PrivacyPage />);

    for (const id of ['conta', 'biblioteca', 'sessao', 'links-por-email', 'pedidos-ao-contato']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(screen.getAllByText('Base legal')).toHaveLength(6);
    expect(screen.getAllByText('Por quanto tempo')).toHaveLength(6);
  });

  it('cobre provedores, transferência internacional, direitos e as capas da IGDB', () => {
    render(<PrivacyPage />);

    for (const name of [
      'Com quem os dados são compartilhados',
      'Transferência para fora do Brasil',
      'Seus direitos',
      'O que o seu navegador busca em outros sites',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByText(/images\.igdb\.com/)).toBeInTheDocument();
    expect(screen.getByText(/art\. 33, IX/)).toBeInTheDocument();
  });
});
