import {
  type DiscoveryMode,
  PRODUCT_EVENTS_MAX,
  type ProductEvent,
  type RecommendationListKind,
} from '@indie/contracts';
import { sendEvents } from './transport';
import { startVisit } from './visit';

// pending: a sessão ainda não carregou. blocked: conta sem o consentimento das métricas de uso,
// e nada sai do navegador; a API confere de novo e também não grava.
export type MetricsGate = 'pending' | 'allowed' | 'blocked';

const FLUSH_DELAY_MS = 1000;
const QUEUE_MAX = 100;

let gate: MetricsGate = 'pending';
let queue: ProductEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let lastRecommendation:
  { game: string; list: RecommendationListKind; mode: DiscoveryMode | null } | undefined;

export function setMetricsGate(next: MetricsGate) {
  gate = next;
  if (gate === 'blocked') queue = [];
  if (gate === 'allowed') schedule();
}

// Os eventos saem em lote, pouco depois; o clique de saída sai na hora, antes de a aba mudar.
export function track(event: ProductEvent, { now = false } = {}) {
  if (gate === 'blocked') return;
  if (event.kind === 'RECOMMENDATION_CLICK') {
    lastRecommendation = { game: event.game, list: event.list, mode: event.mode };
  }
  queue = [...queue, event].slice(-QUEUE_MAX);
  if (now) flush();
  else schedule();
}

// A lista e o modo da recomendação que levou ao jogo, se o jogo foi aberto por uma, nesta aba e
// sem recarregar a página: fica só na memória.
export function recommendationOf(game: string) {
  if (lastRecommendation?.game !== game) return {};
  return { list: lastRecommendation.list, mode: lastRecommendation.mode };
}

export function flush() {
  clearTimeout(timer);
  timer = undefined;
  if (gate !== 'allowed' || queue.length === 0) return;
  const events = withVisitStart(queue);
  queue = [];
  for (let start = 0; start < events.length; start += PRODUCT_EVENTS_MAX) {
    sendEvents(events.slice(start, start + PRODUCT_EVENTS_MAX));
  }
}

function schedule() {
  if (timer === undefined && queue.length > 0) timer = setTimeout(flush, FLUSH_DELAY_MS);
}

// A marca de visita só é lida, e gravada, quando os eventos podem sair.
function withVisitStart(events: ProductEvent[]) {
  const first = events.findIndex((event) => event.kind === 'PAGE_VIEW');
  if (first < 0) return events;
  const visit = startVisit(document.referrer, window.location.host);
  return events.map((event, index) => (index === first ? { ...event, ...visit } : event));
}

export function resetMetricsForTests() {
  clearTimeout(timer);
  timer = undefined;
  gate = 'pending';
  queue = [];
  lastRecommendation = undefined;
}
