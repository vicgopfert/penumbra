import type { ProductPage } from '@indie/contracts';

// Só o caminho, nunca a consulta: os links de redefinição e de confirmação levam o token nela.
const ACCOUNT_PATHS = [
  'entrar',
  'cadastrar',
  'esqueci-senha',
  'redefinir-senha',
  'confirmar-email',
  'conta-excluida',
];

const FIRST_SEGMENT: Record<string, ProductPage> = {
  catalogo: 'CATALOG',
  perfil: 'PROFILE',
  'boas-vindas': 'ONBOARDING',
  privacidade: 'LEGAL',
  termos: 'LEGAL',
  ...Object.fromEntries(ACCOUNT_PATHS.map((path) => [path, 'ACCOUNT'])),
};

export function pageOf(pathname: string): { page: ProductPage; game?: string } {
  const [first = '', second, ...rest] = pathname.split('/').filter(Boolean);
  if (rest.length > 0) return { page: 'OTHER' };
  if (!first) return { page: 'HOME' };
  if (first === 'jogos' && second) return { page: 'GAME', game: decodeURIComponent(second) };
  if (first === 'colecoes') return { page: second ? 'COLLECTION' : 'COLLECTIONS' };
  if (first === 'recomendacoes')
    return { page: second ? 'RECOMMENDATION_LIST' : 'RECOMMENDATIONS' };
  return !second && FIRST_SEGMENT[first] ? { page: FIRST_SEGMENT[first] } : { page: 'OTHER' };
}
