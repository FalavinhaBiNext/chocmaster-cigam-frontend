import { useState } from "react";
import { Users, ShoppingBag, CreditCard, Truck, Store } from "lucide-react";
import { MapeadosSection } from "../components/MapeadosSection";
import { useApp } from "../contexts/AppContext";

type MapeadosTab = "clientes" | "produtos" | "formas_pagamento" | "transportadoras" | "lojas";

const tabs: { key: MapeadosTab; label: string; icon: typeof Users }[] = [
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "produtos", label: "Produtos", icon: ShoppingBag },
  { key: "formas_pagamento", label: "Formas de pagamento", icon: CreditCard },
  { key: "transportadoras", label: "Transportadoras", icon: Truck },
  { key: "lojas", label: "Lojas", icon: Store },
];

export function MapeadosPage() {
  const [activeTab, setActiveTab] = useState<MapeadosTab>("clientes");
  const { mappings, canaisVenda, loading } = useApp();

  const getMappingsForTab = () => {
    if (activeTab === "lojas") {
      return (canaisVenda || []).map((c: any) => ({
        id_bling: c.id_bling || c.id || "",
        id_cigam: c.id_cigam || "",
        nome: c.nome || c.descricao || "",
      }));
    }
    return mappings[activeTab] || [];
  };

  const getTitleForTab = () => {
    const tab = tabs.find((t) => t.key === activeTab);
    return tab?.label || "";
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Mapeados</h2>

      {/* Sub-tabs */}
      <nav
        aria-label="Entidades mapeadas"
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
          <MapeadosSection
            title={getTitleForTab()}
            mappings={getMappingsForTab()}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}
