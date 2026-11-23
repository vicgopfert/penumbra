import type { ContentIndex, ContentVector, IndexedGame } from '../content-index';
import { explainer, type ScoredReason } from './explain';
import type { SimilarGamesConfig } from './similar-games-config';
import { sourceSimilarity } from './source-similarity';
import { seededTieBreak } from './tie-break';
import { topIndices } from './top';

type Selection = Pick<SimilarGamesConfig, 'size' | 'minSimilarity'>;

// Os jogos mais parecidos com o da ficha, pelas posições no índice e em ordem de cosseno, sem
// termo de popularidade: a lista é uma propriedade do jogo, a mesma para qualquer visitante. Fica
// de fora o próprio jogo e quem não chega à semelhança mínima; os "Em breve" entram. Os empatados
// são sorteados com o jogo da ficha como semente (B-50).
export function similarGames(
  index: Pick<ContentIndex, 'games' | 'features'>,
  position: number,
  { size, minSimilarity }: Selection,
): number[] {
  const source = index.games[position]!;
  const { positions, values } = sourceSimilarity(index, source);
  const kept: number[] = [];
  const keptValues: number[] = [];
  for (let j = 0; j < positions.length; j++) {
    if (positions[j] === position || values[j]! < minSimilarity) continue;
    kept.push(positions[j]!);
    keptValues.push(values[j]!);
  }
  return topIndices(
    Float64Array.from(keptValues),
    (j) => index.games[kept[j]!]!.id,
    size,
    seededTieBreak(source.id),
  ).map((j) => kept[j]!);
}

// O que o jogo semelhante tem em comum com o da ficha: os atributos de maior contribuição para o
// cosseno, s_k · v_jk, com as regras do motivo das recomendações.
export function commonAttributes(
  index: Pick<ContentIndex, 'features'>,
  source: ContentVector,
): (game: IndexedGame) => ScoredReason | null {
  const vector = new Float64Array(index.features.length);
  source.featurePositions.forEach((position, i) => {
    vector[position] = source.weights[i]!;
  });
  return explainer({ vector, norm: 1 }, index);
}

// Guarda só as posições dos vizinhos de cada jogo, até o limite da configuração, separado da
// semelhança das prateleiras por jogo (SimilarityCache): é a primeira rota pública que faz
// varredura no índice, e robôs de busca percorrendo as fichas não podem tirar daquele cache os
// jogos de origem das prateleiras dos usuários. Vale para um índice só: a recarga cria outro.
export class SimilarGamesCache {
  private readonly entries = new Map<string, Int32Array>();

  constructor(private readonly capacity: number) {}

  get size() {
    return this.entries.size;
  }

  of(gameId: string, compute: () => number[]): Int32Array {
    let neighbors = this.entries.get(gameId);
    if (neighbors === undefined) {
      neighbors = Int32Array.from(compute());
    } else {
      this.entries.delete(gameId);
    }
    this.entries.set(gameId, neighbors);
    if (this.entries.size > this.capacity) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    return neighbors;
  }
}
