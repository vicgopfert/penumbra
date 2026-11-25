import type { ReactNode } from 'react';

// O texto do consentimento das métricas de uso, o mesmo no cadastro e no perfil. A transferência
// para os EUA vem destacada, separada das outras finalidades (LGPD, art. 33, VIII).
export const USAGE_METRICS_LABEL = 'Usar a minha conta nas métricas de uso (opcional)';

export const USAGE_METRICS_ANCHOR = 'metricas-de-uso';

export function UsageMetricsDescription({ policyLink }: { policyLink: ReactNode }) {
  return (
    <>
      <span className="block">
        Com a permissão, a Penumbra liga à sua conta as páginas que você vê, os jogos das
        recomendações que aparecem na sua tela e os seus cliques neles, no &quot;Quero jogar&quot; e
        nos links para lojas e sites oficiais. Serve para medir, no trabalho de conclusão de curso,
        se as recomendações ajudam e se as pessoas voltam ao site.
      </span>
      <span className="block font-medium">
        Esses registros ficam em servidores nos Estados Unidos, como o resto da conta, por até 12
        meses.
      </span>
      <span className="block">
        Sem a permissão, nada disso é registrado enquanto você estiver na conta. Você pode desligar
        no seu perfil quando quiser, e desligar apaga o que já foi registrado. Mais detalhes na{' '}
        {policyLink}.
      </span>
    </>
  );
}
