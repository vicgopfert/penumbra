import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError, sampleUser, stubFetch } from '@/test/fetch';
import { renderWithQuery } from '@/test/render';
import { MetricsProvider } from './metrics-provider';
import { flush, resetMetricsForTests } from './tracker';
import { sendEvents } from './transport';

vi.mock('next/navigation', () => ({ usePathname: () => '/jogos/celeste' }));

const sent = vi.mocked(sendEvents);

beforeEach(() => {
  resetMetricsForTests();
  sent.mockClear();
  sessionStorage.clear();
});

describe('MetricsProvider', () => {
  it('sem conta, manda a página vista, anônima', async () => {
    stubFetch(() => apiError(401, 'Sessão ausente ou expirada'));
    renderWithQuery(<MetricsProvider />);

    await waitFor(() => {
      flush();
      expect(sent).toHaveBeenCalled();
    });
    expect(sent.mock.calls[0]?.[0]).toEqual([
      { kind: 'PAGE_VIEW', page: 'GAME', game: 'celeste', visitStart: true, origin: 'DIRECT' },
    ]);
  });

  it('com conta e consentimento, manda', async () => {
    stubFetch(() =>
      Response.json({ ...sampleUser, usageMetricsConsentAt: '2026-11-25T15:00:00Z' }),
    );
    renderWithQuery(<MetricsProvider />);

    await waitFor(() => {
      flush();
      expect(sent).toHaveBeenCalled();
    });
  });

  it('com conta e sem consentimento, não manda nada', async () => {
    const fetchMock = stubFetch(() => Response.json(sampleUser));
    renderWithQuery(<MetricsProvider />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    flush();

    expect(sent).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('penumbra:visita')).toBeNull();
  });
});
