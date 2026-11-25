import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_SLUG_ATTRIBUTE } from './game-slug-attribute';
import { TrackedList } from './tracked-list';
import { track } from './tracker';

vi.mock('./tracker', () => ({ track: vi.fn() }));

const tracked = vi.mocked(track);
let observed: { callback: IntersectionObserverCallback; targets: Element[] };

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observed = { callback, targets: [] };
  }
  observe(target: Element) {
    observed.targets.push(target);
  }
  disconnect() {}
}

const appear = (...slugs: string[]) =>
  act(() =>
    observed.callback(
      observed.targets
        .filter((target) => slugs.includes(target.getAttribute(GAME_SLUG_ATTRIBUTE)!))
        .map((target) => ({ target, isIntersecting: true }) as IntersectionObserverEntry),
      {} as IntersectionObserver,
    ),
  );

function List({ games, listPage }: { games: string[]; listPage?: number }) {
  return (
    <TrackedList list="MAIN" mode="BALANCED" games={games} listPage={listPage}>
      <ul>
        {games.map((slug) => (
          <li key={slug} {...{ [GAME_SLUG_ATTRIBUTE]: slug }}>
            <a href={`/jogos/${slug}`} onClick={(event) => event.preventDefault()}>
              {slug}
            </a>
          </li>
        ))}
      </ul>
    </TrackedList>
  );
}

beforeEach(() => {
  tracked.mockClear();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => vi.unstubAllGlobals());

describe('TrackedList', () => {
  it('conta cada jogo uma vez, quando ele aparece na tela', () => {
    render(<List games={['celeste', 'hades', 'tunic']} />);

    appear('celeste', 'hades');
    appear('hades', 'tunic');

    expect(tracked.mock.calls.map(([event]) => event)).toEqual([
      { kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'BALANCED', games: ['celeste', 'hades'] },
      { kind: 'LIST_IMPRESSION', list: 'MAIN', mode: 'BALANCED', games: ['tunic'] },
    ]);
  });

  it('o clique num jogo leva a posição dele na lista', async () => {
    render(<List games={['celeste', 'hades', 'tunic']} />);

    await userEvent.setup().click(screen.getByRole('link', { name: 'tunic' }));

    expect(tracked).toHaveBeenCalledWith({
      kind: 'RECOMMENDATION_CLICK',
      game: 'tunic',
      list: 'MAIN',
      mode: 'BALANCED',
      position: 3,
    });
  });

  it('no "ver mais", o clique leva também a página', async () => {
    render(<List games={['celeste', 'hades']} listPage={3} />);

    await userEvent.setup().click(screen.getByRole('link', { name: 'hades' }));

    expect(tracked).toHaveBeenCalledWith({
      kind: 'RECOMMENDATION_CLICK',
      game: 'hades',
      list: 'MAIN',
      mode: 'BALANCED',
      position: 2,
      listPage: 3,
    });
  });

  it('a lista nova conta de novo os jogos que aparecerem', () => {
    const { rerender } = render(<List games={['celeste']} />);
    appear('celeste');

    rerender(<List games={['celeste', 'hades']} />);
    appear('celeste');

    expect(tracked).toHaveBeenCalledTimes(2);
  });
});
