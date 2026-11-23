import type { RecommendationFeature, RecommendationReason } from '@indie/contracts';
import { FeatureType } from '../../generated/prisma/client';
import type { FeatureLabels } from '../catalog/feature-labels';
import { isLabeledFeatureType } from './content-index';
import type { ScoredReason } from './scoring/explain';
import type { ShelfAttribute } from './scoring/lists';

type Labels = Pick<FeatureLabels, 'name' | 'isHidden'>;

// O nome da etiqueta já está em português, gravado do vocabulário; palavra-chave não tem nome
// exibido. O título da prateleira é o do vocabulário ou, sem ele, o nome.
export function presentFeature(
  labels: Labels,
  attribute: ShelfAttribute | null,
): RecommendationFeature | null {
  if (attribute === null) return null;
  const { type, slug, title } = attribute;
  if (type !== FeatureType.TAG && !isLabeledFeatureType(type)) return null;
  const name = type === FeatureType.TAG ? attribute.name : labels.name(type, slug, attribute.name);
  return { type, slug, name, title: title ?? name };
}

// O motivo não mostra os gêneros e temas escondidos dos filtros.
export function presentReason(
  labels: Labels,
  reason: ScoredReason | null,
): RecommendationReason | null {
  if (reason === null) return null;
  const features = reason.features.flatMap((attribute) => {
    const feature = presentFeature(labels, { ...attribute, title: null });
    if (feature === null) return [];
    if (feature.type !== FeatureType.TAG && labels.isHidden(feature.type, feature.slug)) {
      return [];
    }
    return [{ slug: feature.slug, name: feature.name }];
  });
  return features.length > 0 ? { kind: 'features', features } : null;
}
