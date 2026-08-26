import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../config/api";

export function ShopeeCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando autenticação...");

  useEffect(() => {
    const code = searchParams.get("code");
    const shopId = searchParams.get("shop_id");
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

    if (!shopId) {
      setStatus("error");
      setMessage("Shop ID não encontrado na URL.");
      return;
    }

    const processAuth = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/shopee/callback?code=${code}&shop_id=${shopId}`,
          { method: "GET" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao autenticar com Shopee.");
        }

        setStatus("success");
        setMessage("Conta Shopee conectada com sucesso!");

        // Notify opener window about successful auth
        if (window.opener) {
          window.opener.postMessage({ type: "SHOPEE_AUTH_SUCCESS" }, window.location.origin);
        }
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
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-orange-500" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Conectando com Shopee...
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
            <button
              type="button"
              onClick={() => window.close()}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 transition"
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
