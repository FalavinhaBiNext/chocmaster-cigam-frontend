## 1. Preferência e alternador

- [x] 1.1 Adicionar em `EventsSection.tsx` o estado `visualizacao` ("cards" | "lista") lido/salvo em `localStorage` (`chocmaster:eventos-visualizacao`) com try/catch e padrão "cards"; verificar com `npm run build` e, na tela, que a escolha volta após trocar de página
- [x] 1.2 Adicionar o alternador Cards/Lista (ícones `LayoutGrid`/`List`, `aria-pressed`) no cabeçalho do "Histórico de eventos"; verificar com `npm run lint` que não há avisos novos

## 2. Linha compacta

- [x] 2.1 Criar `src/components/events/EventListRow.tsx` (contêiner `role="button"` com Enter/Espaço, checkbox opcional, #pedido + selo do canal, valor, status com ícone+texto e erro no `title`, hora de recebimento, botões de ícone "Tentar novamente" e "Excluir" com `aria-label` e `stopPropagation`); verificar com `npm run lint` e `npm run build`
- [x] 2.2 No `filteredEvents.map`, renderizar `EventListRow` quando `visualizacao === "lista"`, ligando aos handlers e estados existentes (`handleSelectEvent`, `togglePendingSelection`, `handleRetryCigam`, `handleDeleteEvent`, `retryingEventId`, `deletingEventId`, `selectedPendingIds`); verificar na tela que clicar na linha abre o detalhe e destaca a linha

- [x] 2.3 Trocar o contêiner do modo Lista pela AnimatedList (React Bits) conforme `Chocmaster-Backend/prompts/AnimatedList.md`: copiar para `src/components/ui/AnimatedList.tsx` sem `'use client'` e sem `@hugeicons`, renderizar `EventListRow` via `renderItem`, abrir o detalhe por `onItemSelect` e marcar o evento aberto; verificar com `npm run lint`, `npm run build` e presença das classes `--al-*` no CSS gerado

## 3. Verificação

- [ ] 3.1 Na tela, nos dois modos: período, busca e filtros Pendentes/Sincronizados/Falhas/Todos mostram os mesmos eventos; "Selecionar todos" respeita o limite de 50; "Tentar novamente" e "Excluir" funcionam pela linha sem abrir o detalhe; status de falha mostra o erro ao passar o mouse; `npm run lint` e `npm run build` sem avisos novos
