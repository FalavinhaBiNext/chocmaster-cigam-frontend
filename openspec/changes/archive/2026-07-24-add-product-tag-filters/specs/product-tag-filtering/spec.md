## ADDED Requirements

### Requirement: Painel de Filtros por Tag
O sistema MUST apresentar um painel de botões de Tags interativas na aba de produtos do painel De-Para.

#### Scenario: Exibição dos filtros de Tag
- **WHEN** o usuário seleciona a aba de produtos no De-Para
- **THEN** o sistema MUST renderizar as tags de filtro: "Possui NCM", "Sem NCM", "Possui Preço", "Sem Preço", "Com Estoque", "Sem Estoque", "Formato: Simples", "Formato: Estrutura" e "Formato: Variações" abaixo da barra de busca do Bling.

### Requirement: Contagem Dinâmica de Produtos
O sistema MUST computar e exibir em cada tag a quantidade de itens que satisfazem aquela regra específica, relativos ao resultado de busca atual.

#### Scenario: Atualização dinâmica de contagens
- **WHEN** o usuário digita uma busca textual na caixa de pesquisa do Bling ou alterna o filtro "Apenas Não Associados"
- **THEN** o sistema MUST recalcular a contagem em tempo real e atualizar os contadores exibidos ao lado de cada tag.

### Requirement: Exclusividade Mútua de Filtros
O sistema MUST desmarcar filtros logicamente opostos quando o usuário clica para marcar uma nova tag de filtragem.

#### Scenario: Seleção oposta de NCM
- **WHEN** o usuário seleciona "Possui NCM" enquanto "Sem NCM" já está ativa
- **THEN** o sistema MUST desativar "Sem NCM" e ativar "Possui NCM" (e vice-versa).

#### Scenario: Seleção oposta de Formato
- **WHEN** o usuário ativa a tag "Formato: Simples" enquanto a tag "Formato: Estrutura" está selecionada
- **THEN** o sistema MUST desativar "Formato: Estrutura" e ativar apenas "Formato: Simples" (e vice-versa para qualquer combinação de formatos).

### Requirement: Filtragem da Lista de Produtos
O sistema MUST refinar a exibição da tabela de produtos Bling de acordo com as regras de todas as tags ativas cumulativamente.

#### Scenario: Filtragem cumulativa
- **WHEN** o usuário ativa as tags "Possui NCM" e "Formato: Simples"
- **THEN** o sistema MUST exibir na tabela Bling somente produtos que contenham NCM cadastrado e cujo campo formato seja igual a "S".
