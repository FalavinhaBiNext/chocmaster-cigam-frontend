## Context

- `EventsSection.tsx` carrega todos os eventos (`GET /events`) de uma vez e filtra no navegador (`filteredEvents`: filtro de sincronização → unidade de negócio → busca). Indicadores, contadores dos filtros e a seleção em lote derivam dessa lista.
- O Dashboard (`DashboardPage.tsx` + `components/dashboard/metrics.ts`) já filtra eventos por dia com `eventDay()` (data do pedido, com fallback para `created_at`) e chaves `AAAA-MM-DD` em horário local (`dayKey`). O seletor atual é um controle segmentado com `PeriodDays = 7 | 30 | 90` e a comparação usa `periodDays(period, 1)`.
- O projeto não tem biblioteca de datas nem de calendário; a UI usa Tailwind e `lucide-react`. Não há testes no frontend — validação é `npm run lint` + `npm run build`.

## Goals / Non-Goals

**Goals:**
- Um único modelo de período e um único componente usados por Eventos e Dashboard.
- Cálculo de períodos isolado em funções puras, fáceis de revisar.

**Non-Goals:**
- Filtrar no backend / paginar `/events` (continua carregando tudo).
- Filtro por hora/minuto, fusos diferentes do navegador, ou escolha do primeiro dia da semana.
- Aplicar o seletor em outras telas (NF-e, Mapeados) nesta mudança.

## Decisions

**1. Modelo do período: `{ preset, start, end }` com dias `AAAA-MM-DD`.**
`src/utils/dateRange.ts` exporta `type DateRangePreset = 'hoje' | 'ontem' | 'ultimos-7' | 'esta-semana' | 'ultimos-30' | 'este-mes' | 'mes-passado' | 'ultimos-90' | 'tudo' | 'personalizado'` e `resolveRange(preset, today, custom?) → { start: string | null; end: string | null }` (`null` = sem limite, para "Todo o período"). Comparar strings `AAAA-MM-DD` é o mesmo que o Dashboard já faz em `eventsInDays`, e evita armadilhas de fuso do `Date`.
*Alternativa:* guardar `Date` — rejeitada; exigiria normalizar horas e fuso em todo uso.

**2. Data de referência = `created_at` (recebimento no sistema), nas duas telas.**
`dayKey` sai de `dashboard/metrics.ts` para `utils/dateRange.ts`, e `eventDay(event)` passa a ser `dayKey(new Date(event.created_at))` — o dia local em que o webhook chegou. O fallback para `data_pedido` deixa de existir. O Dashboard adota a mesma regra para que "Pedidos recebidos" bata com o total da tela de Eventos no mesmo período (spec `date-range-filter`, "Mesma data de referência").
*Alternativa:* `data_pedido` (data do pedido no Bling) — rejeitada a pedido do usuário: o que importa é quando o pedido entrou no sistema; além disso, pedidos reprocessados/atrasados cairiam em dias passados.
*Impacto no Dashboard:* os números por dia podem mudar levemente em relação a hoje para pedidos recebidos em dia diferente da data do pedido.

**3. Semana começa na segunda-feira.**
Corresponde à semana comercial usada na operação. Fica numa constante (`WEEK_STARTS_ON = 1`) caso precise mudar.

**4. Componente `DateRangeFilter` = botão-resumo + menu (popover) de atalhos.**
O botão mostra o rótulo e as datas aplicadas (spec "Rótulo do período selecionado"). O menu lista os atalhos como linhas (selecionado marcado com check) e, ao fim, "Personalizado" com dois `<input type="date">` (`max` = hoje) e botão "Aplicar", desabilitado com mensagem quando fim < início. Mantém o visual do seletor atual (borda `slate-200`, item ativo `slate-900`). Fecha com Esc e clique fora; navegável por teclado.
O menu é renderizado em **portal com `position: fixed`**, calculado a partir do botão: alinha pela esquerda do botão quando cabe na tela (senão pela direita), abre para cima se faltar espaço embaixo e acompanha rolagem/redimensionamento. Motivo: o painel "Histórico de eventos" tem `overflow-hidden`, e um menu `absolute` dentro dele era cortado (visto no primeiro teste).
*Alternativa:* manter o controle segmentado com 10 botões — rejeitada, não cabe em telas menores. Biblioteca de calendário (react-day-picker) — rejeitada para não adicionar dependência; o input nativo já atende "data inicial e final".

**5. Período na URL: `?periodo=<preset>` ou `?periodo=AAAA-MM-DD_AAAA-MM-DD`.**
Hook `useDateRangeParam(defaultPreset)` lê/escreve via `useSearchParams` com `replace: true` (não polui o histórico) e preserva os demais parâmetros (ex.: `?filtro=falhas` dos atalhos do Dashboard). Valor inválido → padrão da tela.

**6. Eventos: período aplicado primeiro, como uma lista base.**
Em `EventsSection`, `eventsInPeriod = events.filter(dentro do período)` substitui `events` como base de `filteredEvents`, dos indicadores e dos contadores dos chips. A seleção em lote já usa `visiblePendingIds` (derivado de `filteredEvents`), então passa a respeitar o período sem mudança de lógica; o limite de 50 continua igual.

**7. Dashboard: comparação = intervalo anterior de mesma duração.**
`previousRange(start, end)` devolve os N dias imediatamente anteriores. Para "Todo o período", o Dashboard calcula `start` como o dia do evento mais antigo (para o gráfico diário) e oculta a variação (`delta = null`). `PeriodDays` e o array `PERIODS` deixam de existir.

## Risks / Trade-offs

- [Gráfico diário com "Todo o período" pode ter centenas de colunas] → o gráfico já espaça os rótulos do eixo e afina as colunas; aceitável com o volume atual. Se crescer, agrupar por semana fica como evolução.
- [Diferença de fuso: data do pedido do Bling é só data, `created_at` é UTC] → `eventDay` já converte `created_at` para o dia local; mantido.
- [`<input type="date">` tem aparência diferente por navegador] → aceitável; é o único ponto não estilizado do menu.
- [Abrir Eventos por link antigo sem `?periodo`] → padrão "Todo o período", mesmo comportamento de hoje.

## Migration Plan

Só frontend; deploy normal. Rollback = reverter o commit. Nada persiste além da URL.
