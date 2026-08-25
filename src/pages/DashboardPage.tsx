import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle2, Users, ShoppingBag, CreditCard, Truck, FileText, Activity, PackageCheck, Send, AlertTriangle, Inbox, Clock, AlertCircle } from "lucide-react";
import { IntegrationHealthSection } from "../components/IntegrationHealthSection";

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

interface SyncPipelineSummary {
  recebidos: number;
  sincronizadosCigam: number;
  sincronizacaoPendente: number;
  sincronizacaoComFalha: number;
  nfeFaturada: number;
  nfeEnviadaMarketplace: number;
}

export function DashboardPage() {
  const { mappings, blingClientes, blingProdutos, blingFormasPagamento, blingTransportadoras, pendingNfeCount, loading } = useApp();
  const { token } = useAuth();

  const authHeaders = useMemo<HeadersInit>(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const [syncSummary, setSyncSummary] = useState<SyncPipelineSummary | null>(null);
  const [syncSummaryLoading, setSyncSummaryLoading] = useState(true);
  const [syncSummaryError, setSyncSummaryError] = useState<string | null>(null);

  const fetchSyncSummary = useCallback(async () => {
    setSyncSummaryLoading(true);
    setSyncSummaryError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/sync-pipeline-summary`, { headers: authHeaders });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Falha ao carregar o resumo do funil operacional.");
      }
      setSyncSummary(result.data);
    } catch (err: unknown) {
      setSyncSummaryError(err instanceof Error ? err.message : "Falha ao carregar o resumo do funil operacional.");
    } finally {
      setSyncSummaryLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchSyncSummary();
  }, [fetchSyncSummary]);

  const totalMappings =
    mappings.clientes.length +
    mappings.produtos.length +
    mappings.formas_pagamento.length +
    mappings.transportadoras.length;

  const cardBase = `
    group relative overflow-hidden rounded-2xl
    border border-white/70 bg-white/[0.94] p-5
    shadow-[0_18px_45px_-26px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]
    backdrop-blur-xl transition-all duration-200
    hover:-translate-y-1 hover:shadow-[0_24px_50px_-25px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95)]
  `;

  const iconBox = (color: string) =>
    `flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)] ${color}`;

  const calcPercent = (mapped: number, total: number) =>
    total > 0 ? Math.min((mapped / total) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00B0F1] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold text-slate-900">Dashboard</h2>

      <section aria-label="Indicadores gerais" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total geral</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{totalMappings}</p>
            </div>
            <div className={iconBox("border-[#00B0F1]/15 bg-[#00B0F1]/10 text-[#008FC7]")}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Mapeamentos concluídos</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#00B0F1] to-[#008FC7]" />
          </div>
        </article>

        {/* Clientes */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Clientes</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{mappings.clientes.length}</p>
            </div>
            <div className={iconBox("border-blue-200 bg-blue-50 text-blue-600")}>
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Mapeados de {blingClientes.length} no Bling</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${calcPercent(mappings.clientes.length, blingClientes.length)}%` }}
            />
          </div>
        </article>

        {/* Produtos */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Produtos</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{mappings.produtos.length}</p>
            </div>
            <div className={iconBox("border-purple-200 bg-purple-50 text-purple-600")}>
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Mapeados de {blingProdutos.length} no Bling</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${calcPercent(mappings.produtos.length, blingProdutos.length)}%` }}
            />
          </div>
        </article>

        {/* Transportadoras */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Transportadoras</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{mappings.transportadoras.length}</p>
            </div>
            <div className={iconBox("border-emerald-200 bg-emerald-50 text-emerald-600")}>
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Mapeados de {blingTransportadoras.length} no Bling</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${calcPercent(mappings.transportadoras.length, blingTransportadoras.length)}%` }}
            />
          </div>
        </article>
      </section>

      {/* Second row: extra insights */}
      <section aria-label="Insights" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Formas de Pagamento */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Formas de Pagamento</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{mappings.formas_pagamento.length}</p>
            </div>
            <div className={iconBox("border-amber-200 bg-amber-50 text-amber-600")}>
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Mapeados de {blingFormasPagamento.length} no Bling</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${calcPercent(mappings.formas_pagamento.length, blingFormasPagamento.length)}%` }}
            />
          </div>
        </article>

        {/* NF-e Pendentes */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">NF-e Pendentes</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{pendingNfeCount}</p>
            </div>
            <div className={iconBox("border-red-200 bg-red-50 text-red-600")}>
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Aguardando envio ao marketplace</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pendingNfeCount > 0 ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: pendingNfeCount > 0 ? "100%" : "0%" }}
            />
          </div>
        </article>

        {/* Taxa de mapeamento geral */}
        <article className={cardBase}>
          <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Taxa de Mapeamento</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {(() => {
                  const totalBling = blingClientes.length + blingProdutos.length + blingFormasPagamento.length + blingTransportadoras.length;
                  return totalBling > 0 ? `${Math.round((totalMappings / totalBling) * 100)}%` : "—";
                })()}
              </p>
            </div>
            <div className={iconBox("border-[#00B0F1]/15 bg-[#00B0F1]/10 text-[#008FC7]")}>
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Itens Bling mapeados vs total</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00B0F1] to-[#008FC7] transition-all duration-500"
              style={{
                width: (() => {
                  const totalBling = blingClientes.length + blingProdutos.length + blingFormasPagamento.length + blingTransportadoras.length;
                  return totalBling > 0 ? `${Math.min((totalMappings / totalBling) * 100, 100)}%` : "0%";
                })(),
              }}
            />
          </div>
        </article>
      </section>

      {/* Saúde das integrações */}
      <IntegrationHealthSection />

      {/* Funil operacional */}
      <section aria-label="Funil operacional" className="mt-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Funil operacional</h3>

        {syncSummaryError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/95 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm">{syncSummaryError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Pedidos recebidos", value: syncSummary?.recebidos, icon: Inbox, color: "border-slate-200 bg-slate-50 text-slate-600" },
              { label: "Sincronizados no CIGAM", value: syncSummary?.sincronizadosCigam, icon: CheckCircle2, color: "border-emerald-200 bg-emerald-50 text-emerald-600" },
              { label: "Sincronização pendente", value: syncSummary?.sincronizacaoPendente, icon: Clock, color: "border-amber-200 bg-amber-50 text-amber-600" },
              { label: "Falhas de sincronização", value: syncSummary?.sincronizacaoComFalha, icon: AlertTriangle, color: "border-red-200 bg-red-50 text-red-600" },
              { label: "NF-e faturada", value: syncSummary?.nfeFaturada, icon: PackageCheck, color: "border-blue-200 bg-blue-50 text-blue-600" },
              { label: "NF-e enviada ao marketplace", value: syncSummary?.nfeEnviadaMarketplace, icon: Send, color: "border-[#00B0F1]/20 bg-[#00B0F1]/10 text-[#008FC7]" },
            ].map((stage) => (
              <article key={stage.label} className={cardBase}>
                <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{stage.label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {syncSummaryLoading ? (
                        <span className="inline-block h-8 w-14 animate-pulse rounded bg-slate-100 align-middle" />
                      ) : (
                        stage.value ?? 0
                      )}
                    </p>
                  </div>
                  <div className={iconBox(stage.color)}>
                    <stage.icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
