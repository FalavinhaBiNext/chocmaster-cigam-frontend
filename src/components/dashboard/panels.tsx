import type { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Unlink } from "lucide-react";
import {
  CHART_COLOR,
  channelLabel,
  deriveIntegrationStatus,
  formatBRL,
  formatBRLCompact,
  formatInt,
  relativeTime,
  type ChannelRow,
  type FunnelStage,
} from "./metrics";
import type { DashboardEvent, DashboardPedido, IntegrationHealth, IntegrationName } from "./types";
import { Card, CardHeader, Meter, StatusBadge } from "./ui";

/* ------------------------------------------------------------------ */
/* Pedidos por canal — barras horizontais, uma cor, valor na ponta      */
/* ------------------------------------------------------------------ */

export const ChannelBreakdown: FC<{ rows: ChannelRow[] }> = ({ rows }) => {
  const total = rows.reduce((acc, r) => acc + r.count, 0);
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <Card className="h-full">
      <CardHeader title="Pedidos por canal" subtitle="Onde as vendas do período aconteceram" />
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nenhum pedido no período</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-700">{row.label}</span>
                <span className="shrink-0 tabular-nums text-slate-900">
                  <span className="font-semibold">{formatInt(row.count)}</span>
                  <span className="ml-1.5 text-xs text-slate-500">{Math.round((row.count / total) * 100)}%</span>
                </span>
              </div>
              <div className="flex items-center gap-2" title={`${row.label}: ${formatInt(row.count)} pedidos · ${formatBRL(row.value)}`}>
                <div className="h-2 flex-1">
                  <div className="h-full rounded-r-sm" style={{ width: `${(row.count / max) * 100}%`, backgroundColor: CHART_COLOR }} />
                </div>
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-500">{formatBRLCompact(row.value)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Funil operacional — etapas em sequência com taxa de passagem         */
/* ------------------------------------------------------------------ */

export const PipelineFunnel: FC<{ stages: FunnelStage[] }> = ({ stages }) => {
  const top = stages[0]?.count ?? 0;

  return (
    <Card className="h-full">
      <CardHeader title="Funil operacional" subtitle="Do pedido recebido até a NF-e no marketplace" />
      {top === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nenhum pedido no período</p>
      ) : (
        <ol className="space-y-3">
          {stages.map((stage, i) => {
            const prev = i > 0 ? stages[i - 1].count : null;
            const conversion = prev ? Math.round((stage.count / prev) * 100) : null;
            return (
              <li key={stage.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-700">
                    <span className="mr-1.5 text-xs tabular-nums text-slate-400">{i + 1}</span>
                    {stage.label}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold text-slate-900">{formatInt(stage.count)}</span>
                    {conversion !== null && (
                      <span className="ml-1.5 text-xs text-slate-500">{conversion}% da etapa anterior</span>
                    )}
                  </span>
                </div>
                <div className="h-2">
                  <div className="h-full rounded-r-sm" style={{ width: `${(stage.count / top) * 100}%`, backgroundColor: CHART_COLOR }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Pedidos ainda não faturados no ERP aparecem como queda entre "Sincronizados" e "NF-e faturada".
      </p>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Atenção — só o que pede ação agora, cada item leva à tela certa      */
/* ------------------------------------------------------------------ */

export interface AttentionItem {
  key: string;
  level: "warning" | "critical";
  icon: FC<{ className?: string }>;
  title: string;
  detail: string;
  to?: string;
}

export const AttentionPanel: FC<{ items: AttentionItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm">
          <span className="font-semibold">Tudo em dia.</span> Nenhuma falha, NF-e pendente ou integração para reconectar.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Itens que precisam de atenção" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-2">
      <p className="px-2 pb-1.5 pt-1 text-xs font-semibold text-amber-900">
        {items.length === 1 ? "1 item precisa de atenção" : `${items.length} itens precisam de atenção`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const tone = item.level === "critical" ? "text-red-600" : "text-amber-600";
          const content: ReactNode = (
            <>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                <span className="block truncate text-xs text-slate-600">{item.detail}</span>
              </span>
              {item.to && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
            </>
          );
          const className = "flex h-full items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]";
          return (
            <li key={item.key}>
              {item.to ? (
                <Link to={item.to} className={`${className} transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B0F1]/40`}>
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Pedidos recentes                                                    */
/* ------------------------------------------------------------------ */

const SYNC_BADGE: Record<DashboardEvent["sync_status"], { level: "good" | "warning" | "critical"; label: string }> = {
  sincronizado: { level: "good", label: "No CIGAM" },
  pendente: { level: "warning", label: "Pendente" },
  falha: { level: "critical", label: "Falha" },
};

export const RecentOrders: FC<{ events: DashboardEvent[]; pedidosById: Map<string, DashboardPedido> }> = ({ events, pedidosById }) => (
  <Card className="h-full">
    <CardHeader
      title="Pedidos recentes"
      subtitle="Últimos recebidos pelo webhook"
      action={
        <Link to="/eventos" className="shrink-0 text-xs font-medium text-[#007BAD] hover:underline">
          Ver todos
        </Link>
      }
    />
    {events.length === 0 ? (
      <p className="py-8 text-center text-sm text-slate-500">Nenhum pedido recebido ainda</p>
    ) : (
      <ul className="-mx-2 divide-y divide-slate-100">
        {events.map((event) => {
          const pedido = pedidosById.get(String(event.pedido_id));
          const badge = SYNC_BADGE[event.sync_status] ?? SYNC_BADGE.pendente;
          return (
            <li key={event.id} className="flex items-center gap-3 px-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-900">
                  <span className="font-semibold">#{event.numero_pedido}</span>
                  <span className="ml-2 text-slate-600">{pedido?.nome_cliente || "Cliente não informado"}</span>
                </p>
                <p className="truncate text-xs text-slate-500">
                  {channelLabel(pedido?.marketplace)} · {relativeTime(event.created_at)}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-slate-900">{formatBRL(Number(event.total_pedido) || 0)}</span>
              <StatusBadge level={badge.level} label={badge.label} />
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

/* ------------------------------------------------------------------ */
/* Integrações — lista compacta com o status que importa ao usuário     */
/* ------------------------------------------------------------------ */

const INTEGRATIONS: Array<{ key: IntegrationName; name: string }> = [
  { key: "bling", name: "Bling" },
  { key: "mercado_livre", name: "Mercado Livre" },
  { key: "shopee", name: "Shopee" },
  { key: "tray", name: "Tray" },
];

export const IntegrationsList: FC<{ integrations: IntegrationHealth[] }> = ({ integrations }) => (
  <Card className="h-full">
    <CardHeader title="Integrações" subtitle="Conexão com as plataformas" />
    <ul className="-mx-2 divide-y divide-slate-100">
      {INTEGRATIONS.map(({ key, name }) => {
        const integration = integrations.find((i) => i.integration === key);
        const status = deriveIntegrationStatus(integration);
        return (
          <li key={key} className="flex items-center gap-3 px-2 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {name}
                {integration?.label && <span className="ml-1.5 font-normal text-slate-500">{integration.label}</span>}
              </p>
              <p className="truncate text-xs text-slate-500">{status.detail}</p>
            </div>
            <StatusBadge level={status.level} label={status.label} />
          </li>
        );
      })}
    </ul>
  </Card>
);

/* ------------------------------------------------------------------ */
/* Mapeamentos De-Para — compacto, por categoria                       */
/* ------------------------------------------------------------------ */

export interface MappingRow {
  label: string;
  mapped: number;
  total: number;
  /** Falta de mapeamento bloqueia a integração de pedidos? */
  blocking: boolean;
  hint?: string;
}

export const MappingSummary: FC<{ rows: MappingRow[]; loading: boolean }> = ({ rows, loading }) => (
  <Card className="h-full">
    <CardHeader
      title="Mapeamentos De-Para"
      subtitle="Cadastros do Bling vinculados ao CIGAM"
      action={
        <Link to="/mapeados" className="shrink-0 text-xs font-medium text-[#007BAD] hover:underline">
          Ver mapeados
        </Link>
      }
    />
    {loading ? (
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="h-8 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    ) : (
      <ul className="space-y-3.5">
        {rows.map((row) => {
          const pct = row.total > 0 ? Math.min((row.mapped / row.total) * 100, 100) : 0;
          const missing = Math.max(row.total - row.mapped, 0);
          return (
            <li key={row.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-slate-700">
                  {row.label}
                  {row.blocking && missing > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700">
                      <Unlink className="h-3 w-3" aria-hidden="true" />
                      {missing} sem vínculo
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold text-slate-900">{Math.round(pct)}%</span>
                  <span className="ml-1.5 text-xs text-slate-500">
                    {formatInt(row.mapped)} de {formatInt(row.total)}
                  </span>
                </span>
              </div>
              <Meter value={pct} label={`${row.label}: ${Math.round(pct)}% mapeados`} />
              {row.hint && <p className="mt-1 text-xs text-slate-500">{row.hint}</p>}
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);
