import { useState } from "react";
import { RefreshCw, Save, X, Store, CheckCircle2, XCircle } from "lucide-react";

interface CanalVenda {
  id: string;
  id_bling: string;
  descricao: string;
  tipo: string | null;
  situacao: string | null;
  ativo: boolean;
  codigo_conta: string | null;
}

interface CanaisVendaSectionProps {
  data: CanalVenda[];
  API_BASE_URL: string;
  authHeaders: () => Record<string, string>;
  onRefresh: () => Promise<void>;
}

export function CanaisVendaSection({
  data,
  API_BASE_URL,
  authHeaders,
  onRefresh,
}: CanaisVendaSectionProps) {
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/canais-venda/sincronizar`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Erro ao sincronizar canais de venda");
      }
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEdit = (canal: CanalVenda) => {
    setEditingId(canal.id);
    setEditingValue(canal.codigo_conta || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleSaveCodigoConta = async (id: string) => {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/canais-venda/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ codigo_conta: editingValue.trim() || null }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Erro ao salvar código da conta");
      }
      setEditingId(null);
      setEditingValue("");
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Canais de Venda</h2>
          <p className="text-sm text-slate-500">
            Lojas cadastradas na Bling. Sincronize e configure o código da conta para cada canal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00B0F1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008FC7] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar com Bling"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">ID Bling</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Código da Conta</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Store className="h-8 w-8 text-slate-300" />
                    <span>Nenhum canal de venda encontrado. Clique em "Sincronizar com Bling" para buscar.</span>
                  </div>
                </td>
              </tr>
            )}
            {data.map((canal) => (
              <tr key={canal.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {canal.id_bling}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {canal.descricao}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {canal.tipo || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {canal.situacao || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      canal.ativo
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {canal.ativo ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {canal.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editingId === canal.id ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      placeholder="Digite o código da conta"
                      autoFocus
                      className="w-full rounded-lg border border-[#00B0F1] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B0F1]/20"
                    />
                  ) : (
                    <span
                      className={`text-sm ${
                        canal.codigo_conta
                          ? "font-medium text-slate-900"
                          : "italic text-slate-400"
                      }`}
                    >
                      {canal.codigo_conta || "Não configurado"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === canal.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveCodigoConta(canal.id)}
                        disabled={savingId === canal.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        {savingId === canal.id ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(canal)}
                      className="text-xs font-semibold text-[#00B0F1] hover:text-[#008FC7]"
                    >
                      {canal.codigo_conta ? "Editar" : "Configurar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
