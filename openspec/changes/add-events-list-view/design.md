## Context

`EventsSection.tsx` (~2.000 linhas) renderiza cada evento como um `<button>` grande dentro de `filteredEvents.map(...)`, com ações aninhadas (checkbox via `span role="checkbox"`, "Tentar novamente", "Excluir") que chamam `e.stopPropagation()`. Toda a lógica de filtro, seleção (`selectedPendingIds`, limite 50) e ações (`handleRetryCigam`, `handleDeleteEvent`, `handleSelectEvent`) já está no componente. Não há testes no frontend; validação é `npm run lint` + `npm run build` e conferência na tela.

## Goals / Non-Goals

**Goals:**
- Trocar só a *renderização* de cada item; filtros, seleção, ações e painel de detalhes seguem os mesmos (spec `events-list-view`, "Trocar para lista").

**Non-Goals:**
- Tabela em largura total, colunas configuráveis ou ordenação por coluna.
- Virtualização da lista (o volume atual não exige).
- Refatorar o modo Cards (fica idêntico).

## Decisions

**1. Linha em componente próprio: `src/components/events/EventListRow.tsx`.**
Recebe o evento, os dados do pedido (`pedidosMap[...]`), estados (`isSelected`, `isChecked`, `showCheckbox`, `retrying`, `deleting`) e callbacks (`onOpen`, `onToggleCheck`, `onRetry`, `onDelete`). Evita inflar ainda mais o `EventsSection`; os handlers continuam vindo de lá.
*Alternativa:* um ternário dentro do `map` atual — rejeitada pelo tamanho do arquivo.

**2. Contêiner da lista: AnimatedList (React Bits), linha via `renderItem`.**
Revisado após a primeira entrega, a pedido do usuário (`Chocmaster-Backend/prompts/AnimatedList.md`). O modo Lista usa `src/components/ui/AnimatedList.tsx` (variante TS + Tailwind): animação "pop" ao entrar na área visível, anel de seleção com mola seguindo mouse e setas ↑/↓/Home/End, degradê nas bordas e rolagem própria. Ela controla clique e Enter (→ `handleSelectEvent`); `EventListRow` virou só o conteúdo do item (layout + ações com `stopPropagation`). O evento aberto no painel ganha uma barra azul à esquerda (e texto oculto "aberto nos detalhes" para leitores de tela), distinta do anel, que indica só o item sob o cursor/teclado.
Configuração: `theme="light"`, `frame={false}` (a lista já está dentro do painel), `accentColor="#008FC7"`, `width/maxHeight="100%"` ocupando a altura do painel. Os itens são memorizados (`useMemo`) para não reiniciar as animações a cada render.
Adaptações do código do prompt: sem `'use client'` (Next.js) e sem `@hugeicons/*` — só serviam aos itens de exemplo, removidos; o padrão de `items` passa a ser `[]`.
*Alternativa anterior (substituída):* `div role="button"` próprio por linha.

**3. Layout da linha (~48px, duas linhas curtas de texto):**
```
[☐] #pedido [canal]                 status (ícone+texto)  [↻] [🗑]
    valor · dd/mm hh:mm
```
Ajustado na implementação: no desktop comum (~1280px com o menu lateral) a coluna "Histórico de eventos" tem ~330px úteis, e uma única linha com pedido, canal, valor, status, hora e ações não cabe. Com valor e hora numa segunda linha menor, tudo aparece sem cortar, ainda ~5x mais compacto que o card.
O status reutiliza as cores e ícones dos selos atuais (emerald/amber/red + `CheckCircle2`/`XCircle`/`ShieldAlert`); em falha, `title` com a mensagem de erro e "(Nx)" quando `retry_count > 0`. Unidade de negócio, NF-e, ID Bling e CIGAM ficam só no card e no painel de detalhes.

**4. Data exibida = `created_at`** (recebimento), coerente com o filtro de período da change `add-events-date-filter`; formato "14/10 08:39".

**5. Preferência em `localStorage` (`chocmaster:eventos-visualizacao`), com try/catch.**
É preferência de interface por usuário/navegador — não precisa ir para a URL nem para o backend. Leitura/escrita protegidas; falha → "cards" (spec "Armazenamento indisponível").
*Alternativa:* `?visualizacao=lista` na URL — rejeitada: misturaria preferência pessoal com links compartilhados.

**6. Alternador:** controle segmentado com ícones `LayoutGrid` / `List` + texto acessível (`aria-pressed`), no cabeçalho, ao lado do contador de eventos.

## Risks / Trade-offs

- [A linha esconde unidade/NF-e que alguns usuários olham no card] → continuam no painel de detalhes e no modo Cards; padrão segue Cards.
- [Ações em ícone são menos descobríveis que os botões com texto] → `title` + `aria-label` ("Tentar novamente", "Excluir pedido #N") e foco visível.
- [EventsSection continua grande] → a linha nova fica isolada; refatorar os cards fica fora do escopo.

## Migration Plan

Só frontend; deploy normal. Rollback = reverter o commit. A chave no `localStorage` é ignorada se o código voltar.
