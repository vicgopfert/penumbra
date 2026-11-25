import { ServerWaking } from '@/components/server-waking';

export function GameUnavailable({ retryHref }: { retryHref: string }) {
  return <ServerWaking title="Não foi possível carregar o jogo" retryHref={retryHref} />;
}
