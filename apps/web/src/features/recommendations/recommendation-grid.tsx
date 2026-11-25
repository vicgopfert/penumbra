import type { Recommendation } from '@indie/contracts';
import { GAME_SLUG_ATTRIBUTE } from '@/features/metrics/game-slug-attribute';
import { RecommendationCard } from './recommendation-card';

// No "ver mais": duas colunas a partir das telas médias, uma no celular, para as 20 da página.
export function RecommendationGrid({ items }: { items: readonly Recommendation[] }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {items.map((recommendation) => (
        <li key={recommendation.game.slug} {...{ [GAME_SLUG_ATTRIBUTE]: recommendation.game.slug }}>
          <RecommendationCard recommendation={recommendation} />
        </li>
      ))}
    </ul>
  );
}
