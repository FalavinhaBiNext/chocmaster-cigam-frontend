import { ConfiguracoesSection } from "../components/ConfiguracoesSection";
import { useApp } from "../contexts/AppContext";
import { API_BASE_URL } from "../config/api";

export function ConfiguracoesPage() {
  const { fetchData } = useApp();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Configurações</h2>
      <ConfiguracoesSection
        API_BASE_URL={API_BASE_URL}
        onRefreshGlobal={fetchData}
      />
    </div>
  );
}
