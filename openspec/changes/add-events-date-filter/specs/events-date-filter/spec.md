## Purpose

Permite recortar a tela de Eventos por período, para conferir os pedidos recebidos do Bling num dia, semana ou intervalo específico sem percorrer todo o histórico.

## ADDED Requirements

### Requirement: Filtro de período na tela de Eventos
A tela de Eventos MUST exibir o seletor de período junto aos demais filtros da lista "Histórico de eventos". O período padrão MUST ser "Todo o período".

#### Scenario: Abertura da tela
- **WHEN** o usuário abre a tela de Eventos sem período no endereço
- **THEN** a lista MUST mostrar todos os eventos, como antes desta mudança

#### Scenario: Atalho do Dashboard preservado
- **WHEN** o usuário abre a tela de Eventos por um atalho do Dashboard (ex.: filtro de falhas)
- **THEN** o filtro de sincronização indicado MUST ser aplicado e o período MUST ser "Todo o período"

### Requirement: Data considerada para o filtro
Cada evento MUST ser enquadrado no período pela data em que foi recebido pelo sistema (data de criação do evento), convertida para o dia no fuso horário local do navegador. A data do pedido no Bling MUST NOT ser usada para o filtro.

#### Scenario: Pedido recebido em dia diferente da data do pedido
- **WHEN** um pedido com data 10/10/2026 no Bling foi recebido pelo sistema em 11/10/2026 e o período aplicado é "11/10/2026 a 11/10/2026"
- **THEN** o evento MUST aparecer na lista
- **AND WHEN** o período aplicado é "10/10/2026 a 10/10/2026"
- **THEN** o evento MUST NOT aparecer na lista

#### Scenario: Recebimento perto da meia-noite
- **WHEN** um evento foi recebido às 23:30 de 11/10/2026 no horário local (02:30 de 12/10/2026 em UTC)
- **THEN** o evento MUST ser considerado do dia 11/10/2026

### Requirement: Escopo do filtro de período
O período MUST ser aplicado antes da busca por pedido e dos filtros de sincronização, e MUST afetar tudo o que a tela calcula a partir da lista.

#### Scenario: Indicadores e contadores
- **WHEN** um período está aplicado
- **THEN** os indicadores (Total de eventos, Sincronizados, Pendentes, Valor movimentado) e os contadores dos filtros Pendentes, Sincronizados, Falhas e Todos MUST considerar apenas os eventos do período

#### Scenario: Combinação com busca e filtro de sincronização
- **WHEN** o período "Esta semana", o filtro "Falhas" e a busca "1234" estão aplicados
- **THEN** a lista MUST mostrar apenas eventos da semana, com falha e cujo número de pedido contenha "1234"

#### Scenario: Período sem eventos
- **WHEN** nenhum evento está no período aplicado
- **THEN** a lista MUST exibir uma mensagem informando que não há eventos no período, com o período indicado

### Requirement: Exclusão em lote respeita o período
A seleção de eventos pendentes para exclusão em lote MUST considerar apenas os eventos visíveis no período aplicado.

#### Scenario: Selecionar todos dentro do período
- **WHEN** o período "Hoje" está aplicado e o usuário clica em "Selecionar todos"
- **THEN** apenas os eventos pendentes de hoje MUST ser selecionados, respeitando o limite de 50 por vez

#### Scenario: Troca de período após selecionar
- **WHEN** o usuário seleciona eventos e depois muda o período
- **THEN** os eventos fora do novo período MUST deixar de contar como selecionados e MUST NOT ser excluídos
