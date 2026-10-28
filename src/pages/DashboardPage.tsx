import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Clock, FileText, Link2Off, RefreshCw, Unlink } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../components/dashboard/useDashboardData";
import { DailyOrdersChart } from "../components/dashboard/DailyOrdersChart";
import {
  AttentionPanel,
  ChannelBreakdown,
  IntegrationsList,
  MappingSummary,
  PipelineFunnel,
  RecentOrders,
  type AttentionItem,
  type MappingRow,
} from "../components/dashboard/panels";
import { Card, CardHeader, StatTile } from "../components/dashboard/ui";
import {
  channelBreakdown,
  dailySeries,
  deltaPercent,
  deriveIntegrationStatus,
  eventsInRange,
  formatBRLCompact,
  formatInt,
  funnel,
  rangeDays,
  stalePendingEvents,
  sumValue,
} from "../components/dashboard/metrics";
import type { DashboardPedido } from "../components/dashboard/types";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { useDateRangeParam } from "../utils/useDateRangeParam";
import { formatRangeDates, presetLabel, previousRange } from "../utils/dateRange";

const INTEGRATION_NAMES = { bling: "Bling", mercado_livre: "Mercado Livre", shopee: "Shopee", tray: "Tray" } as const;

export function DashboardPage() {
  const app = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { events, pedidos, integrations, loading, refreshing, error, updatedAt, refresh } = useDashboardData();
  // Período (?periodo=) pela data de recebimento no sistema — mesmo seletor e
  // mesma regra da tela de Eventos. Padrão: últimos 30 dias.
  const [periodo, setPeriodo] = useDateRangeParam("ultimos-30");

  const pedidosById = useMemo(
    () => new Map<string, DashboardPedido>(pedidos.map((p) => [String(p.id_bling), p])),
    [pedidos],
  );

  const view = useMemo(() => {
    const days = rangeDays(periodo, events);
    const current = eventsInRange(events, periodo);
    // Comparação com os N dias imediatamente anteriores; "Todo o período" não
    // tem período anterior, então a variação fica oculta (delta = null).
    const previous =
      periodo.start && periodo.end ? eventsInRange(events, previousRange(periodo.start, periodo.end)) : null;
    const sincronizados = current.filter((e) => e.sync_status === "sincronizado").length;
    const stages = funnel(current, pedidosById);

    return {
      current,
      daily: dailySeries(current, days),
      channels: channelBreakdown(current, pedidosById),
      stages,
      pedidos: current.length,
      pedidosDelta: previous ? deltaPercent(current.length, previous.length) : null,
      valor: sumValue(current),
      valorDelta: previous ? deltaPercent(sumValue(current), sumValue(previous)) : null,
      syncRate: current.length > 0 ? (sincronizados / current.length) * 100 : null,
      sincronizados,
      faturadas: stages[2].count,
      enviadas: stages[3].count,
    };
  }, [events, pedidosById, periodo]);

  const recent = useMemo(
    () => [...events].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
    [events],
  );

  // Itens de atenção: estado atual (independe do período escolhido).
  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    const falhas = events.filter((e) => e.sync_status === "falha").length;
    if (falhas > 0) {
      items.push({
        key: "falhas",
        level: "critical",
        icon: AlertTriangle,
        title: `${formatInt(falhas)} ${falhas === 1 ? "pedido com falha" : "pedidos com falha"} no CIGAM`,
        detail: "Revise o erro e tente novamente",
        to: "/eventos?filtro=falhas",
      });
    }

    const parados = stalePendingEvents(events).length;
    if (parados > 0) {
      items.push({
        key: "pendentes",
        level: "warning",
        icon: Clock,
        title: `${formatInt(parados)} ${parados === 1 ? "pedido parado" : "pedidos parados"} há mais de 30 min`,
        detail: "Ainda não sincronizados com o CIGAM",
        to: "/eventos?filtro=pendentes",
      });
    }

    if (app.pendingNfeCount > 0) {
      items.push({
        key: "nfe",
        level: "warning",
        icon: FileText,
        title: `${formatInt(app.pendingNfeCount)} NF-e aguardando envio`,
        detail: "Envie ao marketplace para liberar a etiqueta",
        to: "/nfe",
      });
    }

    for (const key of Object.keys(INTEGRATION_NAMES) as Array<keyof typeof INTEGRATION_NAMES>) {
      const status = deriveIntegrationStatus(integrations.find((i) => i.integration === key));
      if (status.level !== "good" && integrations.length > 0) {
        items.push({
          key: `int-${key}`,
          level: status.level === "critical" ? "critical" : "warning",
          icon: Link2Off,
          title: `${INTEGRATION_NAMES[key]}: ${status.label.toLowerCase()}`,
          detail: status.detail,
          to: isAdmin ? "/configuracoes" : undefined,
        });
      }
    }

    // Forma de pagamento sem De-Para faz o envio ao CIGAM falhar (cigamPedidoService).
    // Transportadoras e clientes não entram: o vínculo é criado automaticamente.
    // Produtos também bloqueiam, mas a maioria dos não mapeados nunca é vendida —
    // um pedido afetado já aparece como falha acima.
    const pagamentosSemVinculo = app.blingFormasPagamento.length - app.mappings.formas_pagamento.length;
    if (!app.loading && pagamentosSemVinculo > 0) {
      items.push({
        key: "map-pagamento",
        level: "critical",
        icon: Unlink,
        title: `${pagamentosSemVinculo} ${pagamentosSemVinculo === 1 ? "forma de pagamento" : "formas de pagamento"} sem De-Para`,
        detail: "Pedidos com essa forma de pagamento falham no CIGAM",
        to: isAdmin ? "/de-para" : undefined,
      });
    }

    return items;
  }, [events, integrations, app, isAdmin]);

  const mappingRows: MappingRow[] = [
    {
      label: "Formas de pagamento",
      mapped: app.mappings.formas_pagamento.length,
      total: app.blingFormasPagamento.length,
      blocking: true,
    },
    {
      label: "Produtos",
      mapped: app.mappings.produtos.length,
      total: app.blingProdutos.length,
      blocking: false,
      hint: "Pedido com produto sem vínculo falha no CIGAM.",
    },
    {
      label: "Transportadoras",
      mapped: app.mappings.transportadoras.length,
      total: app.blingTransportadoras.length,
      blocking: false,
      hint: "Vinculadas automaticamente ao integrar o pedido.",
    },
    {
      label: "Clientes",
      mapped: app.mappings.clientes.length,
      total: app.blingClientes.length,
      blocking: false,
      hint: "Vinculados automaticamente ao integrar o pedido.",
    },
  ];

  const periodDates = formatRangeDates(periodo);
  const periodTitle = presetLabel(periodo.preset);

  return (
    <div className="space-y-5">
      {/* Cabeçalho + filtro de período (escopo: tudo abaixo) */}
      <header data-tour="dashboard-header" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Pedidos do Bling integrados ao CIGAM e aos marketplaces
            {updatedAt && (
              <span className="text-slate-400">
                {" · "}atualizado às {updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangeFilter value={periodo} onChange={setPeriodo} />
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Atualizar dados"
            title="Atualizar dados"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-sm">{error}</p>
          <button type="button" onClick={refresh} className="text-sm font-semibold underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        // Na recarga, mantém o conteúdo anterior esmaecido — sem pular layout.
        <div className={`space-y-5 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
          <div data-tour="dashboard-attention">
            <AttentionPanel items={attention} />
          </div>

          <section data-tour="dashboard-stats" aria-label="Indicadores do período" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Pedidos recebidos"
              value={formatInt(view.pedidos)}
              delta={view.pedidosDelta}
              deltaLabel="vs período anterior"
            />
            <StatTile
              label="Valor movimentado"
              value={formatBRLCompact(view.valor)}
              delta={view.valorDelta}
              deltaLabel="vs período anterior"
            />
            <StatTile
              label="Sincronizados no CIGAM"
              value={view.syncRate === null ? "—" : `${Math.round(view.syncRate)}%`}
              hint={`${formatInt(view.sincronizados)} de ${formatInt(view.pedidos)} pedidos`}
            />
            <StatTile
              label="NF-e enviadas ao marketplace"
              value={formatInt(view.enviadas)}
              hint={`de ${formatInt(view.faturadas)} faturadas no período`}
            />
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Pedidos recebidos por dia"
                subtitle={`${periodo.preset === "personalizado" ? periodDates : periodTitle}${
                  periodo.preset !== "personalizado" && periodDates ? ` · ${periodDates}` : ""
                } · ${formatInt(view.pedidos)} pedidos`}
              />
              <DailyOrdersChart data={view.daily} />
            </Card>
            <ChannelBreakdown rows={view.channels} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <PipelineFunnel stages={view.stages} />
            </div>
            <IntegrationsList integrations={integrations} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RecentOrders events={recent} pedidosById={pedidosById} />
            </div>
            <MappingSummary rows={mappingRows} loading={app.loading} />
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando dashboard">
      <div className="h-14 animate-pulse rounded-2xl bg-white/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-white/70 xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-white/70" />
      </div>
    </div>
  );
}
