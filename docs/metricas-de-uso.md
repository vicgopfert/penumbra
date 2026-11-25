# Métricas de uso (B-100)

Sem medir o uso, não há como saber se alguém volta ao site, onde abandona, se clica nas recomendações ou se sai para uma loja. Sem isso, o valor para o estúdio continua hipótese, e o TCC fica sem dado de uso. Este documento descreve o que a Penumbra registra, o que fica de fora, as definições do relatório e as decisões do autor. A parte legal (bases, transferência internacional e riscos) está em [`privacidade.md`](./privacidade.md).

## O que é registrado

Tudo fica na tabela `ProductEvent`. Os tipos vêm de uma lista fechada no contrato (`packages/contracts/src/events.ts`) e no enum do banco. Um tipo desconhecido ou um campo a mais recebe 400.

| Tipo | Quando | Campos |
| --- | --- | --- |
| `PAGE_VIEW` | Cada página, inclusive nas navegações dentro do site | Tipo da página (`page`); na ficha, o jogo; `visitStart` na primeira página da aba; nela, a origem (`origin`) |
| `LIST_IMPRESSION` | Jogos de uma lista de recomendações, ou dos semelhantes da ficha, que aparecem na tela | Tipo da lista (`list`), modo (`mode`, vazio nos semelhantes), ids dos jogos (`gameIds`), numa linha só |
| `RECOMMENDATION_CLICK` | Clique num jogo dessas listas | Jogo, tipo da lista, modo, posição na lista mostrada e, no "ver mais", a página (`listPage`) |
| `WANT_TO_PLAY` | "Quero jogar" marcado na ficha | Jogo; tipo da lista e modo, quando a pessoa abriu o jogo por uma recomendação na mesma aba, sem recarregar a página |
| `EXIT_CLICK` | Botão de loja em "Onde jogar" ou "Página oficial" | Jogo, `STORE` com a loja ou `OFFICIAL_SITE` |

Todo evento leva a hora do servidor (`occurredAt`), nunca a do navegador.

**Nenhuma coluna guarda IP, e-mail, navegador ou identificador de visita.** Um e2e lê as colunas da tabela no `information_schema` e confere isso.

**A lista vai só pelo tipo** (`MAIN`, `LIKED_GAME`, `INTEREST`, `UPCOMING`, `SIMILAR`), nunca pela chave. A chave `game:celeste` diria um jogo da biblioteca da pessoa.

**A posição** é a do jogo na lista mostrada na tela. No "ver mais", ela é contada dentro da página, e o clique leva também o número da página. O relatório calcula a posição na lista inteira com o tamanho da página da configuração da API (`lists.pageSize`, hoje 20): `(listPage − 1) × pageSize + position`. Sem página, na visão geral e nos semelhantes, a posição já é a da lista inteira. O tamanho usado é o da configuração no momento do relatório: se ele mudar, os cliques anteriores à mudança são lidos com o tamanho novo.

**Jogo que não existe mais:** a API troca o slug pelo id do jogo. Se o slug não existe mais, o evento é descartado. Na página vista e na exibição, só o jogo sai.

## Conta e consentimento

A API decide a conta pela sessão. Ela nunca confia no que o navegador manda.

| Situação | O que é gravado |
| --- | --- |
| Sem sessão | O evento, sem conta. Não identifica ninguém |
| Sessão com consentimento das métricas de uso | O evento, com o `userId` |
| Sessão sem consentimento | Nada. A API responde 204 mesmo assim, e o navegador nem envia |

Mesmo sem o id da conta, os eventos de quem está nela poderiam ser ligados ao perfil, porque os 20 jogos da lista "Para você" são, na prática, únicos por perfil. Por isso, sem consentimento, nada é gravado.

**Consentimento:**
- Fica em `User.usageMetricsConsentAt`.
- Uma caixa desmarcada no cadastro o pede (`usageMetricsConsent` em `POST /api/auth/register`). A seção "Métricas de uso" do perfil o liga e desliga (`PATCH /api/me` com `usageMetricsConsent`).
- Ligar de novo mantém a data, se já estava ligado. Desligar apaga, na mesma transação, os eventos ligados à conta.
- A exclusão da conta (B-52) apaga os eventos dela pela cascata da chave estrangeira.
- As contas que existiam antes deste item ficam sem consentimento.

## Visita sem identificador

A visita é a primeira página da aba:
- O navegador guarda no `sessionStorage` a marca `penumbra:visita`, sem dado pessoal, que some quando a aba fecha.
- A marca só é lida e gravada quando os eventos podem sair. Uma conta sem consentimento não a cria.

Uma aba aberta a partir do próprio site, como a política aberta pelo link do cadastro, continua a visita que já começou.

A origem da visita vai só em categoria, sem o endereço da página de origem:
- `DIRECT`: sem página de origem;
- `SEARCH`: Google, Bing, DuckDuckGo, Yahoo, Ecosia, Yandex e Brave;
- `OTHER_SITE`: qualquer outro site.

## Envio

O módulo `apps/web/src/features/metrics` junta os eventos e os manda em lote a `POST /api/events`:
- **Quando:** 1 segundo depois do primeiro evento, ao sair da página (`pagehide`) ou na hora, no clique de saída.
- **Lote:** até 20 eventos por pedido.
- **Como:** `fetch` com `keepalive`, para o pedido não morrer quando a aba muda. Um erro é ignorado.

Enquanto a sessão carrega, os eventos esperam na memória, até 100.

**Exibição:**
- Conta um jogo com metade da capa ou do cartão na tela, pelo `IntersectionObserver`, uma vez por lista e por carga.
- Os jogos que aparecem juntos viram um evento só.
- Na fileira que rola na horizontal no celular, só contam os jogos que de fato aparecem.

## Limite e retenção

- **Limite:** 60 envios por minuto por IP, só na memória do processo, como os limites da autenticação. O IP não vai para o banco nem para o log. Base legal: legítimo interesse, para proteger o site contra envios em massa. Fica sem mecanismo claro de transferência, junto dos registros técnicos dos provedores (R-26).
- **Retenção:** 12 meses. A limpeza diária, que roda no fim da ingestão agendada (B-54), apaga os eventos mais antigos e registra quantos saíram no log `ProductEvents`.

## Relatório

```bash
# Em apps/api. Contra produção, com o DATABASE_URL de produção no terminal, que vale mais que o do .env.
pnpm events:report --from 2026-11-25 --to 2026-12-02 > relatorio.md
```

O script só lê o banco. As datas seguem o horário de Brasília, e o fim do período é exclusivo. O relatório traz:

| Seção | Definição |
| --- | --- |
| Visitas por origem | `PAGE_VIEW` com `visitStart`, por origem |
| Páginas vistas | `PAGE_VIEW` por tipo de página |
| Funil | Visitas → experimentar (vazio até o B-105) → cadastros (`User.createdAt` no período) → partida a frio concluída (`onboardingCompletedAt` dessas contas) → volta em 7 dias. Cada etapa traz também a proporção sobre a anterior |
| Volta em 7 dias | Entre as contas criadas no período com consentimento desde o cadastro e com os 7 dias já passados: as que têm algum evento num dia seguinte ao do cadastro, até 7 dias depois dele |
| Recomendações por lista e modo | Jogos exibidos (soma dos jogos de cada `LIST_IMPRESSION`), cliques e "quero jogar" com a lista de origem, os dois por mil jogos exibidos; à parte, o "quero jogar" sem recomendação antes |
| Cliques por posição na lista | Cliques em recomendação por tipo de lista e por faixa da posição na lista inteira (1 a 5, 6 a 10, 11 a 20, 21 a 50, 51 ou mais) |
| Cliques de saída | Por tipo e por loja |
| Volume | Linhas por dia, total, quantas ligadas a uma conta, tamanho da tabela com os índices e contas com consentimento |

**Leitura dos números:**
- Os números de recomendação vêm só de quem consentiu, porque as recomendações exigem conta: é uma amostra que se escolhe sozinha.
- As contagens de cadastro e de partida a frio vêm das datas que o serviço já guarda, em números agregados. Esse uso já estava previsto no teste de balanceamento do B-101.

## Decisões do autor (25/11/2026)

1. **Consentimento só para ligar os eventos à conta.**
   - Sem sessão, os eventos são anônimos (LGPD, art. 12).
   - Com sessão e sem consentimento, nada é gravado.
   - O consentimento vale também para a transferência aos EUA (art. 33, VIII).
   - O backlog previa o id da conta por legítimo interesse. A troca segue a decisão 5 do B-101: o legítimo interesse não tem mecanismo claro de transferência, e aqui havia como evitar a lacuna.
2. **Visitante sem identificador.** A visita é a primeira página da aba, e o funil sai em razões agregadas. O backlog previa um hash com sal diário, que exigiria processar IP e navegador na API, e o relatório agregado não precisa dele.
3. **Só os tipos que a interface já tem.** O B-105 (experimentar), o B-107 (não me interessa), o B-89 (lista de desejos) e o B-90 (demo) acrescentam os seus no próprio PR, com migration e atualização da política.
4. **Cadastro e primeira recomendação** vêm de `User.createdAt` e `onboardingCompletedAt`, e não de eventos. Um evento de cadastro seria ligado ao `User` pela hora, sem acrescentar nada.
5. **Exibição contada quando o jogo entra na tela.** O plano dizia "metade da fileira". Na implementação, a conta é feita jogo a jogo, com metade da capa ou do cartão visível. No celular, as fileiras rolam na horizontal e mostram 3 ou 4 dos 20 jogos, e uma grade do "ver mais" mais alta que a tela nunca teria metade visível. **Desvio do plano, aprovado pelo autor em 25/11/2026**, junto com duas escolhas menores: o jogo que não existe mais tira o evento, e não responde 400, para um jogo que saiu do catálogo não derrubar o lote inteiro; e a posição no "ver mais" conta dentro da página (completada pelo ajuste da decisão 6).
6. **A lista guardada só pelo tipo,** com a posição. **Ajuste do autor na aprovação dos textos (25/11/2026):** no "ver mais", o clique leva também o número da página, e o relatório calcula a posição na lista inteira com o tamanho da página da configuração da API. A política não muda, porque "posição" já cobre isso. O "quero jogar" com lista de origem não leva posição e continua igual.
7. **Origem da visita em categoria.**
8. **Limite por IP** de 60 envios por minuto, só na memória, por legítimo interesse. Com o ajuste do autor, a política declara essa base, e o R-26 inclui o uso entre os que não têm mecanismo claro de transferência.
9. **Retenção de 12 meses,** apagados pela limpeza diária. Retirar o consentimento apaga os eventos da conta.
10. **Relatório por script,** rodado pelo autor contra produção. Não há rota interna nem workflow, porque o resumo do Actions de um repositório público é público.
11. **Critério de conclusão:** a conferência em produção depois do merge. A medição de uma semana (linhas por dia e tamanho no Neon) fica como subitem, sem bloquear o B-52.

Ajustes do autor no texto da política, na aprovação do plano:
- **Seção "Cookies":** diz que o navegador guarda só a marca de início de visita, sem dado pessoal, que some ao fechar a aba.
- **Limite de envio das métricas:** a política declara a base como legítimo interesse, com o IP só na memória por até 1 minuto.

## Limitações

- **Quem recusa não aparece.** As métricas de recomendação contam só quem consentiu.
- **Visitas aproximadas:**
  - uma aba nova aberta direto, sem vir do site, conta como outra visita;
  - sem acesso ao `sessionStorage` (alguns modos privados), nenhuma visita é contada, mas as páginas vistas são.
- **Atribuição do "quero jogar":** a lista de origem só existe quando a pessoa chega por uma recomendação na mesma aba, sem recarregar a página. Ela fica só na memória.
- **Bloqueadores e navegadores sem JavaScript** não mandam nada. Os robôs que não executam JavaScript também ficam de fora, o que é desejável.
