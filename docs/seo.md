# SEO das fichas e sitemap (B-114)

O buscador é o canal de chegada mais provável da Penumbra, e antes deste item nada ajudava a chegar por ele: o título da ficha era só o nome do jogo, a descrição era o resumo da IGDB em inglês, não havia sitemap, `robots.txt` nem *canonical*. Buscas como "Hollow Knight tem português?" e "jogos parecidos com Hades" não tinham como trazer ninguém. Este documento descreve o que a ficha diz ao buscador, os dados estruturados, o sitemap, o `robots.txt`, o *canonical*, o Search Console, as medições e o risco do estado "servidor acordando". Decisões do autor em 27/11/2026, todas na recomendação do plano, mais dois acréscimos dele (o título e o uso da Vercel na medição).

## Título e descrição da ficha

- **Título:** "\<Nome\>: tem português? Onde jogar e jogos parecidos", com o "· Penumbra" do modelo do layout no fim (texto do autor). Nomes longos ficam cortados no resultado da busca, e o Google pode reescrever o título.
- **Descrição:** montada em português com os dados da ficha, no lugar do resumo da IGDB, que é em inglês. Até 160 caracteres, em três frases:
  - **Português**, pela mesma regra da ficha (F-06): "\<Nome\> tem português do Brasil: interface e legendas." (os tipos que houver); só com pt-PT, "… tem português de Portugal: legendas."; sem português, "\<Nome\> não tem português."; sem nenhum idioma informado, "Os idiomas de \<Nome\> não foram informados.".
  - **Plataformas:** "Para Mac, PC e Switch."; nos "Em breve", "Em breve para PC e PS5.". Até 5 plataformas, e depois "e mais N"; sem plataforma, a frase sai.
  - **Fim:** "Veja onde jogar e jogos parecidos."
  - Acima de 160 caracteres, a lista de plataformas encolhe primeiro, até sair; se ainda passar, o texto é cortado na última palavra inteira.
- Exemplo: "Celeste tem português do Brasil: interface e legendas. Para Mac, PC e Switch. Veja onde jogar e jogos parecidos." (113 caracteres).
- O `og:title` e o `og:description` usam os mesmos textos. Os 13 jogos sem a seção de semelhantes (B-50) também prometem "jogos parecidos" (decisão do autor).
- Código: `apps/web/src/features/games/game-seo.ts`.

## Dados estruturados

**Ficha:** um `<script type="application/ld+json">` com um `VideoGame` do schema.org, só com a ficha carregada (no estado "servidor acordando", não sai):

| Campo | De onde vem | Quando falta |
| --- | --- | --- |
| `name`, `url` | nome e endereço de produção da ficha | — |
| `image` | capa grande da IGDB | sem capa, sai |
| `description` | a descrição acima | — |
| `genre` | gêneros, com os nomes em português | sem gênero, sai |
| `gamePlatform` | plataformas, com o nome curto da ficha | sem plataforma, sai |
| `inLanguage` | os *locales* dos idiomas (`pt-BR`, `en-US`…) | sem idioma, sai |
| `author` | desenvolvedoras, como `Organization` | sem desenvolvedora, sai |
| `publisher` | publicadoras, como `Organization` | sem publicadora, sai |
| `datePublished` | data de lançamento, só dos lançados | "Em breve" ou sem data, sai |

- **Sem resultado enriquecido.** O resultado enriquecido de software do Google exige preço e nota, que a ficha não tem; por isso o `VideoGame` não é combinado com `SoftwareApplication`, para o Google não cobrar os campos que faltam. O ganho é o buscador entender a página como um jogo, com os dados dela (decisão do autor).
- **Escape.** O JSON sai com o `<` escrito como `<`: um texto da IGDB com `</script>` não fecha a tag. O `dangerouslySetInnerHTML`, proibido pelo lint do projeto, é liberado só nesse componente (`components/json-ld.tsx`): como texto, o React escaparia o `<` como entidade, que dentro de `<script>` não é decodificada.

**Página inicial:** um `WebSite` com o nome "Penumbra" e o endereço, que o Google usa para mostrar o nome do site no resultado. "Penumbra" é palavra comum, e sem isso o Google pode mostrar só o domínio.

## Endereço do site e *canonical*

- O endereço de produção, `https://penumbraindie.com.br`, é uma constante em `apps/web/src/config/site.ts`, e não uma variável de ambiente: o domínio está fixo desde o B-83 (decisão do autor). Ele vira o `metadataBase` do layout, e o *canonical*, o sitemap e os dados estruturados apontam para ele em qualquer ambiente. Nos *previews* da Vercel, o *canonical* aponta para produção, e a própria Vercel manda `noindex` nesses endereços.
- O layout não define *canonical*: a página que não define o seu herdaria o da raiz.
- *Canonical* por página: a ficha, pelo slug que vem da API; a coleção, a própria página, com `?page=n` a partir da 2; o catálogo, `/catalogo` sem parâmetros, inclusive quando filtrado; e `/`, `/colecoes`, `/privacidade` e `/termos`.
- **Onde as tags saem.** O Next 16 pode mandar os metadados em *streaming*, no `<body>`, e o Google só aceita o *canonical* no `<head>`. Na ficha e na coleção, que não têm `loading.tsx`, a resposta só começa depois dos metadados, e as tags saem no `<head>`, para o navegador e para o Googlebot (conferido localmente, com os dois *user agents*). No catálogo, que tem `loading.tsx`, os metadados são fixos e também saem no `<head>` (conferido na visita a todas as URLs do sitemap).

## `robots.txt`

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /internal/
Disallow: /catalogo?

Sitemap: https://penumbraindie.com.br/sitemap.xml
```

- **`/api/`** leva ao Render pelo *rewrite* da Vercel. Bloqueado, o robô não acorda a API por ali e, ao renderizar a página, não grava eventos de visita do B-100, que não filtram robôs.
- **`/catalogo?`**: os filtros do catálogo geram combinações sem fim, e a ficha leva a várias delas. O bloqueio segue a orientação do Google para navegação facetada. O custo: as páginas filtradas, como "roguelike", não entram no índice; páginas de entrada por filtro ficam para depois, como a "Feito no Brasil" do B-129. As fichas chegam ao buscador pelo sitemap.
- **As páginas da conta não entram no bloqueio:** já têm `noindex`, e bloqueadas o robô não veria a tag (decisão do autor).
- Código: `apps/web/src/app/robots.ts`.

## Sitemap

- **Fonte:** a rota pública `GET /api/sitemap` da API devolve só os slugs: os jogos do catálogo e as coleções com algum jogo nele, ordenados por código de caractere (a ordem do banco depende da *collation*, que muda entre ambientes). Pela busca do catálogo, com até 48 jogos por página, seriam cerca de 500 chamadas.
- **Conteúdo:** `/`, `/catalogo`, `/colecoes`, as coleções, as fichas, `/privacidade` e `/termos`. Fora: as páginas da conta, de entrada e os filtros.
- **Sem `lastmod`, `changefreq` e `priority`.** O `syncedAt` de todo jogo muda a cada ingestão, e um `lastmod` feito com ele diria "mudou hoje" para todos, todos os dias; o Google ignora um `lastmod` em que não dá para confiar, e ignora `changefreq` e `priority`.
- **Cache e ingestão:** a lista entra no cache de dados do Next por 1 dia, com a tag `catalog` (`PUBLIC_CACHE.sitemap`). A revalidação que a ingestão já chama no fim (B-102) refaz o sitemap, sem mudança no workflow.
- **API acordando:** o sitemap é um *Route Handler* (`app/sitemap.xml/route.ts`), e não a convenção `sitemap.ts` do Next, para responder **503 com `Retry-After: 120`** quando a API não responde em 8 s e a lista não está no cache. A convenção responderia 500. É o único lugar em que o 503 que o autor pediu no B-102 é possível. Como só respostas 200 entram no cache, nunca sai um sitemap vazio. Na ordem dos deploys, a Vercel publica antes do Render: até a API nova subir, o sitemap responde 503, e nada é guardado.
- **Tamanho:** o cache de dados do Next não guarda itens acima de 2 MB (`incremental-cache/index.js`, Next 16.4.6). Regra fixada antes de medir (decisão 5): acima de 1,5 MB, o sitemap seria dividido em índice e partes. Medido no banco local em 27/11/2026: 23.641 jogos e 10 coleções, **439.758 bytes (0,42 MB)**, cerca de 18,6 bytes por jogo; a rota responde em 0,32 s localmente. Arquivo único. O XML do sitemap local tem 23.656 URLs e 1,74 MB; o limite do protocolo é 50.000 URLs e 50 MB. A conferência em produção falha acima de 45.000 URLs, para dividir o sitemap antes do limite.

## O risco do estado "servidor acordando"

Uma ficha fora do cache, com a API dormindo, mostra depois de 8 s o aviso de servidor acordando, com `noindex` (B-102). Uma ficha que o Google recebe assim sai do índice até ele voltar a ela, e o sitemap convida o robô a visitar cerca de 24 mil fichas, quase todas fora do cache. Dois cenários:
- **Ficha nunca visitada com a API dormindo.** Independe do B-102: o robô deve rastrear aos poucos, com a API dormindo entre um lote e outro.
- **Logo depois de cada ingestão, se a reprodução do B-102 confirmar o problema** (a Vercel não entregar a cópia antiga depois da revalidação).

Decisões do autor (27/11/2026):
- **O merge espera o resultado da reprodução do B-102.** Se ela confirmar o problema, a correção entra antes, no B-102, em branch e PR próprios; depois vêm o merge deste item e o envio do sitemap. Se refutar, o merge segue.
- **Regra fixada antes de medir**, para a medição de 7 dias depois do envio do sitemap: abre-se um item novo com as opções (aquecer o cache visitando o sitemap aos poucos; esperar mais que 8 s quando o pedido vem de um robô, com o mesmo conteúdo, o que não é *cloaking*; manter a API acordada, ligado ao B-103) se:
  - "Excluída pela tag noindex" chegar a **5% ou mais** das URLs descobertas pelo sitemap; ou
  - o uso da Vercel passar de **70% de alguma cota** do plano Hobby (acréscimo do autor).

  Abaixo dos dois, o número é registrado e nada muda agora.

## Search Console

- **Propriedade:** do tipo Domínio, `penumbraindie.com.br`, verificada por um registro TXT na zona do registro.br. Feito pelo autor.
- **Depois do merge:** envio de `https://penumbraindie.com.br/sitemap.xml` em "Sitemaps" e "Testar URL publicada" de 2 fichas em "Inspeção de URL".
- **Medição de 7 dias depois do envio** (critério de conclusão): o autor lê os números, porque o painel só é visível para ele, e eu registro:
  - em "Sitemaps": a situação e as URLs descobertas;
  - em "Indexação de páginas": as indexadas e as não indexadas por motivo, em especial "Excluída pela tag noindex";
  - em "Desempenho": impressões e cliques;
  - **em Vercel → Usage (acréscimo do autor):** as invocações de funções e o uso do cache de dados, cada um com o uso, a cota do plano Hobby que o painel mostra e a porcentagem, lidos no mesmo dia. A cota é a do painel no dia da leitura, e não uma copiada antes, porque a Vercel muda as cotas.
- **Conferência de 4 semanas:** subitem que não bloqueia o item.
- **Fora deste item:** o Bing Webmaster Tools.

## Privacidade

Sem mudança na política (decisão do autor). O Search Console é verificado pelo DNS e não põe nenhum recurso no site: o Google não recebe dado de quem visita por causa dele. O JSON-LD e o sitemap só têm dados públicos do catálogo. Registro também em `docs/privacidade.md`.

## Conferência local

Com `next start` e a API local (`~/indie-discovery-b114/navegador/check-b114.mjs <web> <api> --full --browser`, critérios em `~/indie-discovery-b114/criterios.md`, fixados em 27/11/2026, às 23:36 UTC, antes de medir):

- **`robots.txt`** com as linhas acima, sem bloquear as fichas nem a conta.
- **Sitemap:** 23.656 URLs (as 23.641 fichas do catálogo local, igual ao `total` de `GET /api/games`, as 10 coleções e as 5 páginas fixas), sem repetição, sem páginas da conta nem filtros, todas com o endereço de produção; 1,74 MB de XML.
- **Todas as 23.656 URLs visitadas** em 536 s, com 8 pedidos em paralelo (mediana 133 ms, p95 435 ms): todas com status 200, sem `noindex` e com o *canonical* no `<head>` igual à própria URL. O *canonical* da raiz sai como `https://penumbraindie.com.br`, sem a barra final, que pela especificação de URL é o mesmo endereço do sitemap. Nenhuma com o aviso de servidor acordando.
- **As 10 fichas da amostra** (7 sorteadas com a semente `b114` e 3 casos-limite: sem idiomas, "Em breve" sem data e sem desenvolvedora), com o *user agent* de um navegador e com o do Googlebot: um único `VideoGame`, com o `name` igual ao `<h1>`, a `url` igual ao *canonical*, nenhum campo vazio, o título com a pergunta e a descrição até 160 caracteres, igual à do JSON-LD.
- **Página inicial** com o `WebSite`; catálogo filtrado com o *canonical* em `/catalogo`; ficha inexistente continua 404, sem JSON-LD.
- **No navegador**, a 390 e a 1280 px, numa ficha e na página inicial: um JSON-LD depois da hidratação, o *canonical* no `<head>`, nenhum erro além dos que já existiam (o 401 da sessão de quem não entrou e o `favicon.ico`, que o site não tem) e nenhuma rolagem horizontal.
- **API acordando** (uma porta que aceita a conexão e não responde), com o cache vazio: o sitemap respondeu 503 com `Retry-After: 120` em 8,1 s, e uma ficha nunca visitada mostrou o aviso, com `noindex` e sem JSON-LD nem *canonical*.
- **API desligada**, com a lista no cache: o sitemap respondeu 200 em 0,10 s, com as 23.656 URLs.

Total: 160 de 160 conferências na rodada final. Na primeira rodada completa, 154 de 160: o script comparava o *canonical* da raiz com a barra final, e contava como erro o 401 da sessão e o 404 do `favicon.ico`. O script foi corrigido para comparar as URLs normalizadas e ignorar só esses dois pedidos, e a amostra, a página inicial e o navegador rodaram de novo.

## Conferência em produção

Depois do merge.
