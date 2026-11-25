import type { VisitOrigin } from '@indie/contracts';

// A única coisa que o site guarda no navegador para as métricas: uma marca sem dado pessoal de que
// a visita já começou nesta aba. Ela some quando a aba é fechada.
const VISIT_KEY = 'penumbra:visita';

const SEARCH_ENGINES =
  /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|yandex\.[a-z.]+|search\.brave\.com)$/;

export type VisitStart = { visitStart: boolean; origin?: VisitOrigin };

// A primeira página da aba é a visita. Vinda do próprio site (um link aberto em outra aba), ela
// continua uma visita que já começou. Sem acesso ao armazenamento, nenhuma visita é contada.
export function startVisit(referrer: string, ownHost: string): VisitStart {
  try {
    if (sessionStorage.getItem(VISIT_KEY)) return { visitStart: false };
    sessionStorage.setItem(VISIT_KEY, '1');
  } catch {
    return { visitStart: false };
  }
  const origin = originOf(referrer, ownHost);
  return origin ? { visitStart: true, origin } : { visitStart: false };
}

// null: a página de origem é o próprio site.
export function originOf(referrer: string, ownHost: string): VisitOrigin | null {
  if (!referrer) return 'DIRECT';
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return 'DIRECT';
  }
  if (host === ownHost) return null;
  return SEARCH_ENGINES.test(host) ? 'SEARCH' : 'OTHER_SITE';
}
