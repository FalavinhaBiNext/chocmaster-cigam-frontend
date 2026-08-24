import { NotasFiscaisCigamSection } from "../components/NotasFiscaisCigamSection";
import { useApp } from "../contexts/AppContext";

export function NfePage() {
  const { authHeaders } = useApp();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">NF-e CIGAM</h2>
      <NotasFiscaisCigamSection
        API_BASE_URL="https://api-chocmaster.falavinhanext.tec.br/api/v1"
        authHeaders={authHeaders}
      />
    </div>
  );
}
