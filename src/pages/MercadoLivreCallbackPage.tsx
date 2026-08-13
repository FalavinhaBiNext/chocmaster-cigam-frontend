import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

export function MercadoLivreCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando autenticação...");
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Erro na autenticação: ${searchParams.get("error_description") || error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Código de autorização não encontrado na URL.");
      return;
    }

    const processAuth = async () => {
      try {
        // Aqui você precisa passar o app_id, client_secret e redirect_uri
        // que estão configurados no seu sistema
        const params = new URLSearchParams(window.location.search);
        const appId = params.get("app_id") || "";
        const clientSecret = params.get("client_secret") || "";
        const redirectUri = params.get("redirect_uri") || `${window.location.origin}/mercado-livre/callback`;

        const response = await fetch(
          `${API_BASE_URL}/mercado-livre/callback?code=${code}&state=${state || ""}&app_id=${appId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}`,
          { method: "GET" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao autenticar com Mercado Livre.");
        }

        setStatus("success");
        setMessage("Conta Mercado Livre conectada com sucesso!");
        setUserData(data.data);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Erro ao processar autenticação.");
      }
    };

    processAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-[#FFE600]" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Conectando com Mercado Livre...
            </h2>
            <p className="mt-2 text-sm text-slate-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Conectado com sucesso!
            </h2>
            <p className="mt-2 text-sm text-slate-400">{message}</p>
            {userData && (
              <div className="mt-4 rounded-xl bg-slate-800 p-4 text-left">
                <p className="text-xs text-slate-500">Usuário</p>
                <p className="text-sm font-semibold text-white">
                  {userData.nickname || `ID: ${userData.user_id}`}
                </p>
                {userData.scope && (
                  <p className="mt-2 text-xs text-slate-500">
                    Permissões: {userData.scope}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => window.close()}
              className="mt-6 rounded-xl bg-[#FFE600] px-6 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition"
            >
              Fechar
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Erro na conexão
            </h2>
            <p className="mt-2 text-sm text-red-400">{message}</p>
            <button
              type="button"
              onClick={() => window.close()}
              className="mt-6 rounded-xl bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
