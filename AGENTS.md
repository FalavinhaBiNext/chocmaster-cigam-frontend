# Chocmaster Frontend

## What This Is

React + TypeScript SPA for managing De-Para (from-to) mappings between Bling (Brazilian e-commerce) and CIGAM (ERP). Maps clients, products, payment methods, and carriers between systems. Also displays integration events/orders.

## Tech Stack

- React 19 + TypeScript 6
- Vite 8 (build tool, not webpack)
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- Oxlint (NOT ESLint)
- lucide-react (icons)

## Commands

```bash
npm run dev      # Start dev server (Vite HMR)
npm run build    # Type-check + build: tsc -b && vite build
npm run lint     # Lint with oxlint (no ESLint)
npm run preview  # Preview production build
```

**No test suite exists.** No test scripts, no test files, no test framework installed.

## Build Order

`build` runs `tsc -b && vite build` — TypeScript check first, then Vite bundles. If `tsc` fails, build fails.

## Project Structure

```
src/
  main.tsx           # Entry point
  App.tsx            # Main component, all API calls, state
  App.css            # Unused (template leftovers)
  index.css          # Tailwind import + global styles
  components/
    DeParaSection.tsx    # Main mapping UI (Bling ↔ CIGAM)
    EventsSection.tsx    # Integration events/orders view
  utils/
    similarity.ts    # Levenshtein-based string matching for smart suggestions
```

## API Dependency

**Backend must be running on `https://api-chocmaster.falavinhanext.tec.br`** — the frontend has no env config, the URL is hardcoded in `App.tsx:17` and `EventsSection.tsx:60`. If you see "Falha ao se conectar com o servidor backend Chocmaster na porta 3333", the backend is down.

## Key Conventions

- **Oxlint rules** in `.oxlintrc.json` — react/rules-of-hooks (error), react/only-export-components (warn)
- **TypeScript strict** — `noUnusedLocals`, `noUnusedParameters` enforced
- **Tailwind 4** — imported via `@import "tailwindcss"` in `index.css`, NOT via config file
- **No env files** — API URL hardcoded, no `.env` needed
- **OpenSpec** — uses spec-driven workflow (`openspec/config.yaml`), skills in `.claude/skills/` and `.opencode/skills/`

## Gotchas

- `App.css` contains template boilerplate (hero animations, #center, #next-steps) — not used by the app
- Smart match suggestions in `DeParaSection.tsx:143` are capped at 50 items (O(N*M) complexity)
- The similarity threshold for suggestions is 45% (`DeParaSection.tsx:158`)
- Product sync uses a queue endpoint (`sincronizar-fila`) with SSE streaming, other entities use regular streaming
- All UI text is in Portuguese (Brazilian)
