import type { ProductEvent } from '@indie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flush, recommendationOf, resetMetricsForTests, setMetricsGate, track } from './tracker';
import { sendEvents } from './transport';

const sent = vi.mocked(sendEvents);
const pageView = (page: 'HOME' | 'CATALOG' = 'HOME'): ProductEvent => ({
  kind: 'PAGE_VIEW',
  page,
  visitStart: false,
});

beforeEach(() => {
  vi.useFakeTimers();
  resetMetricsForTests();
  sent.mockClear();
  sessionStorage.clear();
});

afterEach(() => vi.useRealTimers());

describe('tracker', () => {
  it('junta os eventos e manda o lote pouco depois', () => {
    setMetricsGate('allowed');
    track(pageView());
    track(pageView('CATALOG'));

    expect(sent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);

    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0]?.[0].map((event) => event.kind)).toEqual(['PAGE_VIEW', 'PAGE_VIEW']);
  });

  it('a primeira página da aba abre a visita, com a origem, e marca a aba', () => {
    setMetricsGate('allowed');
    track(pageView());
    track(pageView('CATALOG'));
    flush();
    track(pageView());
    flush();

    expect(sent.mock.calls.flat(2)).toEqual([
      { kind: 'PAGE_VIEW', page: 'HOME', visitStart: true, origin: 'DIRECT' },
      { kind: 'PAGE_VIEW', page: 'CATALOG', visitStart: false },
      { kind: 'PAGE_VIEW', page: 'HOME', visitStart: false },
    ]);
    expect(sessionStorage.getItem('penumbra:visita')).toBe('1');
  });

  it('segura os eventos enquanto a sessão carrega e os manda quando ela permite', () => {
    track(pageView());
    vi.advanceTimersByTime(5000);
    expect(sent).not.toHaveBeenCalled();

    setMetricsGate('allowed');
    vi.advanceTimersByTime(1000);

    expect(sent).toHaveBeenCalledTimes(1);
  });

  it('conta sem consentimento: descarta tudo e nem marca a visita', () => {
    track(pageView());
    setMetricsGate('blocked');
    track(pageView());
    vi.advanceTimersByTime(5000);
    setMetricsGate('allowed');
    vi.advanceTimersByTime(5000);

    expect(sent).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('penumbra:visita')).toBeNull();
  });

  it('o clique de saída sai na hora', () => {
    setMetricsGate('allowed');
    track({ kind: 'EXIT_CLICK', game: 'hades', exit: 'OFFICIAL_SITE' }, { now: true });

    expect(sent).toHaveBeenCalledTimes(1);
  });

  it('divide em lotes de 20', () => {
    setMetricsGate('allowed');
    for (let index = 0; index < 45; index++) track(pageView());
    flush();

    expect(sent.mock.calls.map(([events]) => events.length)).toEqual([20, 20, 5]);
  });

  it('lembra a recomendação que levou ao jogo, só para esse jogo', () => {
    track({
      kind: 'RECOMMENDATION_CLICK',
      game: 'hades',
      list: 'MAIN',
      mode: 'DISCOVERY',
      position: 2,
    });

    expect(recommendationOf('hades')).toEqual({ list: 'MAIN', mode: 'DISCOVERY' });
    expect(recommendationOf('celeste')).toEqual({});
  });
});
