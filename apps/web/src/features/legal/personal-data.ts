import { siteConfig } from '@/config/site';

export type PersonalDataGroup = {
  id: string;
  title: string;
  data: string;
  purpose: string;
  legalBasis: string;
  retention: string;
};

const CONTRACT =
  'Execução do contrato com você (LGPD, art. 7º, V): sem isso, a conta não funciona.';

// Os ids são as âncoras citadas no inventário da API (src/prisma/personal-data-inventory.spec.ts).
export const PERSONAL_DATA: PersonalDataGroup[] = [
  {
    id: 'conta',
    title: 'Sua conta',
    data:
      'E-mail, nome de exibição e senha. A senha fica guardada só como resumo criptográfico ' +
      '(Argon2id), do qual não é possível recuperá-la. Também guardamos a data do cadastro, a da ' +
      'confirmação do e-mail, a do fim das boas-vindas, o modo de descoberta escolhido (Populares, ' +
      'Equilibrado ou Descobertas), o tipo de conta (comum ou de administração) e, se você ' +
      'permitiu as métricas de uso, a data da permissão.',
    purpose:
      'Identificar você, permitir a entrada na conta, mandar os e-mails da conta, ordenar as ' +
      'recomendações pelo modo escolhido e saber se as métricas de uso podem ser ligadas à conta.',
    legalBasis: CONTRACT,
    retention: 'Enquanto a conta existir.',
  },
  {
    id: 'biblioteca',
    title: 'Sua biblioteca e seus gostos',
    data:
      'As notas de 1 a 5 que você dá aos jogos, os jogos nas listas Favorito, Concluído e Quero ' +
      'jogar, os gêneros, temas e etiquetas escolhidos como gostos, e a data de cada um.',
    purpose:
      'Mostrar a sua biblioteca no seu perfil e calcular as suas recomendações. O cálculo usa só os ' +
      'seus dados e as características dos jogos. O seu perfil, com a biblioteca e os gostos, só ' +
      'é visto por você, com a sua conta aberta.',
    legalBasis: CONTRACT,
    retention: 'Enquanto a conta existir, ou até você tirar o item.',
  },
  {
    id: 'sessao',
    title: 'Sessão',
    data:
      'Um código aleatório no cookie "sid" do seu navegador. No servidor, só um resumo ' +
      'criptográfico desse código, com a data de validade.',
    purpose: 'Manter você na conta enquanto navega.',
    legalBasis: CONTRACT,
    retention:
      'Até 7 dias, ou até você sair da conta. A sessão vencida é apagada na limpeza periódica ' +
      'seguinte do banco.',
  },
  {
    id: 'links-por-email',
    title: 'Links enviados por e-mail',
    data:
      'Um resumo criptográfico do código dos links de confirmação do e-mail e de redefinição de ' +
      'senha, com a finalidade e a validade de cada um.',
    purpose: 'Conferir o link quando você o abre.',
    legalBasis: CONTRACT,
    retention:
      'O link de redefinição vale 60 minutos; o de confirmação, 7 dias. Um link novo substitui o ' +
      'anterior, o link usado é apagado na hora, e o vencido, na limpeza periódica seguinte.',
  },
  {
    id: 'limites-de-tentativas',
    title: 'Limites de tentativas',
    data:
      'O endereço IP e o e-mail digitado no cadastro, na entrada, no pedido de redefinição de ' +
      'senha e no reenvio da confirmação.',
    purpose:
      'Frear tentativas repetidas de adivinhar senhas, o cadastro de contas em massa e o envio de ' +
      'e-mails em massa, protegendo a sua conta.',
    legalBasis:
      'Execução do contrato e dos procedimentos que levam a ele, a seu pedido (LGPD, art. 7º, V): ' +
      'proteger a conta faz parte do serviço.',
    retention:
      'Só na memória do servidor, por até 1 hora. Nada disso vai para o banco nem para os ' +
      `registros do próprio servidor da ${siteConfig.name}.`,
  },
  {
    id: 'metricas-de-uso',
    title: 'Métricas de uso',
    data:
      'O tipo de página vista (início, catálogo, ficha de um jogo e assim por diante) e, na ficha, ' +
      'o jogo; se a página abriu a visita e, nesse caso, de onde a visita veio (direto, de um ' +
      'buscador ou de outro site, sem o endereço); os jogos das listas de recomendações e dos ' +
      'semelhantes que apareceram na tela, com o tipo da lista e o modo; os cliques nesses jogos; ' +
      'o "Quero jogar"; e os cliques nos links para lojas e sites oficiais; tudo com a data e a ' +
      'hora. Nenhum desses registros leva IP, e-mail, navegador ou identificador de visita. Sem ' +
      'conta, eles não identificam ninguém. Com a conta aberta e a sua permissão, levam também o ' +
      'identificador da sua conta. Sem a permissão, nada é registrado enquanto você estiver na conta.',
    purpose:
      'Medir se as recomendações ajudam (quantos dos jogos mostrados recebem clique ou "Quero ' +
      'jogar"), por onde as pessoas chegam e, com a permissão, se voltam ao site, para melhorar a ' +
      `${siteConfig.name} e para o trabalho de conclusão de curso, sempre em números agregados.`,
    legalBasis:
      'Os registros sem conta são anônimos (LGPD, art. 12). Os ligados à conta dependem do seu ' +
      'consentimento (LGPD, art. 7º, I), pedido no cadastro e no perfil, desligado por padrão e ' +
      'que você retira quando quiser no perfil.',
    retention:
      'Até 12 meses, apagados na limpeza diária do banco. Desligar a permissão apaga na hora os ' +
      'registros ligados à sua conta, e a exclusão da conta também.',
  },
  {
    id: 'limite-das-metricas',
    title: 'Limite de envio das métricas',
    data: 'O endereço IP de quem envia as métricas de uso, com ou sem conta.',
    purpose:
      'Limitar a 60 envios por minuto vindos do mesmo endereço, para proteger o site contra ' +
      'envios em massa.',
    legalBasis: 'Legítimo interesse (LGPD, art. 7º, IX) em proteger o site contra abuso.',
    retention:
      'Só na memória do servidor, por até 1 minuto. Nada disso vai para o banco nem para os ' +
      `registros do próprio servidor da ${siteConfig.name}.`,
  },
  {
    id: 'pedidos-ao-contato',
    title: 'Pedidos ao e-mail de contato',
    data: 'O e-mail de quem escreve e o conteúdo da mensagem.',
    purpose: 'Atender aos seus pedidos sobre os seus dados.',
    legalBasis: 'Cumprimento de obrigação legal (LGPD, art. 7º, II).',
    retention: 'Até 1 ano depois do atendimento, para comprovar que o pedido foi atendido.',
  },
];
