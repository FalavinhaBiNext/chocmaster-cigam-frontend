import { ConfiguracoesSection } from "../components/ConfiguracoesSection";
import { useApp } from "../contexts/AppContext";
import { API_BASE_URL } from "../config/api";
import { PageHelpButton } from "../components/tour/PageHelpButton";

export function ConfiguracoesPage() {
  const { fetchData } = useApp();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">Configurações</h2>
        <PageHelpButton />
      </div>
      <ConfiguracoesSection
        API_BASE_URL={API_BASE_URL}
        onRefreshGlobal={fetchData}
      />
    </div>
  );
}
