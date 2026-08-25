import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { AlertCircle, CheckCircle2, Clock, Link2Off, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type IntegrationName = "bling" | "mercado_livre" | "shopee" | "tray";
type IntegrationTokenStatus = "ok" | "expiring_soon" | "expired";

interface IntegrationHealth {
  integration: IntegrationName;
  connected: boolean;
  status: IntegrationTokenStatus;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  label: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

const INTEGRATION_NAMES: Record<IntegrationName, string> = {
  bling: "Bling",
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  tray: "Tray",
};

const STATUS_META: Record<
  IntegrationTokenStatus,
  { label: string; className: string; icon: FC<{ className?: string }> }
> = {
  ok: {
    label: "Conectado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  expiring_soon: {
    label: "Expira em breve",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock,
  },
  expired: {
    label: "Expirado",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: ShieldAlert,
  },
};

function formatRelativeExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;

  const diffMs = target - Date.now();
  const diffAbsMs = Math.abs(diffMs);
  const minutes = Math.round(diffAbsMs / (60 * 1000));
  const hours = Math.round(diffAbsMs / (60 * 60 * 1000));
  const days = Math.round(diffAbsMs / (24 * 60 * 60 * 1000));

  let magnitude: string;
  if (minutes < 60) magnitude = `${minutes} min`;
  else if (hours < 48) magnitude = `${hours}h`;
  else magnitude = `${days}d`;

  return diffMs >= 0 ? `em ${magnitude}` : `há ${magnitude}`;
}

export const IntegrationHealthSection: FC = () => {
  const { token } = useAuth();

  const authHeaders = useMemo<HeadersInit>(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/health`, { headers: authHeaders });
      const result: ApiResponse<IntegrationHealth[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Falha ao consultar a saúde das integrações.");
      }

      setIntegrations(result.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao consultar a saúde das integrações.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <section aria-label="Saúde das integrações" className="mt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">Saúde das integrações</h3>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          title="Recarregar status das integrações"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-[#00B0F1]/40 hover:bg-[#00B0F1]/10 hover:text-[#008FC7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/95 p-4 text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(loading ? (["bling", "mercado_livre", "shopee", "tray"] as IntegrationName[]) : integrations.map(i => i.integration)).map((name, index) => {
            const integration = loading ? undefined : integrations[index];
            const status: IntegrationTokenStatus = integration?.status || "expired";
            const meta = STATUS_META[status];
            const StatusIcon = integration && !integration.connected ? Link2Off : meta.icon;
            const relativeAccess = integration ? formatRelativeExpiry(integration.accessTokenExpiresAt) : null;
            const relativeRefresh = integration ? formatRelativeExpiry(integration.refreshTokenExpiresAt) : null;

            return (
              <article
                key={name}
                className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{INTEGRATION_NAMES[name]}</p>
                    {integration?.label && (
                      <p className="truncate text-xs text-slate-400">{integration.label}</p>
                    )}
                  </div>
                  {!loading && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[0.62rem] font-bold ${
                        integration?.connected ? meta.className : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {integration?.connected ? meta.label : "Não conectado"}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-100" />
                ) : integration?.connected ? (
                  <div className="mt-3 space-y-1 text-[0.68rem] text-slate-500">
                    {relativeAccess && <p>Access token expira {relativeAccess}</p>}
                    {relativeRefresh && <p>Refresh token expira {relativeRefresh}</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-[0.68rem] text-slate-400">Nenhuma conta conectada.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
