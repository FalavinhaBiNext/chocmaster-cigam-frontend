import { useState } from "react";
import { Users, ShoppingBag, CreditCard, Truck, Store } from "lucide-react";
import { DeParaSection } from "../components/DeParaSection";
import { CanaisVendaSection } from "../components/CanaisVendaSection";
import { useApp } from "../contexts/AppContext";
import type { EntityType } from "../contexts/AppContext";

type DeParaTab = EntityType | "lojas";

const tabs: { key: DeParaTab; label: string; icon: typeof Users }[] = [
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "produtos", label: "Produtos", icon: ShoppingBag },
  { key: "formas_pagamento", label: "Formas de pagamento", icon: CreditCard },
  { key: "transportadoras", label: "Transportadoras", icon: Truck },
  { key: "lojas", label: "Lojas", icon: Store },
];

export function DeParaPage() {
  const [activeTab, setActiveTab] = useState<DeParaTab>("clientes");
  const {
    blingClientes, cigamClientes, mappings,
    blingProdutos, cigamProdutos,
    blingFormasPagamento, cigamFormasPagamento,
    blingTransportadoras, cigamTransportadoras,
    canaisVenda,
    loading, syncing, syncLogs,
    handleSaveMapping, handleDeleteMapping, handleSyncEntity, fetchData,
    authHeaders,
  } = useApp();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">De Para</h2>

      {/* Sub-tabs */}
      <nav
        aria-label="Entidades do De Para"
        className="mb-4 overflow-visible rounded-2xl border border-white/70 bg-white/[0.94] p-2 shadow-[0_18px_45px_-28px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-xl"
      >
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-[#00B0F1]/10 text-[#008FC7] shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]"
                    : "cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="relative min-h-96 overflow-hidden rounded-[28px] border border-white/70 bg-white/[0.94] p-3 shadow-[0_25px_65px_-35px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[5px] rounded-[22px] border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]" />
        <div className="relative z-10">
          {activeTab === "clientes" && (
            <DeParaSection
              entity="clientes"
              title="Clientes"
              blingData={blingClientes}
              cigamData={cigamClientes}
              mappings={mappings.clientes}
              onSaveMapping={(idBling, idCigam, name) => handleSaveMapping("clientes", idBling, idCigam, name)}
              onDeleteMapping={(idBling) => handleDeleteMapping("clientes", idBling)}
              loading={loading}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}
          {activeTab === "produtos" && (
            <DeParaSection
              entity="produtos"
              title="Produtos"
              blingData={blingProdutos}
              cigamData={cigamProdutos}
              mappings={mappings.produtos}
              onSaveMapping={(idBling, idCigam, name) => handleSaveMapping("produtos", idBling, idCigam, name)}
              onDeleteMapping={(idBling) => handleDeleteMapping("produtos", idBling)}
              loading={loading}
              onSync={() => handleSyncEntity("produtos")}
              syncing={syncing}
              logs={syncLogs}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}
          {activeTab === "formas_pagamento" && (
            <DeParaSection
              entity="formas_pagamento"
              title="Formas de Pagamento"
              blingData={blingFormasPagamento}
              cigamData={cigamFormasPagamento}
              mappings={mappings.formas_pagamento}
              onSaveMapping={(idBling, idCigam, name) => handleSaveMapping("formas_pagamento", idBling, idCigam, name)}
              onDeleteMapping={(idBling) => handleDeleteMapping("formas_pagamento", idBling)}
              loading={loading}
              onSync={() => handleSyncEntity("formas_pagamento")}
              syncing={syncing}
              logs={syncLogs}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}
          {activeTab === "transportadoras" && (
            <DeParaSection
              entity="transportadoras"
              title="Transportadoras"
              blingData={blingTransportadoras}
              cigamData={cigamTransportadoras}
              mappings={mappings.transportadoras}
              onSaveMapping={(idBling, idCigam, name) => handleSaveMapping("transportadoras", idBling, idCigam, name)}
              onDeleteMapping={(idBling) => handleDeleteMapping("transportadoras", idBling)}
              loading={loading}
              onSync={() => handleSyncEntity("transportadoras")}
              syncing={syncing}
              logs={syncLogs}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}
          {activeTab === "lojas" && (
            <CanaisVendaSection
              data={canaisVenda}
              API_BASE_URL="https://api-chocmaster.falavinhanext.tec.br/api/v1"
              authHeaders={authHeaders}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}
        </div>
      </section>
    </div>
  );
}
