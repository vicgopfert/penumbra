import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { track } from '@/features/metrics/tracker';
import { ExitLink } from './exit-link';

vi.mock('@/features/metrics/tracker', () => ({ track: vi.fn() }));

describe('ExitLink', () => {
  it('abre em nova aba e conta o clique de saída na hora', async () => {
    render(
      <ExitLink
        href="https://store.steampowered.com/app/1145360"
        event={{ game: 'hades', exit: 'STORE', store: 'STEAM' }}
        onClickCapture={(event) => event.preventDefault()}
      >
        Steam
      </ExitLink>,
    );
    const link = screen.getByRole('link', { name: 'Steam' });

    await userEvent.setup().click(link);

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(track).toHaveBeenCalledWith(
      { kind: 'EXIT_CLICK', game: 'hades', exit: 'STORE', store: 'STEAM' },
      { now: true },
    );
  });
});
