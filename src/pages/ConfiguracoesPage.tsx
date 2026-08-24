import { ConfiguracoesSection } from "../components/ConfiguracoesSection";
import { useApp } from "../contexts/AppContext";

export function ConfiguracoesPage() {
  const { fetchData } = useApp();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Configurações</h2>
      <ConfiguracoesSection
        API_BASE_URL="https://api-chocmaster.falavinhanext.tec.br/api/v1"
        onRefreshGlobal={fetchData}
      />
    </div>
  );
}
