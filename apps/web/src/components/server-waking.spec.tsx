import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerWaking, WAKING_MAX_RETRIES, WAKING_RETRY_MS } from './server-waking';

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const noindex = () => document.head.querySelector('meta[name="robots"][content="noindex"]');

beforeEach(() => {
  vi.useFakeTimers();
  router.refresh.mockReset();
});

afterEach(() => vi.useRealTimers());

describe('ServerWaking', () => {
  it('avisa que o servidor está acordando e pede a página de novo sozinho, a cada 10 s', async () => {
    render(<ServerWaking title="Não foi possível carregar o jogo" retryHref="/jogos/celeste" />);

    expect(screen.getByRole('status')).toHaveTextContent('O servidor está acordando');
    expect(router.refresh).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(WAKING_RETRY_MS));
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it(`depois de ${WAKING_MAX_RETRIES} tentativas, para e oferece tentar de novo`, async () => {
    render(<ServerWaking title="Não foi possível carregar o jogo" retryHref="/jogos/celeste" />);

    for (let retry = 0; retry < WAKING_MAX_RETRIES + 2; retry++) {
      await act(() => vi.advanceTimersByTimeAsync(WAKING_RETRY_MS));
    }

    expect(router.refresh).toHaveBeenCalledTimes(WAKING_MAX_RETRIES);
    expect(screen.getByRole('alert')).toHaveTextContent('O servidor não respondeu');
    expect(screen.getByRole('link', { name: 'Tentar de novo' })).toHaveAttribute(
      'href',
      '/jogos/celeste',
    );
  });

  it('tira a página do índice dos buscadores, menos quando é só uma seção dela', () => {
    const { unmount } = render(<ServerWaking title="Título" retryHref="/" />);
    expect(noindex()).not.toBeNull();
    unmount();

    render(<ServerWaking title="Título" retryHref="/" noindex={false} />);
    expect(noindex()).toBeNull();
  });
});
