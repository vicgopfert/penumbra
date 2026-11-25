import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadingMessage, SLOW_LOADING_MS, WAKING_HINT } from './loading-message';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('LoadingMessage', () => {
  it('passados 5 s, explica que o servidor pode estar acordando', async () => {
    render(<LoadingMessage>Carregando suas recomendações…</LoadingMessage>);
    expect(screen.getByRole('status')).toHaveTextContent(/^Carregando suas recomendações…$/);

    await act(() => vi.advanceTimersByTimeAsync(SLOW_LOADING_MS));

    expect(screen.getByRole('status')).toHaveTextContent(
      `Carregando suas recomendações… ${WAKING_HINT}`,
    );
  });

  it('sem texto, fica vazio até a espera ficar longa', async () => {
    render(<LoadingMessage />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await act(() => vi.advanceTimersByTimeAsync(SLOW_LOADING_MS));

    expect(screen.getByRole('status')).toHaveTextContent(WAKING_HINT);
  });
});
