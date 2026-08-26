import { NotasFiscaisCigamSection } from "../components/NotasFiscaisCigamSection";
import { useApp } from "../contexts/AppContext";
import { API_BASE_URL } from "../config/api";

export function NfePage() {
  const { authHeaders } = useApp();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">NF-e CIGAM</h2>
      <NotasFiscaisCigamSection
        API_BASE_URL={API_BASE_URL}
        authHeaders={authHeaders}
      />
    </div>
  );
}
