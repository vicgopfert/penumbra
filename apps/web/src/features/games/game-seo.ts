import type { GameDetail, GameLanguage } from '@indie/contracts';
import { igdbImageUrl } from '@/lib/igdb';
import { absoluteUrl } from '@/lib/site-url';
import { metaDescription } from './game-facts';
import { gameHref } from './paths';

// O que a ficha responde, para quem chega pelo buscador ("<jogo> tem português?") (B-114).
export const gameTitle = ({ name }: Pick<GameDetail, 'name'>) =>
  `${name}: tem português? Onde jogar e jogos parecidos`;

const DESCRIPTION_MAX_LENGTH = 160;
const PLATFORMS_SHOWN = 5;

const listFormat = new Intl.ListFormat('pt-BR', { type: 'conjunction' });

const supportKinds = ({ interface: ui, subtitles, audio }: GameLanguage) =>
  [ui && 'interface', subtitles && 'legendas', audio && 'áudio'].filter((kind): kind is string =>
    Boolean(kind),
  );

// Sem nenhum idioma informado é "não informado", não "não tem" (F-06); pt-BR vem antes de pt-PT.
function portugueseSentence({ name, languages }: Pick<GameDetail, 'name' | 'languages'>) {
  if (languages.length === 0) return `Os idiomas de ${name} não foram informados.`;
  const portuguese =
    languages.find(({ locale }) => locale === 'pt-BR') ??
    languages.find(({ locale }) => locale === 'pt-PT');
  if (!portuguese) return `${name} não tem português.`;
  const variant = portuguese.locale === 'pt-BR' ? 'do Brasil' : 'de Portugal';
  const kinds = supportKinds(portuguese);
  return `${name} tem português ${variant}${kinds.length > 0 ? `: ${listFormat.format(kinds)}` : ''}.`;
}

function platformsSentence(
  { releaseStatus, platforms }: Pick<GameDetail, 'releaseStatus' | 'platforms'>,
  shown: number,
) {
  if (platforms.length === 0 || shown === 0) return null;
  const names = platforms.slice(0, shown).map(({ name }) => name);
  const rest = platforms.length - names.length;
  const list = listFormat.format(rest > 0 ? [...names, `mais ${rest}`] : names);
  return releaseStatus === 'UPCOMING' ? `Em breve para ${list}.` : `Para ${list}.`;
}

// Com o nome longo, a lista de plataformas encolhe antes de o texto ser cortado.
export function gameDescription(game: GameDetail) {
  const portuguese = portugueseSentence(game);
  const closing = 'Veja onde jogar e jogos parecidos.';
  for (let shown = Math.min(PLATFORMS_SHOWN, game.platforms.length); shown >= 0; shown--) {
    const text = [portuguese, platformsSentence(game, shown), closing]
      .filter((sentence): sentence is string => sentence !== null)
      .join(' ');
    if (text.length <= DESCRIPTION_MAX_LENGTH) return text;
  }
  return metaDescription(`${portuguese} ${closing}`, DESCRIPTION_MAX_LENGTH);
}

const organizations = (names: string[]) => names.map((name) => ({ '@type': 'Organization', name }));

const nonEmpty = <T>(key: string, values: T[]) => (values.length > 0 ? { [key]: values } : {});

// schema.org VideoGame, sem preço nem nota: a ficha não tem esses dados, e o Google só dá
// resultado enriquecido de software com os dois (docs/seo.md).
export function gameJsonLd(game: GameDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    url: absoluteUrl(gameHref(game.slug)),
    ...(game.coverImageId && { image: igdbImageUrl(game.coverImageId, 'cover_big_2x') }),
    description: gameDescription(game),
    ...nonEmpty(
      'genre',
      game.genres.map(({ name }) => name),
    ),
    ...nonEmpty(
      'gamePlatform',
      game.platforms.map(({ name }) => name),
    ),
    ...nonEmpty(
      'inLanguage',
      game.languages.map(({ locale }) => locale),
    ),
    ...nonEmpty('author', organizations(game.developers)),
    ...nonEmpty('publisher', organizations(game.publishers)),
    ...(game.releaseStatus === 'RELEASED' &&
      game.firstReleaseDate && { datePublished: game.firstReleaseDate }),
  };
}
