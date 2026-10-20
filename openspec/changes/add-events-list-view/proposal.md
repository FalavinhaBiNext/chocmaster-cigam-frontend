## Why

Na tela de Eventos, cada pedido ocupa um card alto (selos, botões "Tentar novamente"/"Excluir", ID Bling, data e valor), e a coluna "Histórico de eventos" mostra só 3 ou 4 pedidos por vez. Para conferir dezenas de pedidos do dia — achar os pendentes, as falhas ou um valor — o usuário precisa rolar muito. Uma visualização em lista compacta permite ver muito mais pedidos de uma vez, sem perder o card quando o detalhe importa.

## What Changes

- Novo alternador **Cards / Lista** no cabeçalho do "Histórico de eventos", ao lado da busca e do filtro de período.
- **Modo Lista:** cada evento vira uma linha compacta, na mesma coluna e com o mesmo painel de detalhes à direita, mostrando: pedido, canal, valor, status de sincronização (com ícone e texto) e horário de recebimento. As ações (selecionar para exclusão, "Tentar novamente", "Excluir") continuam disponíveis em cada linha, como ícones.
- **Modo Cards:** continua exatamente como hoje e é o padrão.
- Tudo o que já existe vale nos dois modos: filtro de período, busca, filtros Pendentes/Sincronizados/Falhas/Todos, seleção e exclusão em lote (limite de 50), clique para abrir o detalhe.
- A escolha fica salva no navegador do usuário e é mantida ao voltar para a tela.

Sem mudanças de backend.

## Capabilities

### New Capabilities
- `events-list-view`: alternância entre visualização em cards e em lista na tela de Eventos — o que cada linha mostra, ações disponíveis, equivalência de comportamento entre os modos e persistência da preferência.

### Modified Capabilities
<!-- Nenhuma: os specs existentes (date-range-filter, events-date-filter) ainda estão na change add-events-date-filter e não mudam de requisito. -->

## Impact

- **Frontend:** `src/components/EventsSection.tsx` (alternador e renderização em lista); novo componente de linha `src/components/events/EventListRow.tsx`.
- **Backend / dependências:** nenhum.
- **Comportamento existente:** inalterado para quem não trocar o modo (padrão = Cards).
