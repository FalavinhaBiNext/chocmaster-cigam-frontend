import type { DashboardEvent, DashboardPedido, IntegrationHealth, PeriodDays } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cor das marcas dos gráficos (série única) — o azul escuro da marca. Validado
 * com o validate_palette da skill de dataviz: contraste 3,6:1 no fundo branco.
 * O ciano #00B0F1 da marca fica só como acento: tem 2,5:1, abaixo do mínimo.
 */
export const CHART_COLOR = "#008FC7";

/** Chave de dia local (YYYY-MM-DD) — evita o deslocamento de fuso do toISOString. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Dia do pedido: data_pedido (data do Bling) ou, na falta dela, o recebimento. */
export function eventDay(event: DashboardEvent): string {
  if (event.data_pedido) return event.data_pedido.slice(0, 10);
  return dayKey(new Date(event.created_at));
}

/** Dias do período, do mais antigo ao mais recente, terminando hoje. */
export function periodDays(days: PeriodDays, offsetPeriods = 0, today = new Date()): string[] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  end.setDate(end.getDate() - days * offsetPeriods);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (days - 1 - i));
    return dayKey(d);
  });
}

export function eventsInDays(events: DashboardEvent[], days: string[]): DashboardEvent[] {
  if (days.length === 0) return [];
  const first = days[0];
  const last = days[days.length - 1];
  return events.filter((event) => {
    const day = eventDay(event);
    return day >= first && day <= last;
  });
}

export interface DailyPoint {
  day: string;
  count: number;
}

export function dailySeries(events: DashboardEvent[], days: string[]): DailyPoint[] {
  const counts = new Map<string, number>(days.map((day) => [day, 0]));
  for (const event of events) {
    const day = eventDay(event);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return days.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

const CHANNEL_LABELS: Record<string, string> = {
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  bling: "Bling",
};

export function channelLabel(marketplace: string | null | undefined): string {
  if (!marketplace) return "Não identificado";
  return CHANNEL_LABELS[marketplace] ?? marketplace.charAt(0).toUpperCase() + marketplace.slice(1);
}

export interface ChannelRow {
  label: string;
  count: number;
  value: number;
}

const MAX_CHANNELS = 6;

/** Pedidos por canal, do maior para o menor; a cauda além de 6 vira "Outros". */
export function channelBreakdown(
  events: DashboardEvent[],
  pedidosById: Map<string, DashboardPedido>,
): ChannelRow[] {
  const rows = new Map<string, ChannelRow>();
  for (const event of events) {
    const label = channelLabel(pedidosById.get(String(event.pedido_id))?.marketplace);
    const row = rows.get(label) ?? { label, count: 0, value: 0 };
    row.count += 1;
    row.value += Number(event.total_pedido) || 0;
    rows.set(label, row);
  }

  const sorted = [...rows.values()].sort((a, b) => b.count - a.count);
  if (sorted.length <= MAX_CHANNELS) return sorted;

  const head = sorted.slice(0, MAX_CHANNELS - 1);
  const tail = sorted.slice(MAX_CHANNELS - 1);
  head.push({
    label: "Outros",
    count: tail.reduce((acc, r) => acc + r.count, 0),
    value: tail.reduce((acc, r) => acc + r.value, 0),
  });
  return head;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export function funnel(events: DashboardEvent[], pedidosById: Map<string, DashboardPedido>): FunnelStage[] {
  let sincronizados = 0;
  let faturadas = 0;
  let enviadas = 0;
  for (const event of events) {
    if (event.sync_status === "sincronizado") sincronizados += 1;
    const statusNfe = pedidosById.get(String(event.pedido_id))?.status_nfe;
    if (statusNfe === "faturada" || statusNfe === "enviada") faturadas += 1;
    if (statusNfe === "enviada") enviadas += 1;
  }
  return [
    { key: "recebidos", label: "Pedidos recebidos", count: events.length },
    { key: "sincronizados", label: "Sincronizados no CIGAM", count: sincronizados },
    { key: "faturadas", label: "NF-e faturada", count: faturadas },
    { key: "enviadas", label: "NF-e enviada ao marketplace", count: enviadas },
  ];
}

export function sumValue(events: DashboardEvent[]): number {
  return events.reduce((acc, e) => acc + (Number(e.total_pedido) || 0), 0);
}

/** Variação percentual; null quando não há base de comparação. */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Pendentes há mais de 30 min: a fila deveria tê-los processado — vira alerta. */
export function stalePendingEvents(events: DashboardEvent[], now = Date.now()): DashboardEvent[] {
  return events.filter(
    (e) => e.sync_status === "pendente" && now - new Date(e.created_at).getTime() > 30 * 60 * 1000,
  );
}

export type HealthLevel = "good" | "warning" | "critical";

export interface DerivedIntegrationStatus {
  level: HealthLevel;
  label: string;
  detail: string;
}

const REFRESH_WARNING_MS = 5 * DAY_MS;

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / DAY_MS);
  const magnitude = minutes < 60 ? `${minutes} min` : hours < 48 ? `${hours}h` : `${days}d`;
  return diff >= 0 ? `em ${magnitude}` : `há ${magnitude}`;
}

/**
 * Status de uma integração do ponto de vista do usuário. O access token vencido
 * NÃO é problema: todos os clientes HTTP (Bling, ML, Shopee, Tray) o renovam
 * automaticamente pelo refresh token. Só pede ação quando não há conexão ou
 * quando o refresh token (conhecido só na Tray) venceu ou está para vencer.
 */
export function deriveIntegrationStatus(integration: IntegrationHealth | undefined, now = Date.now()): DerivedIntegrationStatus {
  if (!integration?.connected) {
    return { level: "critical", label: "Não conectado", detail: "Conecte a conta em Configurações" };
  }

  if (integration.refreshTokenExpiresAt) {
    const remaining = new Date(integration.refreshTokenExpiresAt).getTime() - now;
    const when = relativeTime(integration.refreshTokenExpiresAt, now);
    if (remaining <= 0) {
      return { level: "critical", label: "Reconectar", detail: `Autorização expirou ${when}` };
    }
    if (remaining < REFRESH_WARNING_MS) {
      return { level: "warning", label: "Reconectar em breve", detail: `Autorização expira ${when}` };
    }
    return { level: "good", label: "Conectado", detail: `Autorização válida, expira ${when}` };
  }

  return { level: "good", label: "Conectado", detail: "Token renovado automaticamente" };
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const BRL_COMPACT = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const INT = new Intl.NumberFormat("pt-BR");

export const formatBRL = (v: number) => BRL.format(v);
export const formatBRLCompact = (v: number) => (Math.abs(v) >= 100_000 ? BRL_COMPACT.format(v) : BRL.format(v));
export const formatInt = (v: number) => INT.format(v);

export function formatDayShort(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

export function formatDayLong(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}
