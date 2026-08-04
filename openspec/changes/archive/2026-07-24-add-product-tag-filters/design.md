## Context

O frontend da aplicação Chocmaster é um Single Page Application (React) que renderiza a conciliação De-Para no componente `DeParaSection.tsx`. A lista de produtos é carregada em memória do backend e filtrada localmente na constante `filteredBlingData`.

Para resolver a necessidade de auditar e buscar produtos com falhas cadastrais ou por formato, adicionaremos filtros interativos em formato de Tags na área de pesquisa do Bling.

## Goals / Non-Goals

**Goals:**
- Criar filtros por Tags dinâmicas aplicados aos produtos da Bling na seção De-Para.
- Calcular as contagens dinamicamente com base nos produtos retornados pela busca textual.
- Garantir exclusão lógica de estados contraditórios (ex: "Possui NCM" e "Sem NCM" não podem estar ativos juntos).
- Adicionar suporte à seleção exclusiva de tipos de formato de produto ('S' Simples, 'E' Estrutura e 'V' Variações).

**Non-Goals:**
- Paginar ou filtrar os dados do lado da API do backend. Toda a filtragem continuará em memória no cliente.
- Persistir o estado das tags selecionadas entre sessões ou trocas de entidade (elas devem resetar ao trocar de aba).

## Decisions

- **Filtragem em Memória (Client-Side)**: O backend já retorna toda a lista de produtos com as flags necessárias (`ncm`, `preco`, `quantidade_estoque`, `formato`). Fazer a filtragem e contagem no React evita requisições redundantes de API e garante resposta instantânea (latência zero) ao usuário.
- **Contadores de Tags Dinâmicos (Vinculados à Busca)**: Os números dentro das tags serão atualizados dinamicamente conforme o usuário digita na barra de pesquisa. Isso permite que ele saiba exatamente quantos produtos com a tag atendem à palavra pesquisada.
- **Mutual Exclusivity em Tags Opostas e Formatos**: Impedir a seleção conjunta de opções excludentes. Por exemplo, clicar em "Sem Preço" desativa "Possui Preço". Da mesma forma, selecionar "Formato: Estrutura" desmarca "Formato: Simples" e "Formato: Variações".

## Risks / Trade-offs

- **[Risco]** Queda de performance ao computar contagens e filtros dinamicamente em listas grandes (2000+ produtos).
  - **Mitigação**: O uso de `useMemo` otimiza os cálculos no React. Como a lista tem aproximadamente 2.300 registros, loops lineares O(N) demoram menos de 1ms para rodar nos navegadores atuais, mantendo a interface fluida.
