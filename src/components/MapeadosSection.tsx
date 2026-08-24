import { useState, useMemo } from "react";
import { Search, Link2 } from "lucide-react";

interface Mapping {
  id_bling: string;
  id_cigam: string;
  nome: string;
}

interface MapeadosSectionProps {
  title: string;
  mappings: Mapping[];
  loading: boolean;
}

export function MapeadosSection({ title, mappings, loading }: MapeadosSectionProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = useMemo(() => {
    if (!search.trim()) return mappings;
    const q = search.toLowerCase();
    return mappings.filter(
      (m) =>
        m.nome?.toLowerCase().includes(q) ||
        m.id_bling?.toLowerCase().includes(q) ||
        m.id_cigam?.toLowerCase().includes(q),
    );
  }, [mappings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00B0F1] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#00B0F1]/20 bg-[#00B0F1]/10 text-[#008FC7]">
            <Link2 className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
            {mappings.length} mapeados
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#00B0F1] focus:ring-2 focus:ring-[#00B0F1]/20 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Link2 className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">Nenhum mapeamento encontrado</p>
          <p className="mt-1 text-xs">
            {mappings.length === 0
              ? "Crie mapeamentos na seção De Para primeiro."
              : "Tente ajustar o filtro de busca."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Nome</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID Bling</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID CIGAM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((m, i) => (
                  <tr key={`${m.id_bling}-${m.id_cigam}-${i}`} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.nome || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.id_bling}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.id_cigam}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
