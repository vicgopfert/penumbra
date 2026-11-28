# Páginas públicas servidas de cache (B-102)

A API roda numa instância gratuita do Render, que dorme depois de 15 minutos sem uso e leva até um minuto para acordar. Antes deste item, a ficha, o catálogo, as coleções e a página inicial eram montados a cada pedido e esperavam a API: com ela dormindo, o primeiro visitante e o robô do buscador esperavam cerca de um minuto. Este documento descreve o cache que tira essa espera, a revalidação depois da ingestão, o aviso de servidor acordando e a medição antes e depois.

## O que é guardado

O Next guarda as respostas da API no seu cache de dados (`fetch` com `next: { revalidate, tags }`, `apps/web/src/config/public-cache.ts`). As páginas continuam renderizadas a cada pedido na Vercel, mas sem ir à API quando o dado está no cache.

| Dado | Prazo | Tag |
| --- | --- | --- |
| Ficha (`/games/:slug`) e jogos semelhantes | 1 dia | `games` |
| Coleções (lista e cada coleção) | 1 hora | `collections` |
| Busca do catálogo | 1 hora | `catalog` |
| Opções dos filtros (gêneros, temas, etiquetas, países, plataformas) | 1 dia | `catalog` |

Como o cache se comporta (conferido na documentação e no código do Next 16.4.6, que vêm no pacote):
- **Só respostas 200 entram.** Um 404 ou 5xx da API nunca é guardado, então o 404 da ficha continua 404.
- **Depois do prazo, o dado antigo ainda sai** enquanto o novo é buscado em segundo plano. Se essa busca falha (a API dormindo, por exemplo), o dado antigo continua sendo servido, e a próxima visita tenta de novo.
- **Só dado público.** O `apiFetch` do servidor não repassa cookie: nada da conta passa por esse cache. Nota, listas e recomendações continuam no navegador.
- **Contrato novo.** Se o dado guardado não passar no esquema do contrato, por ser de antes de um deploy que o mudou, o `apiFetch` busca de novo, sem cache, uma vez.

A página inicial e `/colecoes` trocaram `force-dynamic`, que desligaria o cache de todo `fetch` da rota, por `revalidate = 0`: continuam dinâmicas, sem ir à API no build, e respeitam os `fetch` com prazo.

## Por que não o ISR de página inteira

O backlog previa o ISR, que guarda o HTML pronto. Decisão do autor (25/11/2026): cache dos dados no lugar dele, porque o ISR de página inteira:
- geraria no build da Vercel as páginas sem parâmetro (início e coleções), o que exige a API do Render acordada durante o build;
- gravaria o estado de erro por cima da versão boa numa regeneração com a API dormindo, a menos que o erro fosse lançado, e lançado ele daria uma página de erro 500 ao primeiro visitante de uma ficha nova;
- na Vercel, é guardado por deploy: a cada deploy, a primeira visita volta a esperar a API.

O custo da escolha: cada página ainda roda uma função na Vercel. O ISR de página inteira fica como alternativa, se a medição "depois" não atingir o critério.

## Revalidação depois da ingestão

A rota `POST /internal/revalidate` do Next (fora de `/api`, que a Vercel repassa ao Render) chama `revalidateTag` com o perfil `'max'` para `games`, `collections` e `catalog`. Com `'max'`, o próximo visitante ainda recebe o dado anterior enquanto o novo é buscado: ninguém espera a API por causa da revalidação.

- **Proteção:** `Authorization: Bearer <REVALIDATE_SECRET>`, com comparação em tempo constante. O segredo é próprio, e não o `INTERNAL_RELOAD_SECRET` da API, para a Vercel não ter um segredo que também recarrega o índice no Render (decisão do autor).
- **Respostas:** 200 com as tags revalidadas; 401 sem o segredo ou com outro; 503 se o segredo não estiver configurado ou tiver menos de 32 caracteres.
- **Ingestão:** o passo "Revalidação das páginas públicas" do workflow chama a rota depois da recarga do índice e registra a resposta no resumo (`docs/ingestao.md`). Sem o segredo, a execução falha; uma falha da chamada só gera aviso, porque o cache volta sozinho em até um dia.
- **Preços (B-87):** a rodada diária de preços e demos ainda não existe; quando existir, chama a mesma rota no fim, com a mesma linha no resumo (subitem do B-87, decisão do autor).

## Servidor acordando

Quando o dado não está no cache, a busca no servidor espera a API no máximo 8 s (`SERVER_WAIT_MS`). Passado esse tempo, ou com erro, a ficha, o catálogo e as coleções mostram "O servidor está acordando, o que leva até um minuto. Tentando de novo…" (`ServerWaking`). A página pede de novo sozinha a cada 10 s, sem recarregar, até 6 vezes, e depois oferece "Tentar de novo". A contagem fica na memória: nada é guardado no navegador.

**Fora do índice dos buscadores.** O autor pediu que esse estado não fosse indexado, com status 503 e `Retry-After` se o Next permitisse. O Next 16 não deixa uma página do App Router escolher o status: só o 404 (`notFound`), o 401 e o 403 experimentais e os redirecionamentos. E um `proxy` roda antes da página, sem saber se a API vai responder. Por isso o estado leva `<meta name="robots" content="noindex">`, que o React coloca no `<head>`. Na página inicial, as coleções são só uma seção, e o aviso delas não tira a página do índice.

**Páginas da conta.** As recomendações, o perfil, as boas-vindas, a biblioteca na ficha e a sessão buscam pelo navegador. Depois de 5 s carregando, aparece "O servidor pode estar acordando; isso leva até um minuto." (`LoadingMessage`). As novas tentativas continuam as do React Query.

## Conferência local

Com `next start` e a API local (`~/indie-discovery-b102/navegador/check-b102.mjs`):
- com a API ligada, as fichas, a coleção, o catálogo, o início e `/colecoes` respondem 200, e a ficha inexistente responde 404;
- com a API desligada, as mesmas páginas respondem 200 com o conteúdo, sem o aviso;
- com a API "acordando" (uma porta que aceita a conexão e não responde), a ficha nunca visitada mostra o aviso em cerca de 8 s, com o `noindex`, e a visitada continua saindo do cache;
- no navegador, a 390 e a 1280 px, o aviso da ficha aparece sem rolagem horizontal, e a página da conta explica a espera depois de 5 s;
- depois de mudar o nome de um jogo no banco, a ficha segue com o nome guardado até a revalidação; com o segredo errado, 401; com o certo, 200, e a ficha passa a mostrar o nome novo.

## Medição da primeira resposta com a API fria

Critérios fixados em 25/11/2026, às 20:12 UTC, antes de medir (decisão 8 do plano, aprovada pelo autor; arquivo `~/indie-discovery-b102/medicao/criterios.md`):
- **API fria:** 20 minutos sem nenhum pedido meu à API ou ao site. Como não leio o log do Render, a prova é o `contentIndex.loadedAt` da rota de saúde, lido logo depois do pedido medido: posterior ao início da rodada, a API acordou com o pedido, e a rodada vale; anterior, alguém a acordou no meio, e a rodada é descartada e repetida.
- **Medida:** o tempo até o primeiro byte de `GET /jogos/<slug>`, por um pedido HTTPS do Node, com status 200 e o `<h1>` do jogo no HTML. Fichas `celeste`, `hollow-knight` e `stardew-valley`, uma por rodada.
- **Critério, só para o "depois":** as 3 rodadas abaixo de 3 s. Uma rodada acima não é repetida para buscar outro número: vira falha registrada, e a alternativa do ISR de página inteira volta ao autor.
- **Referência com a API acordada, sem critério:** 100 pedidos a uma ficha em cache, com o p95.
- **Limite:** 3 rodadas, e não 100, porque cada uma custa 20 minutos parado.

Acréscimo fixado em 25/11/2026, às 22:46 UTC, antes de qualquer rodada "depois" (decisão do autor):
- **Segunda condição de validade, só no "depois":** a rodada também vale quando o log de pedidos da API mostra que nenhum pedido daquela ficha (`GET /api/games/<slug>` e `/similar`) chegou à API entre o início da rodada e o primeiro byte. Nesse caso o HTML veio do cache, e o tempo não depende de a API estar acordada. O log do Render só é visível para o autor, que confere a janela de cada rodada; como a linha é gravada quando o pedido termina, a janela conferida vai até 2 minutos depois do primeiro byte, e qualquer linha da ficha nela invalida essa condição.
- **A regra do `loadedAt` continua valendo** no "depois", como no "antes". Cada rodada registra qual condição a validou.
- **Inconclusivas:** quando a rota de saúde, lida logo depois do pedido, mostra o índice ainda carregando, a API tinha acabado de acordar, mas não há prova de que foi pelo meu pedido. Essas rodadas ficam registradas à parte e não entram na conta (decisão do autor).

### Antes (produção sem o B-102)

Medido em 25/11/2026, entre 20:30 e 23:17 UTC, contra a produção sem o B-102: 3 rodadas válidas em 9 tentativas. O merge do B-102 esperou o fim desta medição (decisão do autor).

| Ficha | Início da rodada (UTC) | Primeiro byte | Total | Índice carregado em (UTC) |
| --- | --- | --- | --- | --- |
| `celeste` | 21:31:47 | 42,5 s | 43,2 s | 21:32:28 |
| `hollow-knight` | 22:55:31 | 41,9 s | 42,8 s | 22:56:11 |
| `stardew-valley` | 23:16:14 | 43,6 s | 43,7 s | 23:16:55 |

Todas com status 200 e o `<h1>` do jogo no HTML. Nas três, o índice foi carregado cerca de 40 s depois do início da rodada: a API acordou com o pedido medido. Com a API fria, o primeiro visitante de uma ficha esperava entre 42 e 44 s.

Fora da conta:
- **4 descartadas, com a API acordada:** `celeste` às 20:30 e às 21:11, `hollow-knight` às 21:52 e às 22:12, com o primeiro byte entre 1,4 e 1,7 s e o índice carregado antes do início da rodada. Entre 21:32 e 22:12, a API não dormiu: outras visitas a mantiveram acordada, sem como saber quais sem o log do Render.
- **2 inconclusivas, com o índice ainda carregando:** `celeste` às 20:50 (56,1 s) e `hollow-knight` às 22:34 (36,8 s). A API tinha acabado de acordar, mas não há prova de que foi pelo pedido medido.

Os dados brutos estão em `~/indie-discovery-b102/medicao/antes.jsonl`, fora do repositório.

### Depois (produção com o B-102)

Medido entre 26/11/2026, às 20:56 UTC, e 27/11/2026, às 02:48 UTC, com cada ficha visitada antes da espera de 20 minutos: 18 tentativas, todas com status 200, o `<h1>` do jogo no HTML e o primeiro byte entre 0,38 e 1,69 s, abaixo do critério de 3 s.

| Ficha | Início da rodada (UTC) | Primeiro byte | Índice carregado em (UTC) | Condição |
| --- | --- | --- | --- | --- |
| `celeste` | 23:20:25 | 1,29 s | 23:21:05 | `api-fria` |
| `hollow-knight` | 00:42:43 | 1,17 s | 00:43:18 | `api-fria` |
| `stardew-valley` | 01:04:00 | 1,24 s | — (carregando) | `sem-pedido-no-log` |

As 3 rodadas ficaram abaixo de 3 s: o critério foi atingido. Nas duas validadas pelo `loadedAt`, a API acordou com a leitura da rota de saúde feita logo depois do pedido medido, e não com a página. Com a ficha no cache, o primeiro visitante espera cerca de 1,2 s, contra 42 a 44 s no "antes".

**Conferência do log, `stardew-valley`:** em 27/11/2026, o autor buscou `stardew-valley` no log do Render entre 22:00 e 23:50 de Brasília de 26/11, que cobre as 6 janelas da ficha, e não apareceu nenhuma linha. Como controle, a busca por `/api/health` no mesmo período mostrou as leituras da rota de saúde: o log cobre o período, e a busca funciona. Pela segunda condição, as 6 rodadas da ficha valem; a primeira, às 01:04:00, entra na tabela.

Fora da conta, sem prova pela regra do `loadedAt`, com o primeiro byte entre 0,38 e 1,69 s:
- **9 com o índice ainda carregando ou com falha logo depois do pedido:** `celeste` às 20:56, 21:17, 21:38, 21:58, 22:39 e 22:59 (falha); `hollow-knight` às 23:41, 00:01 (falha) e 00:22. A falha é a nova tentativa de carga do índice que já existia na API, que depois ficou pronto.
- **1 com a API acordada:** `celeste` às 22:19.
- **5 de `stardew-valley` além da primeira** (01:24, 01:44, 02:04, 02:25 e 02:46), válidas pelo log, mas fora da tabela, que tem uma rodada por ficha.

As de `celeste` e `hollow-knight` não tiveram o log conferido, porque cada uma dessas fichas já tem uma rodada válida. Os dados brutos estão em `~/indie-discovery-b102/medicao/depois.jsonl`, fora do repositório.
