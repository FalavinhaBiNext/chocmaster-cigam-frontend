## 1. Setup e Lógica Interna no React

- [x] 1.1 Adicionar o estado de `activeTags` no componente `DeParaSection.tsx`
- [x] 1.2 Implementar a função utilitária `toggleTag` no componente `DeParaSection.tsx` com regras de exclusividade mútua de filtros
- [x] 1.3 Criar a computação de contagens dinâmicas `tagCounts` por `useMemo` com base na busca textual e tab ativa
- [x] 1.4 Atualizar a constante `filteredBlingData` em `DeParaSection.tsx` para incorporar a filtragem cumulativa das tags ativas

## 2. Componentes e Interface (UI)

- [x] 2.1 Renderizar a barra de tags sob a caixa de pesquisa do Bling somente quando `entity === 'produtos'`
- [x] 2.2 Estilizar os botões das tags com classes do Tailwind CSS 4, exibindo estados ativado/desativado e o badge com o contador dinâmico
- [x] 2.3 Resetar o estado `activeTags` ao trocar de tab/entidade usando o `useEffect` correspondente em `DeParaSection.tsx`
