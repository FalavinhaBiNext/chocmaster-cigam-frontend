import { useApp } from "../contexts/AppContext";
import { CheckCircle2, Users, ShoppingBag, CreditCard, Truck, FileText, Activity } from "lucide-react";

export function DashboardPage() {
  const { mappings, blingClientes, blingProdutos, blingFormasPagamento, blingTransportadoras, pendingNfeCount, loading } = useApp();

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
    </div>
  );
}
