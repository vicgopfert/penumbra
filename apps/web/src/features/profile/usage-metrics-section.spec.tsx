import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SESSION_QUERY_KEY } from '@/features/auth/hooks';
import { apiError, sampleUser, stubFetch } from '@/test/fetch';
import { renderWithQuery } from '@/test/render';
import { UsageMetricsSection } from './usage-metrics-section';

const consenting = { ...sampleUser, usageMetricsConsentAt: '2026-11-25T15:00:00.000Z' };

describe('UsageMetricsSection', () => {
  it('liga a permissão e atualiza a sessão', async () => {
    const fetchMock = stubFetch(() => Response.json(consenting));
    const { queryClient } = renderWithQuery(<UsageMetricsSection user={sampleUser} />);
    expect(screen.getByText('Permissão desligada.')).toBeInTheDocument();

    await userEvent
      .setup()
      .click(
        screen.getByRole('checkbox', { name: 'Usar a minha conta nas métricas de uso (opcional)' }),
      );

    await waitFor(() => expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(consenting));
    const [path, init] = fetchMock.mock.calls[0]!;
    expect([path, init?.method, init?.body]).toEqual([
      '/api/me',
      'PATCH',
      JSON.stringify({ usageMetricsConsent: true }),
    ]);
  });

  it('mostra a data da permissão e avisa que desligar apagou os registros', async () => {
    stubFetch(() => Response.json(sampleUser));
    renderWithQuery(<UsageMetricsSection user={consenting} />);
    expect(screen.getByText('Permissão ligada em 25 de novembro de 2026.')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('checkbox'));

    expect(
      await screen.findByText(
        'Permissão desligada. O que estava registrado na sua conta foi apagado.',
      ),
    ).toBeInTheDocument();
  });

  it('mostra o erro da API', async () => {
    stubFetch(() => apiError(500, 'Erro interno'));
    renderWithQuery(<UsageMetricsSection user={sampleUser} />);

    await userEvent.setup().click(screen.getByRole('checkbox'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno');
  });
});
