## Purpose

Permite alternar a lista "Histórico de eventos" entre cards detalhados e uma lista compacta, para conferir muitos pedidos de uma vez sem perder as ações e o painel de detalhes.

## ADDED Requirements

### Requirement: Alternador de visualização
A tela de Eventos MUST exibir, no cabeçalho do "Histórico de eventos", um alternador com as opções "Cards" e "Lista", indicando qual está ativa. O padrão MUST ser "Cards".

#### Scenario: Primeiro acesso
- **WHEN** o usuário abre a tela de Eventos pela primeira vez
- **THEN** os eventos MUST ser exibidos em cards, como antes desta mudança, e o alternador MUST indicar "Cards" como ativo

#### Scenario: Trocar para lista
- **WHEN** o usuário clica em "Lista"
- **THEN** os eventos MUST passar a ser exibidos em linhas compactas, sem recarregar a página e sem perder busca, filtros, período, evento selecionado ou seleção para exclusão

### Requirement: Conteúdo da linha compacta
No modo Lista, cada evento MUST ocupar uma linha com: número do pedido, canal de venda (quando conhecido), valor do pedido, status de sincronização com o CIGAM (ícone + texto: "Sincronizado", "Pendente" ou "Falha") e data/hora de recebimento.

#### Scenario: Evento com falha
- **WHEN** um evento com status de falha é exibido em lista
- **THEN** a linha MUST mostrar o status "Falha" com ícone e o número de tentativas quando houver, e a mensagem de erro MUST estar acessível ao passar o mouse ou focar o status

#### Scenario: Status nunca só por cor
- **WHEN** qualquer evento é exibido em lista
- **THEN** o status MUST ser identificável por texto e ícone, não apenas pela cor

### Requirement: Ações disponíveis na lista
No modo Lista, cada linha MUST oferecer as mesmas ações do card: selecionar para exclusão em lote (na aba Pendentes, para eventos pendentes), "Tentar novamente" (eventos não sincronizados) e "Excluir". As ações MUST ter rótulo acessível e MUST NOT abrir o detalhe do evento ao serem acionadas.

#### Scenario: Tentar novamente pela lista
- **WHEN** o usuário aciona "Tentar novamente" numa linha de evento pendente
- **THEN** o sistema MUST reenviar o pedido ao CIGAM como faz pelo card, mostrando o progresso na própria linha

#### Scenario: Seleção para exclusão pela lista
- **WHEN** o usuário marca linhas na aba Pendentes
- **THEN** a seleção MUST seguir as mesmas regras do modo Cards (limite de 50, contador "N de 50", "Selecionar todos" e "Excluir selecionados")

### Requirement: Abrir o detalhe pela lista
Clicar numa linha MUST abrir o detalhe do evento no painel à direita, igual ao clique no card, e a linha do evento aberto MUST ficar destacada.

#### Scenario: Clique na linha
- **WHEN** o usuário clica numa linha (fora das ações)
- **THEN** o painel de detalhes MUST mostrar aquele pedido e a linha MUST ficar destacada como selecionada

### Requirement: Preferência mantida
A visualização escolhida MUST ser lembrada no navegador do usuário e restaurada ao voltar para a tela. Se a preferência não puder ser lida ou salva, a tela MUST usar "Cards" sem erro.

#### Scenario: Voltar para a tela
- **WHEN** o usuário escolhe "Lista", navega para outra tela e volta para Eventos
- **THEN** os eventos MUST ser exibidos em lista

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador bloqueia o armazenamento local
- **THEN** a tela MUST abrir em "Cards" e o alternador MUST continuar funcionando durante a sessão
