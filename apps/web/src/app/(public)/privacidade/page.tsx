import type { Metadata } from 'next';
import Link from 'next/link';
import { legalConfig } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { ContactEmail, LegalPage, LegalSection } from '@/features/legal/legal-page';
import { TERMS_PATH } from '@/features/legal/paths';
import { PERSONAL_DATA } from '@/features/legal/personal-data';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: `Que dados pessoais a ${siteConfig.name} guarda, para quê, por quanto tempo, com quem e como pedir acesso ou exclusão.`,
};

const PROVIDERS = [
  ['Neon', 'banco de dados, onde ficam os dados da conta', 'na Virgínia do Norte, EUA'],
  ['Render', `roda o servidor da ${siteConfig.name}`, 'na Virgínia, EUA'],
  ['Vercel', 'entrega as páginas e repassa os pedidos ao servidor', 'em Washington, EUA'],
  ['Resend', 'envia os e-mails da conta e guarda o conteúdo e os registros', 'nos EUA'],
  ['Google (Gmail)', 'recebe as mensagens enviadas ao e-mail de contato', 'nos EUA'],
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" history={legalConfig.privacyHistory}>
      <p>
        Esta política explica que dados pessoais a {siteConfig.name} guarda, para quê, por quanto
        tempo, com quem eles são compartilhados e como você pode consultá-los, corrigi-los ou
        apagá-los, como pede a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018).
      </p>

      <LegalSection id="resumo" title="Resumo">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Guardamos só o necessário para a sua conta funcionar: e-mail, nome de exibição, senha
            protegida, avaliações, listas e gostos.
          </li>
          <li>
            Não vendemos dados, não mostramos anúncios e não usamos cookies de análise nem de
            publicidade.
          </li>
          <li>
            Medimos o uso do site sem cookies: sem conta, de forma anônima; com conta, só se você
            permitir.
          </li>
          <li>Os dados ficam em servidores nos Estados Unidos, nos provedores listados abaixo.</li>
          <li>
            Você pode pedir uma cópia, a correção ou a exclusão dos seus dados pelo e-mail{' '}
            <ContactEmail />.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="controlador" title="Quem cuida dos seus dados">
        <p>
          A {siteConfig.name} é um projeto acadêmico: o trabalho de conclusão do curso de Tecnologia
          em Análise e Desenvolvimento de Sistemas da UERJ de {legalConfig.controllerName}, que é o
          controlador dos dados, como pessoa física. O site não é um serviço da UERJ.
        </p>
        <p>
          Como agente de tratamento de pequeno porte, a {siteConfig.name} não indica um encarregado
          de dados (Resolução CD/ANPD nº 2/2022). Para qualquer assunto sobre os seus dados, o canal
          é o e-mail <ContactEmail />.
        </p>
      </LegalSection>

      <LegalSection id="dados" title="Que dados guardamos">
        {PERSONAL_DATA.map((group) => (
          <div key={group.id} className="space-y-2">
            <h3 id={group.id} className="text-lg font-medium">
              {group.title}
            </h3>
            <dl className="space-y-2">
              <DataItem term="O quê" description={group.data} />
              <DataItem term="Para quê" description={group.purpose} />
              <DataItem term="Base legal" description={group.legalBasis} />
              <DataItem term="Por quanto tempo" description={group.retention} />
            </dl>
          </div>
        ))}
      </LegalSection>

      <LegalSection id="registros-tecnicos" title="Registros técnicos">
        <p>
          Como qualquer site, a {siteConfig.name} roda em servidores de terceiros. A Vercel, que
          entrega as páginas, e o Render, que roda o servidor, registram dados técnicos de cada
          acesso, como o horário, o endereço pedido e, em geral, o IP e o navegador. A Vercel guarda
          esses registros por 1 hora, e o Render, por 7 dias. Os registros do próprio servidor da{' '}
          {siteConfig.name} guardam só o horário, o endereço pedido, o resultado e a duração, sem IP
          e sem identificar a conta.
        </p>
        <p>
          Base legal: legítimo interesse (LGPD, art. 7º, IX) em manter o site funcionando e seguro.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          A {siteConfig.name} usa um único cookie, o &quot;sid&quot;, que mantém você na conta. Ele
          é essencial, só existe depois que você entra, não pode ser lido pelos scripts da página e
          só vale para este site. Não usamos cookies de análise, de publicidade nem de terceiros. No
          armazenamento do navegador, guardamos só uma marca, sem dado pessoal, que indica que a
          visita já começou, para as métricas de uso contarem cada visita uma vez. Ela some quando a
          aba é fechada.
        </p>
      </LegalSection>

      <LegalSection id="emails" title="E-mails">
        <p>
          Mandamos só os e-mails da conta: a confirmação do e-mail no cadastro, o link de
          redefinição quando você pede e o aviso de que a senha mudou. São mensagens só de texto,
          sem imagens e sem rastreamento de abertura ou de clique. O envio é feito pelo Resend, que
          recebe o seu endereço e o texto da mensagem e os guarda por 30 dias.
        </p>
      </LegalSection>

      <LegalSection id="provedores" title="Com quem os dados são compartilhados">
        <p>
          Não vendemos nem cedemos dados pessoais. Eles passam só pelos provedores que fazem o site
          funcionar, cada um com o necessário para a sua parte:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          {PROVIDERS.map(([name, role, region]) => (
            <li key={name}>
              <strong>{name}</strong>: {role}. Servidores {region}.
            </li>
          ))}
        </ul>
        <p>Também podemos ter de entregar dados quando a lei ou uma ordem judicial exigir.</p>
      </LegalSection>

      <LegalSection id="transferencia-internacional" title="Transferência para fora do Brasil">
        <p>
          Todos esses provedores guardam os dados nos Estados Unidos. A transferência dos dados da
          sua conta se apoia na execução do contrato com você (LGPD, art. 33, IX, com o art. 7º, V):
          sem ela, a conta e as recomendações não funcionariam. Os registros técnicos da Vercel e do
          Render também ficam nos Estados Unidos, assim como o IP usado no limite de envio das
          métricas, que passa só pela memória do servidor, e nenhum desses provedores adota as
          cláusulas-padrão aprovadas pela ANPD. As métricas de uso ligadas à sua conta só existem
          com o seu consentimento, que vale também para a transferência delas aos Estados Unidos
          (LGPD, art. 33, VIII). A transferência dos pedidos ao e-mail de contato para o Google
          (Gmail) se apoia no cumprimento de obrigação legal (LGPD, art. 33, IX, com o art. 7º, II).
        </p>
      </LegalSection>

      <LegalSection id="terceiros" title="O que o seu navegador busca em outros sites">
        <p>
          As capas dos jogos vêm direto dos servidores da IGDB (images.igdb.com), serviço da Twitch,
          nos Estados Unidos. Para mostrar uma capa, o seu navegador pede a imagem a esses
          servidores, que recebem o seu IP e os dados de qualquer acesso, como o navegador usado. A{' '}
          {siteConfig.name} não manda à IGDB nenhum dado da sua conta.
        </p>
        <p>
          Os links para lojas e sites oficiais levam a sites que a {siteConfig.name} não controla,
          com políticas de privacidade próprias.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="Por quanto tempo guardamos">
        <ul className="list-disc space-y-1 pl-6">
          <li>Conta, biblioteca e gostos: até a exclusão da conta.</li>
          <li>Sessões e links enviados por e-mail: pelos prazos descritos acima.</li>
          <li>Métricas de uso: até 12 meses.</li>
          <li>
            Cópias de segurança: o banco permite voltar a um estado das últimas 6 horas, então um
            dado apagado some de vez depois desse prazo.
          </li>
          <li>
            E-mails no Resend: 30 dias. Registros técnicos: 1 hora na Vercel e 7 dias no Render.
          </li>
          <li>
            Pedidos ao e-mail de contato: até 1 ano depois do atendimento, para comprovar que foram
            atendidos.
          </li>
          <li>Se o site sair do ar, os dados das contas serão apagados em até 30 dias.</li>
        </ul>
      </LegalSection>

      <LegalSection id="direitos" title="Seus direitos">
        <p>Pela LGPD (art. 18), você pode:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>saber se tratamos dados seus e receber uma cópia deles;</li>
          <li>corrigir dados incompletos, errados ou desatualizados;</li>
          <li>pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários;</li>
          <li>receber os seus dados num formato que outro serviço possa ler;</li>
          <li>pedir a exclusão da conta e de todos os dados dela;</li>
          <li>saber com quem compartilhamos os seus dados;</li>
          <li>opor-se a um uso feito por legítimo interesse;</li>
          <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </ul>
        <p>
          Notas, listas e gostos você muda a qualquer momento no próprio site, e a sua biblioteca
          aparece no seu perfil, que só você vê, com a sua conta aberta. A permissão das métricas de
          uso você liga e desliga no perfil, e desligar apaga o que estava ligado à sua conta. Para
          o resto, como uma cópia dos dados, a correção do nome ou a exclusão da conta, escreva para{' '}
          <ContactEmail /> a partir do e-mail da conta. Respondemos em até 15 dias. Se o pedido vier
          de outro endereço, podemos pedir uma confirmação de que a conta é sua.
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="Segurança">
        <p>
          Senhas e códigos de sessão e de links ficam guardados só como resumo criptográfico, e toda
          comunicação com o site usa HTTPS. Se acontecer um incidente de segurança que possa trazer
          risco ou dano relevante a você, avisaremos você e a ANPD, como manda a regulamentação.
        </p>
      </LegalSection>

      <LegalSection id="idade" title="Idade">
        <p>
          A {siteConfig.name} é para pessoas com 18 anos ou mais (veja os{' '}
          <Link href={TERMS_PATH} className="underline">
            Termos de uso
          </Link>
          ). Se soubermos que uma conta é de alguém com menos de 18 anos, ela será apagada.
        </p>
      </LegalSection>

      <LegalSection id="tcc" title="Uso no trabalho de conclusão de curso">
        <p>
          Como projeto acadêmico, a {siteConfig.name} pode publicar no trabalho números agregados e
          anônimos sobre o uso, como quantas contas existem, quantos jogos foram avaliados ou
          quantos dos jogos recomendados recebem clique. Esses números nunca identificam uma pessoa.
          Base legal: legítimo interesse (LGPD, art. 7º, IX).
        </p>
      </LegalSection>

      <LegalSection id="mudancas" title="Mudanças nesta política">
        <p>
          Quando a {siteConfig.name} passar a guardar um dado novo ou a usá-lo de outro jeito, esta
          política muda antes, com nova data de vigência e uma linha no histórico abaixo.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function DataItem({ term, description }: { term: string; description: string }) {
  return (
    <div>
      <dt className="font-medium">{term}</dt>
      <dd>{description}</dd>
    </div>
  );
}
