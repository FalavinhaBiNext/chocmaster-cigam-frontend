## Purpose

Seletor de período reutilizável que permite ao usuário recortar os dados de uma tela por data, com atalhos comuns (hoje, ontem, semana, mês) e um intervalo personalizado, com o mesmo comportamento em todas as telas que o usam.

## ADDED Requirements

### Requirement: Atalhos de período
O seletor MUST oferecer os atalhos "Hoje", "Ontem", "Últimos 7 dias", "Esta semana", "Últimos 30 dias", "Este mês", "Mês passado", "Últimos 90 dias", "Todo o período" e "Personalizado". Os intervalos MUST ser calculados no fuso horário local do navegador, com dias completos (da 00:00 do primeiro dia às 23:59 do último).

#### Scenario: Hoje e Ontem
- **WHEN** o usuário seleciona "Hoje" em 14/10/2026
- **THEN** o período aplicado MUST ser de 14/10/2026 a 14/10/2026
- **AND WHEN** o usuário seleciona "Ontem"
- **THEN** o período aplicado MUST ser de 13/10/2026 a 13/10/2026

#### Scenario: Últimos N dias incluem hoje
- **WHEN** o usuário seleciona "Últimos 7 dias" em 14/10/2026
- **THEN** o período aplicado MUST ser de 08/10/2026 a 14/10/2026 (7 dias, contando hoje)

#### Scenario: Esta semana começa na segunda-feira
- **WHEN** o usuário seleciona "Esta semana" na quarta-feira 14/10/2026
- **THEN** o período aplicado MUST ser de segunda-feira 12/10/2026 a 14/10/2026

#### Scenario: Este mês e Mês passado
- **WHEN** o usuário seleciona "Este mês" em 14/10/2026
- **THEN** o período aplicado MUST ser de 01/10/2026 a 14/10/2026
- **AND WHEN** o usuário seleciona "Mês passado"
- **THEN** o período aplicado MUST ser de 01/09/2026 a 30/09/2026

#### Scenario: Todo o período
- **WHEN** o usuário seleciona "Todo o período"
- **THEN** nenhum recorte de data MUST ser aplicado

### Requirement: Intervalo personalizado
Ao escolher "Personalizado", o seletor MUST permitir informar data inicial e data final, e MUST aplicar o intervalo só quando ele for válido.

#### Scenario: Intervalo válido
- **WHEN** o usuário informa 01/10/2026 como início e 10/10/2026 como fim e confirma
- **THEN** o período aplicado MUST ser de 01/10/2026 a 10/10/2026, com os dois dias incluídos

#### Scenario: Data final anterior à inicial
- **WHEN** o usuário informa uma data final anterior à inicial
- **THEN** o seletor MUST impedir a confirmação e MUST exibir a mensagem "A data final deve ser igual ou posterior à data inicial"

#### Scenario: Datas futuras
- **WHEN** o usuário abre o intervalo personalizado
- **THEN** o seletor MUST impedir a escolha de datas posteriores a hoje

### Requirement: Rótulo do período selecionado
O seletor MUST mostrar, sempre visível, qual período está aplicado.

#### Scenario: Atalho selecionado
- **WHEN** o período "Este mês" está aplicado
- **THEN** o seletor MUST exibir "Este mês" e as datas correspondentes (ex.: "01/10 – 14/10")

#### Scenario: Personalizado selecionado
- **WHEN** um intervalo personalizado de 01/10/2026 a 10/10/2026 está aplicado
- **THEN** o seletor MUST exibir "01/10/2026 – 10/10/2026"

### Requirement: Período preservado na URL
O período aplicado MUST ser refletido no endereço da página, para que recarregar ou compartilhar o link mantenha o mesmo filtro.

#### Scenario: Recarregar a página
- **WHEN** o usuário aplica "Ontem" e recarrega a página
- **THEN** a tela MUST abrir com "Ontem" aplicado

#### Scenario: Valor inválido na URL
- **WHEN** a página é aberta com um período inválido ou desconhecido no endereço
- **THEN** a tela MUST usar o período padrão dela, sem erro

### Requirement: Mesmo seletor no Dashboard
O Dashboard MUST usar este mesmo seletor no lugar das opções "7 / 30 / 90 dias", com "Últimos 30 dias" como padrão.

#### Scenario: Indicadores do Dashboard seguem o período
- **WHEN** o usuário seleciona "Mês passado" no Dashboard
- **THEN** indicadores, gráfico de pedidos por dia, pedidos por canal e funil MUST considerar apenas pedidos recebidos pelo sistema de 01/09/2026 a 30/09/2026

#### Scenario: Mesma data de referência em Eventos e Dashboard
- **WHEN** o mesmo período está aplicado no Dashboard e na tela de Eventos
- **THEN** as duas telas MUST enquadrar cada pedido pela data em que ele foi recebido pelo sistema, e "Pedidos recebidos" no Dashboard MUST ser igual ao total de eventos na tela de Eventos (sem outros filtros)

#### Scenario: Comparação com o período anterior
- **WHEN** um período de N dias está aplicado no Dashboard
- **THEN** a variação dos indicadores MUST comparar com os N dias imediatamente anteriores
- **AND WHEN** "Todo o período" está aplicado
- **THEN** a variação MUST ficar oculta
