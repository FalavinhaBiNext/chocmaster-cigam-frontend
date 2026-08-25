import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { useApp } from "../contexts/AppContext";
import { Terminal, X, AlertCircle } from "lucide-react";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "chocmaster:sidebar-collapsed";

export function AppLayout() {
  const { syncing, syncLogs, showLogs, setShowLogs, syncProgress, pendingNfeCount, error, setError } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="relative isolate flex min-h-screen min-h-dvh flex-col overflow-x-hidden bg-slate-100 font-sans text-slate-900">
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-30 bg-[#f3f6fb]" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background: `
            radial-gradient(circle at 8% 5%, rgba(0, 176, 241, 0.12) 0%, transparent 30%),
            radial-gradient(circle at 92% 10%, rgba(255, 131, 1, 0.08) 0%, transparent 28%),
            radial-gradient(circle at 50% 100%, rgba(0, 176, 241, 0.05) 0%, transparent 40%),
            linear-gradient(145deg, #f8fafc 0%, #eef3f8 50%, #f8fafc 100%)
          `,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            linear-gradient(to bottom, rgba(255,255,255,0.70) 0%, transparent 22%, transparent 78%, rgba(226,232,240,0.35) 100%)
          `,
        }}
      />

      <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((v) => !v)} />

      {/* Main content */}
      <main
        className={`ml-0 flex flex-1 flex-col gap-6 px-4 py-6 pt-16 transition-[margin] duration-300 sm:px-6 sm:py-8 lg:px-8 lg:pt-8 ${
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        }`}
      >
        {/* Error alert */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/95 p-4 text-red-800 shadow-[0_14px_32px_-22px_rgba(127,29,29,0.60),inset_0_1px_1px_rgba(255,255,255,0.80)] backdrop-blur-xl"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Não foi possível concluir a operação</p>
              <p className="mt-0.5 text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Outlet />
      </main>

      {/* Sync logs panel */}
      {showLogs && (
        <aside
          aria-label="Logs da sincronização"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/70 bg-white/[0.96] shadow-[0_-24px_60px_-30px_rgba(2,6,23,0.75)] backdrop-blur-xl"
        >
          <div
            className={`mx-auto w-full max-w-[1440px] px-4 py-4 transition-[padding] duration-300 sm:px-6 lg:pr-8 ${
              sidebarCollapsed ? "lg:pl-[92px]" : "lg:pl-[276px]"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#00B0F1]/20 bg-[#00B0F1]/10 text-[#008FC7]">
                  <Terminal className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Sincronização Bling</span>
                    {syncing && (
                      <span className="rounded-full border border-[#00B0F1]/20 bg-[#00B0F1]/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#008FC7]">
                        Em andamento
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">Acompanhe o progresso e as mensagens da integração</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogs(false)}
                aria-label="Fechar painel de logs"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {syncProgress.total > 0 && (
              <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
                <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                  <span className="font-medium text-slate-600">
                    {syncProgress.completed} de {syncProgress.total} produtos
                  </span>
                  <span className="font-bold text-[#008FC7]">{syncProgress.percent}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00B0F1] to-[#008FC7] shadow-[0_0_10px_rgba(0,176,241,0.45)] transition-all duration-300"
                    style={{ width: `${syncProgress.percent}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 text-[0.68rem] text-slate-500">
                  <span>Decorrido: {syncProgress.tempoDecorrido || "0s"}</span>
                  <span>Estimado: {syncProgress.tempoEstimado || "Calculando..."}</span>
                  {syncProgress.erros > 0 && (
                    <span className="font-semibold text-red-500">Erros: {syncProgress.erros}</span>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs shadow-[inset_0_2px_8px_rgba(0,0,0,0.40)]">
              {syncLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    log.startsWith("[ERRO]")
                      ? "text-red-400"
                      : log.startsWith("Progresso:")
                        ? "text-cyan-400"
                        : "text-slate-300"
                  }`}
                >
                  <span className="shrink-0 select-none text-slate-600">{String(index + 1).padStart(3, "0")}</span>
                  <span className="break-all leading-5">{log}</span>
                </div>
              ))}
              {syncing && (
                <div className="flex items-center gap-3 text-cyan-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  <span>Aguardando próximo log...</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* NF-e pending toast */}
      {pendingNfeCount > 0 && (
        <div className="fixed bottom-4 right-4 z-[9998] flex items-center gap-3 rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3.5 shadow-[0_14px_35px_-15px_rgba(220,38,38,0.50)] backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-100">
            <AlertCircle className="h-5 w-5 animate-pulse text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-red-900">
              {pendingNfeCount} {pendingNfeCount === 1 ? "NF-e aguardando envio" : "NF-e aguardando envio"}
            </p>
            <p className="text-xs text-red-700">Clique para enviar ao marketplace</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`ml-0 mt-auto border-t border-white/10 bg-white/30 px-4 py-6 text-center backdrop-blur-sm transition-[margin] duration-300 ${
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        }`}
      >
        <p className="text-xs text-slate-400">© 2026 Chocmaster. Todos os direitos reservados.</p>
        <p className="mt-1 text-[0.65rem] text-slate-500">
          Integração Bling <span className="font-mono font-semibold text-[#00B0F1]">{"< >"}</span> ERP CIGAM
        </p>
      </footer>
    </div>
  );
}
