## Why

O usuário precisa auditar e filtrar produtos rapidamente no frontend durante a conciliação De-Para. A inclusão de tags de filtragem dinâmica para NCM, preço, estoque e formato de material permite identificar instantaneamente quais produtos precisam de correções ou mapeamentos específicos antes da exportação para o ERP CIGAM.

## What Changes

- Adição de um painel de Tags de filtragem dinâmica na lista de produtos Bling da seção de De-Para.
- Cálculo de contagem em tempo real para cada Tag (ex. "Sem NCM (15)", "Formato: Simples (100)") com base na busca textual atual.
- Lógica de exclusividade mútua para filtros conflitantes (ex: marcar "Possui NCM" desmarca "Sem NCM"; marcar um formato de produto como "Simples" desmarca "Estrutura" e "Variações").
- Atualização da lista de produtos renderizada na tela com base nas tags ativas.

## Capabilities

### New Capabilities
- `product-tag-filtering`: Filtragem interativa de produtos da Bling no painel De-Para com base em estados do cadastro (NCM, Preço, Estoque) e campo de Formato.

### Modified Capabilities
<!-- Nenhuma especificação anterior está sendo modificada -->

## Impact

- Afeta o componente frontend `DeParaSection.tsx` na lógica de filtragem de itens e na área visual do painel Bling.
- Nenhum impacto em APIs externas ou banco de dados.
