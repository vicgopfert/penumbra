import type { GameDetail } from '@indie/contracts';
import { Button } from '@/components/ui/button';
import { externalLink } from './external-link';
import { NOT_INFORMED } from './game-facts';

// Plataforma é onde o jogo roda; loja é onde ele é vendido. As duas listas já vêm em ordem
// alfabética da API, e cada botão leva direto à página do jogo na loja (F-34).
export function WhereToPlay({ platforms, stores }: Pick<GameDetail, 'platforms' | 'stores'>) {
  return (
    <section aria-labelledby="where-to-play" className="space-y-2">
      <h2 id="where-to-play" className="font-medium">
        Onde jogar
      </h2>
      <p>
        <span className="text-muted-foreground">Plataformas: </span>
        {platforms.length > 0 ? platforms.map(({ name }) => name).join(', ') : NOT_INFORMED}
      </p>
      {stores.length > 0 && (
        <ul aria-label="Lojas" className="flex flex-wrap gap-2">
          {stores.map(({ store, name, url }) => (
            <li key={store}>
              <Button asChild variant="outline" size="sm">
                <a href={url} {...externalLink}>
                  {name}
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
