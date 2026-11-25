export type LegalChange = { date: string; change: string };

// Da versão mais recente para a mais antiga: a data da primeira é a de vigência.
export type LegalHistory = [LegalChange, ...LegalChange[]];

export const legalConfig = {
  controllerName: 'Victor Gopfert Ferreira Figueiredo',
  contactEmail: 'penumbraindie@gmail.com',
  privacyHistory: [{ date: '2026-11-24', change: 'Primeira versão.' }] as LegalHistory,
  termsHistory: [{ date: '2026-11-24', change: 'Primeira versão.' }] as LegalHistory,
};
