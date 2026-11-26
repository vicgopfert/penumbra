# Privacidade e termos de uso (B-101)

As páginas públicas [`/privacidade`](https://penumbraindie.com.br/privacidade) e [`/termos`](https://penumbraindie.com.br/termos) dizem a quem usa a Penumbra que dados o site guarda, para quê, por quanto tempo, com quem e como pedir acesso ou exclusão. Este documento guarda o que está por trás delas: as fontes, o inventário campo a campo, as bases legais, o teste de balanceamento do legítimo interesse, a transferência internacional, os riscos que ficaram e a regra de revisão.

Nada aqui, nem nas páginas, substitui orientação jurídica. O texto foi escrito com apoio de IA, a partir da leitura do código e das fontes abaixo, e aprovado pelo autor.

## Fontes

Todas consultadas em 24/11/2026. As cópias baixadas não ficam no repositório; o que importa de cada uma está citado nas seções abaixo.

| Fonte | Link | O que se usou |
| --- | --- | --- |
| LGPD (Lei nº 13.709/2018), texto compilado | <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm> | Bases legais (art. 7º, V e IX), informação ao titular (art. 9º), anonimização (art. 12), crianças e adolescentes (art. 14), direitos (art. 18), prazo de resposta (art. 19), transferência internacional (art. 33) |
| Resolução CD/ANPD nº 19/2024 (Regulamento de Transferência Internacional de Dados e cláusulas-padrão) | <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024> | Mecanismos aceitos (art. 9º, II, "c": as hipóteses dos incisos III a IX do art. 33 da LGPD), mínimo necessário (art. 9º, parágrafo único), prazo de 12 meses para incorporar as cláusulas-padrão (art. 2º, parágrafo único), transparência sobre o país de destino (art. 17) |
| Fim do prazo das cláusulas-padrão da ANPD (Mattos Filho) | <https://www.mattosfilho.com.br/en/unico/dpas-contractual-clauses/> | O prazo terminou em 23/08/2025; cláusulas de outros países, como as da União Europeia, não foram reconhecidas como equivalentes |
| Resolução CD/ANPD nº 2/2022 (agentes de tratamento de pequeno porte) | <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022> | Pessoa natural é agente de pequeno porte (art. 2º, I); dispensa de encarregado com canal de comunicação obrigatório (art. 11); prazo em dobro para responder ao titular (art. 14) |
| ECA Digital (Lei nº 15.211/2025), em vigor desde 17/03/2026 (Machado Meyer) | <https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026> | Aplica-se a serviços de acesso provável por crianças e adolescentes, critério que não depende da declaração do fornecedor (ver Riscos) |
| ECA Digital: o que falta regulamentar (Data Privacy Brasil) | <https://www.dataprivacybr.org/eca-digital-entra-em-vigor-o-que-a-lei-preve-e-o-que-ainda-falta-regulamentar/> | Normas complementares da ANPD sobre verificação de idade ainda pendentes na vigência |
| Render, Data Processing Addendum (modificado em 19/12/2024) | <https://render.com/dpa> | Incorporado aos termos para todo usuário; processamento principal nos EUA; transferências pela Data Privacy Framework e pelas cláusulas da União Europeia e do Reino Unido; não cita LGPD nem ANPD |
| Render, retenção de logs | <https://render.com/docs/logging> | 7 dias no Hobby |
| Vercel, Data Processing Addendum (vigente desde 31/03/2026) | <https://vercel.com/legal/dpa> | Só para os planos Pro e Enterprise; processamento principal nos EUA; cláusulas da União Europeia e do Reino Unido; não cita LGPD nem ANPD |
| Vercel, regiões das funções | <https://vercel.com/docs/functions/configuring-functions/region> | Padrão `iad1` (Washington, EUA); o Hobby tem uma região só |
| Vercel, logs de execução | <https://vercel.com/docs/logs/runtime> | 1 hora de retenção no Hobby; o registro traz caminho, horário, *user agent* e região |
| Neon, Data Processing Agreement | <https://neon.com/pdf/DPA.pdf> | Precisa ser assinado; transferências "em conformidade com as leis aplicáveis", com mecanismos europeus; não cita LGPD nem ANPD |
| Neon, regiões | <https://neon.com/docs/introduction/regions> | Existe `aws-sa-east-1` (São Paulo); o projeto `penumbra` está em `aws-us-east-1` (N. Virginia), conferido pelo autor no painel |
| Neon, janela de histórico | <https://neon.com/docs/introduction/history-window> | 6 horas no plano gratuito |
| Resend, GDPR | <https://resend.com/security/gdpr> | DPA para toda conta; dados guardados nos EUA, inclusive conteúdo e logs, qualquer que seja a região de envio; 30 dias de retenção no plano gratuito; recusa expressamente as cláusulas-padrão da ANPD |
| IGDB, documentação da API | <https://api-docs.igdb.com/> | A API é da Twitch (termos no `docs/m0-relatorio-igdb.md`); as capas vêm de `images.igdb.com` |

## Controlador e canal

O controlador é o autor, Victor Gopfert Ferreira Figueiredo, como pessoa física. As páginas dizem que a Penumbra é o TCC dele na UERJ e não um serviço da UERJ (decisão do autor). Como pessoa natural, ele é agente de tratamento de pequeno porte (Resolução CD/ANPD nº 2/2022, art. 2º, I) e não indica encarregado (art. 11), mas mantém um canal de comunicação: uma caixa de e-mail gratuita, só do projeto, criada pelo autor para não expor o endereço pessoal (decisão do autor). O endereço é penumbraindie@gmail.com e fica em `apps/web/src/config/legal.ts`. A política promete resposta em até 15 dias, o prazo comum do art. 19, II da LGPD, sem usar o prazo em dobro que a Resolução nº 2/2022 (art. 14) daria.

## Inventário campo a campo

Todo campo do `User` e dos modelos ligados a ele no `schema.prisma`, com a seção da página `/privacidade` que o descreve. O teste `apps/api/src/prisma/personal-data-inventory.spec.ts` lê o schema e falha quando aparece um campo que não está nesta lista.

| Campo | Seção da política | Finalidade | Base legal | Retenção |
| --- | --- | --- | --- | --- |
| `User.id`, `User.createdAt` | Sua conta (`#conta`) | Identificar a conta | Contrato (art. 7º, V) | Até a exclusão da conta |
| `User.email` | Sua conta | Entrar na conta e receber os e-mails da conta | Contrato | Até a exclusão da conta |
| `User.passwordHash` | Sua conta | Conferir a senha; só o hash Argon2id | Contrato | Até a exclusão da conta |
| `User.displayName` | Sua conta | Mostrar o nome no cabeçalho e no perfil | Contrato | Até a exclusão da conta |
| `User.role` | Sua conta | Separar conta comum e de administração | Contrato | Até a exclusão da conta |
| `User.discoveryMode` | Sua conta | Ordenar as recomendações pelo modo | Contrato | Até a exclusão da conta |
| `User.onboardingCompletedAt` | Sua conta | Saber se as boas-vindas terminaram | Contrato | Até a exclusão da conta |
| `User.emailConfirmedAt` | Sua conta | Só mandar o link de redefinição a endereço confirmado | Contrato | Até a exclusão da conta |
| `User.usageMetricsConsentAt` | Sua conta | Saber se os eventos de uso podem levar a conta e registrar quando o consentimento foi dado (B-100) | Contrato | Até a exclusão da conta; volta a vazio quando o consentimento é retirado |
| `Session` (id, userId, tokenHash, expiresAt, createdAt) | Sessão (`#sessao`) | Manter a pessoa na conta; só o SHA-256 do token | Contrato | 7 dias ou até sair; a vencida sai na limpeza que roda com a ingestão |
| `AccountToken` (id, userId, purpose, tokenHash, expiresAt, createdAt) | Links enviados por e-mail (`#links-por-email`) | Conferir os links de confirmação e de redefinição; só o SHA-256 | Contrato | 60 minutos (redefinição) ou 7 dias (confirmação); apagado ao ser usado; o vencido sai na limpeza |
| `Rating` (userId, gameId, score, updatedAt) | Sua biblioteca e seus gostos (`#biblioteca`) | Biblioteca e recomendações | Contrato | Até a exclusão da conta ou do item |
| `ListEntry` (userId, gameId, listType, createdAt) | Sua biblioteca e seus gostos | Biblioteca e recomendações | Contrato | Até a exclusão da conta ou do item |
| `UserPreference` (userId, featureId, createdAt) | Sua biblioteca e seus gostos | Recomendações | Contrato | Até a exclusão da conta ou da escolha |
| `ProductEvent` (id, kind, occurredAt, userId, page, visitStart, origin, gameId, gameIds, list, mode, position, listPage, exit, store) | Métricas de uso (`#metricas-de-uso`) | Medir o uso do site e das recomendações (B-100, `docs/metricas-de-uso.md`) | Sem conta: anônimos (art. 12). Com conta: consentimento (art. 7º, I) | 12 meses, pela limpeza diária; os ligados à conta saem na hora quando o consentimento é retirado e com a exclusão da conta |

Dados pessoais fora do banco:

| Dado | Onde | Seção da política | Base legal | Retenção |
| --- | --- | --- | --- | --- |
| IP e e-mail digitado nos limites de tentativas (cadastro, entrada, pedido de redefinição, reenvio da confirmação) | Memória do processo da API, no Render | Limites de tentativas (`#limites-de-tentativas`) | Contrato e procedimentos preliminares a pedido do titular (art. 7º, V): proteger a conta faz parte do serviço | Até 1 hora; some quando a API reinicia |
| IP no limite de envio das métricas de uso (`POST /api/events`, B-100) | Memória do processo da API, no Render | Limite de envio das métricas (`#limite-das-metricas`) | Legítimo interesse (art. 7º, IX): proteger o site contra envios em massa, também de quem não tem conta | Até 1 minuto; some quando a API reinicia |
| Cookie `sid` | Navegador | Cookies | Contrato | 7 dias |
| Marca `penumbra:visita` no `sessionStorage` (B-100) | Navegador | Cookies | Não é dado pessoal: só indica que a visita já começou na aba | Até a aba ser fechada |
| Registros técnicos dos provedores (horário, caminho e, em geral, IP e navegador) | Vercel e Render | Registros técnicos | Legítimo interesse (art. 7º, IX) | 1 hora na Vercel, 7 dias no Render (planos gratuitos) |
| Endereço e texto dos e-mails da conta | Resend | E-mails | Contrato | 30 dias |
| Mensagens ao e-mail de contato (e-mail de quem escreve e conteúdo) | Gmail | Pedidos ao e-mail de contato (`#pedidos-ao-contato`) | Obrigação legal de atender aos direitos do titular (art. 7º, II) | Até 1 ano depois do atendimento |
| Cópias de segurança | Neon | Por quanto tempo guardamos | As mesmas dos dados copiados | 6 horas de histórico (plano gratuito) |

O log de pedidos da própria API registra método, caminho, status, duração, `requestId` e o tamanho do `X-Forwarded-For`, sem IP desde o B-101 (decisão 5 abaixo). O caminho pode trazer o slug do jogo avaliado, como `PUT /api/me/ratings/hades`, mas sem IP e sem conta não identifica ninguém.

## Bases legais

- **Execução de contrato (art. 7º, V):** conta, biblioteca, gostos, recomendações, sessão, links por e-mail, e-mails da conta e limites de tentativas. O cadastro é procedimento preliminar ao contrato, a pedido do titular.
- **Legítimo interesse (art. 7º, IX):** os registros técnicos dos provedores, o limite de envio das métricas de uso (B-100) e os números agregados e anônimos do TCC. O teste de balanceamento está abaixo.
- **Obrigação legal (art. 7º, II):** responder aos pedidos feitos ao e-mail de contato.
- **Consentimento (art. 7º, I):** as métricas de uso ligadas à conta (B-100), pedidas por uma caixa desmarcada no cadastro e pela seção "Métricas de uso" do perfil, com a transferência aos EUA destacada no texto (art. 33, VIII). O Radar por e-mail (B-123) vai pedir o seu quando existir.
- **Anônimos (art. 12):** os eventos de uso de quem está sem conta. Eles não levam IP, e-mail, navegador nem identificador de visita, e não há meio razoável de ligá-los a uma pessoa.

## Teste de balanceamento do legítimo interesse

| Uso | Finalidade | Por que é necessário | Por que não pesa contra quem usa o site |
| --- | --- | --- | --- |
| Registros técnicos dos provedores (Vercel e Render) | Manter o site no ar e investigar falhas e abusos | Entregar uma página pela internet exige que o servidor receba o IP de quem pede, e os provedores guardam esses registros por padrão, sem opção de desligar no plano gratuito | Prazo curto (1 hora e 7 dias), sem ligação com a conta, sem uso para perfil, publicidade ou venda; o próprio log da API não guarda o IP; quem usa um site espera que ele registre acessos para funcionar |
| Limite de envio das métricas de uso (B-100) | Impedir que um envio em massa encha o banco de eventos falsos | A rota é pública, porque os visitantes sem conta também mandam eventos, e o limite por IP é o único que não depende de conta | Só na memória, por até 1 minuto, nunca no banco nem no log; o mesmo mecanismo dos limites da autenticação; sem uso para perfil |
| Números agregados e anônimos no TCC | Descrever o uso da plataforma no trabalho acadêmico | O TCC precisa mostrar se e como o produto foi usado | Calculados sobre dados que já estão guardados para o serviço, sem coletar nada a mais; o resultado é anonimizado (art. 12), não identifica ninguém e não volta para a conta da pessoa |

## Transferência internacional

Todos os provedores guardam dados nos EUA. A Resolução CD/ANPD nº 19/2024 aceita como mecanismo as hipóteses dos incisos III a IX do art. 33 da LGPD (art. 9º, II, "c"). O art. 33, IX permite a transferência "quando necessário para atender as hipóteses previstas nos incisos II, V e VI do art. 7º", entre elas a execução de contrato a pedido do titular.

| Provedor | Papel | Região | DPA | Cobre o Brasil? | Mecanismo usado |
| --- | --- | --- | --- | --- | --- |
| Neon | Banco de dados | `aws-us-east-1` (N. Virginia) | Precisa ser assinado; não foi | Não: mecanismos europeus | Art. 33, IX com o art. 7º, V: os dados do banco são de conta, biblioteca e recomendações. Art. 33, VIII (consentimento) para as métricas de uso ligadas à conta (B-100). A região fica como está (decisão do autor) |
| Render | API, logs e memória dos limites | `virginia` (EUA) | Incorporado aos termos, para todo plano | Não: Data Privacy Framework e cláusulas da União Europeia e do Reino Unido | Art. 33, IX com o art. 7º, V, para o serviço e os limites de tentativas. Art. 33, VIII (consentimento) para as métricas de uso ligadas à conta. Registros técnicos do próprio Render e IP no limite de envio das métricas: sem mecanismo claro (Riscos) |
| Vercel | Páginas e proxy de `/api` | `iad1` (Washington, EUA), o padrão | Não há no plano Hobby | Não | Art. 33, IX com o art. 7º, V, para o serviço. Registros técnicos da Vercel: sem mecanismo claro (Riscos) |
| Resend | E-mails da conta | Envio por `sa-east-1`, mas dados guardados nos EUA | Para toda conta | Não, e recusa expressamente as cláusulas da ANPD | Art. 33, IX com o art. 7º, V: os e-mails da conta fazem parte do serviço |
| Google (Gmail) | Caixa de contato | EUA | Conta pessoal, sem DPA | Não | Art. 33, IX com o art. 7º, II: a obrigação legal de atender aos pedidos do titular |
| IGDB (Twitch) | Capas carregadas pelo navegador | EUA | Não há relação de tratamento: o navegador busca a imagem | Não | Sem mecanismo claro (Riscos) |

Nenhum provedor adota as cláusulas-padrão da ANPD, e a ANPD não reconheceu as cláusulas da União Europeia como equivalentes. A política diz isso abertamente: "nenhum desses provedores adota as cláusulas-padrão aprovadas pela ANPD".

## Riscos que ficaram

Registrados também como R-26 na seção 16 da proposta técnica, com a sugestão de levá-los ao orientador.

- **Registros técnicos da Vercel e do Render.** O IP de quem visita fica nos EUA por legítimo interesse, hipótese que o art. 33, IX não cobre, e sem cláusula da ANPD. Isso existe em qualquer site hospedado nesses provedores e não se desliga no plano gratuito. A política declara os prazos. O plano Pro da Vercel teria DPA, mas ainda sem as cláusulas da ANPD, então não resolve.
- **IP no limite de envio das métricas de uso (B-100).** A rota `POST /api/events` vale também para quem não tem conta, então o limite não se apoia na execução de contrato, como os da autenticação, e sim no legítimo interesse. O IP passa só pela memória do processo, no Render (EUA), por até 1 minuto, também sem mecanismo claro de transferência (decisão do autor, 25/11/2026).
- **Vercel Hobby sem DPA.** A LGPD não exige contrato escrito com o operador, como o GDPR exige (art. 28), mas não há instrumento nenhum com a Vercel.
- **Capas de `images.igdb.com`.** O navegador de quem visita pede cada capa aos servidores da IGDB (Twitch, Amazon, EUA), que recebem o IP. Mitigação possível, fora deste item: servir as capas pelo próprio domínio (decisão do autor, 24/11/2026).
- **ECA Digital (Lei nº 15.211/2025).** A lei vale para serviços de "acesso provável" por crianças e adolescentes, critério que não depende do que o site declara, e um site de jogos pode ser enquadrado assim. Os termos exigem 18 anos para criar conta, só por declaração e sem campo novo (decisão do autor). O catálogo já exclui o tema "Erotic" da IGDB (`indie-criteria.json`). As normas da ANPD sobre verificação de idade estavam pendentes quando a lei entrou em vigor. Ponto para o orientador.

## Decisões do autor (24/11/2026)

1. Controlador: o nome completo do autor, pessoa física, com a nota de projeto acadêmico sem vínculo de serviço com a UERJ. Sem encarregado, pela Resolução CD/ANPD nº 2/2022.
2. Contato: uma caixa dedicada e gratuita, criada pelo autor.
3. Idade mínima de 18 anos, declarada nos termos, sem campo novo.
4. A política descreve só o que existe hoje. O B-100 (eventos) e o B-123 (Radar) a atualizam no próprio PR, com nova data de vigência, antes de coletar. **Cumprido pelo B-100 em 25/11/2026:** nova versão da política, com as métricas de uso e o limite de envio delas.
5. IP no log da API: a decisão era manter e declarar. **Alterada no mesmo dia**, depois da pesquisa de transferência: o IP sai do log de pedidos, porque para o legítimo interesse não há mecanismo de transferência claro para os EUA. Os limites de tentativas passaram para a base de execução de contrato, coberta pelo art. 33, IX.
6. Aceite no cadastro por um texto abaixo do botão, sem caixa de seleção e sem gravar o aceite, porque a base é a execução de contrato. Os links abrem em outra aba, para quem preencheu o formulário não perder o que digitou.
7. Se o site sair do ar, os dados das contas são apagados em até 30 dias.
8. Guarda automática do inventário pelo teste da API.
9. O texto completo das páginas foi entregue ao autor e aprovado por ele antes do commit, com três ajustes: um bloco próprio para os pedidos ao e-mail de contato (obrigação legal, art. 7º, II, e transferência ao Gmail pelo art. 33, IX), a frase de que o perfil só é visto pelo dono da conta (conferido no código: `/perfil` fica atrás da sessão e a API só expõe a biblioteca pelas rotas `/api/me`) e a precisão de que os limites de tentativas não vão para os registros do próprio servidor da Penumbra. A região `iad1` das funções da Vercel foi conferida pelo autor no painel.
10. O termo de consentimento das sessões de teste com pessoas (B-99 e B-44) fica fora deste item, com o B-99.

A seção de transferência internacional, com o DPA de cada provedor, e o teste de balanceamento foram pedidos pelo autor na aprovação do plano.

## Exclusão da conta (B-52)

A pessoa exclui a própria conta no perfil, confirmando com a senha atual (`DELETE /api/me`):
- A exclusão é imediata e definitiva.
- Um único `DELETE` do `User` apaga, pela cascata, as sessões, os links enviados por e-mail, as avaliações, as listas, os gostos e os eventos de uso ligados à conta.
- Um teste da API falha se uma relação com o `User` não for em cascata. Um e2e lê do schema os modelos ligados ao `User` e confere que nenhuma linha da conta sobra.

O que fica fora do banco segue os prazos já declarados: o histórico de 6 horas do Neon, os e-mails no Resend por 30 dias, os registros técnicos da Vercel (1 hora) e do Render (7 dias), e as mensagens ao e-mail de contato, por 1 ano.

**Aviso por e-mail:** vai só para endereço confirmado, depois de a conta ser apagada, sem nenhum texto digitado pela pessoa. O Resend guarda o endereço por 30 dias, como os outros e-mails da conta.

**Contagem das exclusões:** cada exclusão grava uma linha em `AccountDeletion`, só com a data (no dia de Brasília), sem hora e sem nada da conta. Não é dado pessoal: a conta já não existe, e a data sozinha não leva a ninguém. Serve à linha "Contas excluídas no período" do relatório de uso (`docs/metricas-de-uso.md`). Fica fora do inventário, porque não se liga ao `User`.

A senha errada responde 400 no campo, e não 401, que na web quer dizer sessão vencida. A rota tem os mesmos limites do login.

Decisões do autor em 25/11/2026, todas na recomendação do plano:
1. confirmação pela senha atual;
2. `DELETE /api/me` com os limites do login;
3. exclusão imediata, sem carência;
4. aviso só para endereço confirmado;
5. contagem só pela data;
6. página `/conta-excluida`, sem indexação;
7. a guarda da cascata no teste;
8. as contas de teste de produção apagadas por SQL, menos a `+b98`, que o autor exclui pela interface;
9. exclusão no perfil, com o e-mail de contato só para cópia e correção;
10. conclusão com a conferência em produção e as contas de teste apagadas.

**Conferência em produção (25/11/2026, PR #107).** O job de migrations criou a tabela `AccountDeletion` no Neon. Um script no navegador conferiu 10 de 10 itens, das 19:25:13 às 19:25:33 UTC, a 390 px, com uma conta `@example.com` com avaliações, lista e gostos:
- a seção do perfil traz o texto aprovado;
- a senha errada respondeu 400 no campo, com o corpo do `DELETE` passando pelo proxy da Vercel, e a conta continuou;
- a senha certa respondeu 204 e levou à `/conta-excluida`, sem indexação;
- depois, `/auth/me` e o login responderam 401;
- a política e os termos estão no ar com o texto novo.

No mesmo dia, o autor excluiu pela interface uma conta secundária do Gmail dele, com o endereço confirmado, e o aviso "A sua conta na Penumbra foi excluída" chegou. A exclusão das contas de teste por SQL fica para depois (decisão do autor).

Uma conta criada sem senha, como a do login com Google (B-68), vai precisar de outra confirmação, como um link por e-mail. A nota está registrada no B-68.

## Regra de revisão

Todo item que gravar dado pessoal novo, ou usar um dado de outro jeito, atualiza no mesmo PR:
- a página `/privacidade` (e `/termos`, se for o caso);
- uma linha nova no topo do histórico em `apps/web/src/config/legal.ts`, que muda a data de vigência;
- o inventário deste documento e o do teste da API.

O teste falha sozinho quando um campo novo aparece no schema. Um dado fora do banco, como um log novo, um provedor novo ou um recurso de terceiros, depende da revisão do PR. A regra também está no `CONTRIBUTING.md`.

## Histórico

| Data | Mudança |
| --- | --- |
| 26/11/2026 | Exclusão da conta no perfil (B-52): aviso por e-mail, contagem das exclusões só pela data e termos atualizados |
| 25/11/2026 | Métricas de uso (B-100): eventos anônimos sem conta, ligados à conta só com consentimento, marca de visita no `sessionStorage` e limite de envio por IP, por legítimo interesse; inventário, bases legais, balanceamento, transferência e riscos atualizados |
| 24/11/2026 | Primeira versão da política e dos termos (B-101) |
