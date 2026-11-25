import type { ProductEvent } from '@indie/contracts';

// keepalive: o clique de saída abre outra aba, e o pedido não pode morrer com a navegação. Uma
// métrica que falha não incomoda ninguém: o erro é ignorado.
export function sendEvents(events: ProductEvent[]) {
  void fetch('/api/events', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  }).catch(() => undefined);
}
