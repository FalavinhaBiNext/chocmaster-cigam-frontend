## 1. Modelo de período

- [x] 1.1 Criar `src/utils/dateRange.ts` com `DateRangePreset`, `dayKey`, `eventDay`, `resolveRange`, `previousRange`, `isDayInRange`, `formatRangeLabel` e `parseRangeParam`/`serializeRangeParam` (semana começando na segunda); verificar com um script avulso (Node, fora do repositório) que 14/10/2026 produz exatamente os intervalos dos cenários do spec `date-range-filter` e que parâmetros inválidos voltam `null`
- [x] 1.2 Mover `dayKey` de `components/dashboard/metrics.ts` para `utils/dateRange.ts` e redefinir `eventDay` como o dia local do `created_at` (sem fallback para `data_pedido`), usado por Eventos e Dashboard; verificar no script do 1.1 que um `created_at` de 02:30 UTC em 12/10 cai em 11/10 no fuso de São Paulo, e com `npm run build`

## 2. Componente e hook

- [x] 2.1 Criar `src/components/DateRangeFilter.tsx` (botão-resumo com rótulo e datas, menu de atalhos com check no ativo, "Personalizado" com dois `<input type="date">` com `max` = hoje, botão "Aplicar" bloqueado e mensagem quando fim < início, fecha com Esc/clique fora); verificar com `npm run lint` e `npm run build`
- [x] 2.2 Criar o hook `useDateRangeParam(defaultPreset)` que lê/escreve `?periodo=` com `replace` e preserva outros parâmetros da URL; verificar no build e, na tela, que `?filtro=falhas` continua presente após trocar o período

## 3. Tela de Eventos

- [x] 3.1 Em `EventsSection.tsx`, adicionar o `DateRangeFilter` (padrão "Todo o período") junto aos filtros da lista e criar a base `eventsInPeriod`; verificar que, sem `?periodo`, a lista mostra os mesmos eventos de antes
- [x] 3.2 Derivar de `eventsInPeriod` a lista filtrada, os indicadores (Total, Sincronizados, Pendentes, Valor) e os contadores dos chips Pendentes/Sincronizados/Falhas/Todos; verificar na tela com "Hoje" e "Ontem" que os números batem com a lista
- [x] 3.3 Mensagem de lista vazia citando o período ("Nenhum evento em <período>"); verificar escolhendo um intervalo personalizado sem pedidos
- [x] 3.4 Confirmar que "Selecionar todos" e o limite de 50 usam só os pendentes do período, e que trocar o período tira da seleção os eventos que saíram da tela; verificar selecionando em "Todo o período", trocando para "Hoje" e conferindo o contador "N de 50"

## 4. Dashboard

- [x] 4.1 Trocar o controle 7/30/90 do `DashboardPage.tsx` pelo `DateRangeFilter` (padrão "Últimos 30 dias") e remover `PeriodDays`/`PERIODS`; verificar com `npm run build`
- [x] 4.2 Adaptar `metrics.ts` (série diária, filtro por período, comparação via `previousRange`; "Todo o período" começa no evento mais antigo e oculta a variação); verificar na tela que "Mês passado" mostra 01–30/09 no gráfico e que a variação some em "Todo o período"

## 5. Verificação final

- [ ] 5.1 Rodar `npm run lint` e `npm run build` sem novos avisos; abrir Eventos e Dashboard, recarregar com cada atalho e com um intervalo personalizado na URL, e testar um `?periodo=` inválido (deve cair no padrão sem erro)
