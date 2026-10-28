import { NotasFiscaisCigamSection } from "../components/NotasFiscaisCigamSection";
import { useApp } from "../contexts/AppContext";
import { API_BASE_URL } from "../config/api";
import { PageHelpButton } from "../components/tour/PageHelpButton";

export function NfePage() {
  const { authHeaders } = useApp();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">NF-e CIGAM</h2>
        <PageHelpButton />
      </div>
      <NotasFiscaisCigamSection
        API_BASE_URL={API_BASE_URL}
        authHeaders={authHeaders}
      />
    </div>
  );
}
