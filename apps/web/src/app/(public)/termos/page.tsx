import type { Metadata } from 'next';
import Link from 'next/link';
import { legalConfig } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { ContactEmail, LegalPage, LegalSection } from '@/features/legal/legal-page';
import { PRIVACY_PATH } from '@/features/legal/paths';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: `As regras de uso da ${siteConfig.name}: quem pode usar, a conta, o uso aceitável e os limites do serviço.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" history={legalConfig.termsHistory}>
      <p>
        Estes termos valem para quem usa a {siteConfig.name} (penumbraindie.com.br). Ao criar uma
        conta, você concorda com eles.
      </p>

      <LegalSection id="o-que-e" title={`O que é a ${siteConfig.name}`}>
        <p>
          Um site gratuito e sem fins comerciais que recomenda jogos independentes pela afinidade
          com o seu gosto. É o trabalho de conclusão de curso de {legalConfig.controllerName}, na
          UERJ, e não um serviço da UERJ.
        </p>
        <p>
          Por ser um projeto acadêmico, o site pode mudar, ficar fora do ar ou ser encerrado a
          qualquer momento. Na hospedagem gratuita, o servidor dorme depois de um tempo sem uso, e o
          primeiro acesso pode demorar.
        </p>
      </LegalSection>

      <LegalSection id="quem-pode-usar" title="Quem pode usar">
        <p>
          Para criar uma conta, você precisa ter 18 anos ou mais. O catálogo, as fichas dos jogos e
          as coleções podem ser vistos sem conta.
        </p>
      </LegalSection>

      <LegalSection id="conta" title="Sua conta">
        <ul className="list-disc space-y-1 pl-6">
          <li>A conta é pessoal. Use um e-mail seu e mantenha a senha em segredo.</li>
          <li>Você responde pelo que for feito com a sua conta.</li>
          <li>
            O nome de exibição não pode ofender, se passar por outra pessoa nem trazer conteúdo
            ilegal.
          </li>
          <li>
            Você pode pedir a exclusão da conta a qualquer momento pelo e-mail <ContactEmail />.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="uso-aceitavel" title="Uso aceitável">
        <p>Não é permitido:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            tentar acessar contas ou dados de outras pessoas, ou contornar a segurança e os limites
            do site;
          </li>
          <li>sobrecarregar o site, por exemplo com acessos automatizados em massa;</li>
          <li>copiar o catálogo em massa ou usar o site para fins comerciais;</li>
          <li>usar o site para qualquer fim ilegal.</li>
        </ul>
        <p>A conta que desrespeitar estes termos pode ser suspensa ou apagada.</p>
      </LegalSection>

      <LegalSection id="dados-dos-jogos" title="Dados dos jogos e marcas">
        <p>
          Os dados dos jogos vêm da IGDB.com e da Steam, e os nomes, capas e marcas pertencem aos
          seus donos. A {siteConfig.name} não tem vínculo com os estúdios, as lojas, a IGDB ou a
          Steam. As informações podem estar desatualizadas ou erradas: confira na loja antes de
          comprar.
        </p>
      </LegalSection>

      <LegalSection id="recomendacoes" title="Recomendações">
        <p>
          As recomendações são sugestões calculadas pelas características dos jogos e pelo que você
          avaliou. Não são análises nem garantia de que você vai gostar. Nenhum estúdio paga para
          aparecer.
        </p>
      </LegalSection>

      <LegalSection id="links-externos" title="Links para outros sites">
        <p>
          Os links para lojas e sites oficiais levam a sites que a {siteConfig.name} não controla,
          com termos e políticas próprios.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidade" title="Responsabilidade">
        <p>
          O site é oferecido como está, sem garantia de funcionamento contínuo nem de que os dados
          estejam completos. Na medida permitida pela lei, a {siteConfig.name} não responde por
          prejuízos decorrentes do uso do site ou dos sites para os quais ele leva. Nada nestes
          termos limita os direitos que a lei garante a você.
        </p>
      </LegalSection>

      <LegalSection id="privacidade" title="Privacidade">
        <p>
          Como tratamos os seus dados está na{' '}
          <Link href={PRIVACY_PATH} className="underline">
            Política de privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="mudancas" title="Mudanças nestes termos">
        <p>
          Estes termos podem mudar. A versão em vigor fica sempre nesta página, com a data no topo e
          o histórico no fim.
        </p>
      </LegalSection>

      <LegalSection id="lei-aplicavel" title="Lei aplicável">
        <p>Estes termos seguem a lei brasileira.</p>
      </LegalSection>

      <LegalSection id="contato" title="Contato">
        <p>
          Dúvidas, pedidos e avisos sobre estes termos: <ContactEmail />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
