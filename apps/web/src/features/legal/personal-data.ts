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
      'Equilibrado ou Descobertas) e o tipo de conta (comum ou de administração).',
    purpose:
      'Identificar você, permitir a entrada na conta, mandar os e-mails da conta e ordenar as ' +
      'recomendações pelo modo escolhido.',
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
    id: 'pedidos-ao-contato',
    title: 'Pedidos ao e-mail de contato',
    data: 'O e-mail de quem escreve e o conteúdo da mensagem.',
    purpose: 'Atender aos seus pedidos sobre os seus dados.',
    legalBasis: 'Cumprimento de obrigação legal (LGPD, art. 7º, II).',
    retention: 'Até 1 ano depois do atendimento, para comprovar que o pedido foi atendido.',
  },
];
