import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Link2, Trash2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface Mapping {
  id_bling: string;
  id_cigam: string;
  nome: string;
}

interface MapeadosSectionProps {
  title: string;
  mappings: Mapping[];
  loading: boolean;
  onDeleteMapping?: (idBling: string) => Promise<void>;
}

export function MapeadosSection({ title, mappings, loading, onDeleteMapping }: MapeadosSectionProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleDelete = async (idBling: string) => {
    if (!onDeleteMapping) return;
    setDeletingId(idBling);
    try {
      await onDeleteMapping(idBling);
      setToast({ message: "Associação excluída com sucesso.", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Não foi possível excluir a associação.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

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
      {createPortal(
        toast && (
          <div
            className={`
              fixed right-4 bottom-4 z-[9999]
              flex items-center gap-3
              rounded-xl border px-4 py-3
              shadow-lg transition-all duration-300
              ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }
            `}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 shrink-0 rounded-lg p-1 hover:bg-black/5"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ),
        document.body,
      )}

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
                  {onDeleteMapping && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((m, i) => (
                  <tr key={`${m.id_bling}-${m.id_cigam}-${i}`} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.nome || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.id_bling}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.id_cigam}</td>
                    {onDeleteMapping && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id_bling)}
                          disabled={deletingId === m.id_bling}
                          title="Excluir associação"
                          aria-label={`Excluir associação de ${m.nome || m.id_bling}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className={`h-3.5 w-3.5 ${deletingId === m.id_bling ? "animate-spin" : ""}`} />
                        </button>
                      </td>
                    )}
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
