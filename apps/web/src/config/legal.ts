export type LegalChange = { date: string; change: string };

// Da versão mais recente para a mais antiga: a data da primeira é a de vigência.
export type LegalHistory = [LegalChange, ...LegalChange[]];

export const legalConfig = {
  controllerName: 'Victor Gopfert Ferreira Figueiredo',
  contactEmail: 'penumbraindie@gmail.com',
  privacyHistory: [
    {
      date: '2026-11-26',
      change:
        'Exclusão da conta no perfil, com o aviso por e-mail e a contagem das exclusões só pela data.',
    },
    {
      date: '2026-11-25',
      change:
        'Métricas de uso: registros anônimos sem conta, ligados à conta só com a sua permissão, e o limite de envio por IP.',
    },
    { date: '2026-11-24', change: 'Primeira versão.' },
  ] as LegalHistory,
  termsHistory: [
    { date: '2026-11-26', change: 'Exclusão da conta no perfil.' },
    { date: '2026-11-24', change: 'Primeira versão.' },
  ] as LegalHistory,
};
