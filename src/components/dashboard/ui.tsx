import type { FC, ReactNode } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { CHART_COLOR, type HealthLevel } from "./metrics";

export const Card: FC<{ children: ReactNode; className?: string }> = ({ children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
    {children}
  </section>
);

export const CardHeader: FC<{ title: string; subtitle?: ReactNode; action?: ReactNode }> = ({ title, subtitle, action }) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const LEVEL_META: Record<HealthLevel, { className: string; icon: FC<{ className?: string }> }> = {
  good: { className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle },
  critical: { className: "border-red-200 bg-red-50 text-red-700", icon: ShieldAlert },
};

/** Status sempre com ícone + texto — nunca só cor. */
export const StatusBadge: FC<{ level: HealthLevel; label: string }> = ({ level, label }) => {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${meta.className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
};

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Variação vs período anterior, em %. */
  delta?: number | null;
  deltaLabel?: string;
}

export const StatTile: FC<StatTileProps> = ({ label, value, hint, delta, deltaLabel }) => {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const up = hasDelta && delta! >= 0;
  return (
    <Card>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {hasDelta && (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? "text-emerald-700" : "text-red-700"}`}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {up ? "+" : ""}
            {delta!.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
          </span>
        )}
        {hasDelta && deltaLabel && <span className="text-slate-500">{deltaLabel}</span>}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </Card>
  );
};

/** Barra de proporção acessível (trilho claro do mesmo tom). */
export const Meter: FC<{ value: number; label: string; color?: string }> = ({ value, label, color = CHART_COLOR }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-sky-100"
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};
