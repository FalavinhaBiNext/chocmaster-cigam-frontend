## Why

A lista "Histórico de eventos" da tela de Eventos mostra todos os pedidos recebidos do Bling desde o início, sem recorte de data. Para revisar o que chegou hoje, ontem ou numa semana específica, o usuário precisa rolar a lista ou buscar pedido a pedido. O volume de eventos só cresce, e a conferência diária (pendentes, falhas, valores) depende de olhar um período.

O Dashboard tem um seletor de período, mas ele só oferece "7 / 30 / 90 dias" (sempre terminando hoje) — não cobre "hoje", "ontem", "esta semana", "este mês" nem um intervalo escolhido. Criar o filtro só na tela de Eventos deixaria as duas telas com comportamentos diferentes.

## What Changes

- Novo componente compartilhado de **seleção de período** (`DateRangeFilter`), no mesmo estilo visual do seletor atual do Dashboard (controle segmentado + menu), com os atalhos:
  **Hoje · Ontem · Últimos 7 dias · Esta semana · Últimos 30 dias · Este mês · Mês passado · Últimos 90 dias · Todo o período · Personalizado** (data inicial e final).
- **Tela de Eventos:** o filtro de período passa a limitar a lista "Histórico de eventos", os contadores (Total, Sincronizados, Pendentes, Valor movimentado), os contadores dos filtros Pendentes/Sincronizados/Falhas/Todos e a seleção para exclusão em lote. O período padrão é **Todo o período**, para não esconder nada de quem já usa a tela.
- **Dashboard:** o seletor "7 / 30 / 90 dias" é substituído pelo mesmo componente, ganhando os mesmos atalhos. O período padrão continua **Últimos 30 dias**. Os indicadores com comparação ("vs período anterior") passam a comparar com o período imediatamente anterior de mesma duração.
- Nas duas telas, cada pedido é enquadrado no período pela **data em que foi recebido pelo sistema** (`created_at` do evento), e não pela data do pedido no Bling. No Dashboard isso substitui a regra atual (data do pedido).
- O período escolhido em cada tela é mantido na URL (`?periodo=...`), para que recarregar a página ou compartilhar o link preserve o filtro. Os atalhos do Dashboard que levam para Eventos (`?filtro=falhas`) continuam funcionando.

Sem mudanças de backend: a filtragem acontece no navegador, sobre os eventos já carregados.

## Capabilities

### New Capabilities
- `date-range-filter`: componente de seleção de período — atalhos disponíveis, intervalo personalizado, validação das datas, rótulo exibido, persistência na URL e uso no Dashboard.
- `events-date-filter`: filtragem da tela de Eventos pelo período selecionado — o que é filtrado, qual data do evento é considerada e como interage com busca, filtros de sincronização e exclusão em lote.

### Modified Capabilities
<!-- Nenhum spec existente cobre Dashboard ou Eventos. -->

## Impact

- **Frontend:**
  - novo `src/components/DateRangeFilter.tsx` e utilitário de cálculo de períodos (`src/utils/dateRange.ts`);
  - `src/components/EventsSection.tsx` (filtro, contadores, seleção em lote, leitura/escrita do `?periodo=`);
  - `src/pages/DashboardPage.tsx` e `src/components/dashboard/metrics.ts` (troca do seletor 7/30/90 e cálculo do período anterior).
- **Backend:** nenhum.
- **Dependências:** nenhuma nova (sem biblioteca de calendário; usa `<input type="date">` nativo).
- **Comportamento existente:** a tela de Eventos abre igual a hoje (Todo o período). No Dashboard nenhuma opção some — 7, 30 e 90 dias continuam como "Últimos 7/30/90 dias" — e o padrão segue sendo 30 dias.
