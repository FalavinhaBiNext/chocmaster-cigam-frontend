/**
 * Modelo de período compartilhado (Dashboard e Eventos).
 *
 * Os dias são representados como strings "AAAA-MM-DD" no fuso local do
 * navegador — comparar essas strings equivale a comparar datas, sem as
 * armadilhas de hora/fuso do objeto Date.
 */

export type DateRangePreset =
  | "hoje"
  | "ontem"
  | "ultimos-7"
  | "esta-semana"
  | "ultimos-30"
  | "este-mes"
  | "mes-passado"
  | "ultimos-90"
  | "tudo"
  | "personalizado";

export interface DateRangeValue {
  preset: DateRangePreset;
  /** Primeiro dia (inclusive); null = sem limite inicial. */
  start: string | null;
  /** Último dia (inclusive); null = sem limite final. */
  end: string | null;
}

/** 1 = segunda-feira (semana comercial). 0 seria domingo. */
export const WEEK_STARTS_ON = 1;

export const PRESET_OPTIONS: Array<{ preset: Exclude<DateRangePreset, "personalizado">; label: string }> = [
  { preset: "hoje", label: "Hoje" },
  { preset: "ontem", label: "Ontem" },
  { preset: "ultimos-7", label: "Últimos 7 dias" },
  { preset: "esta-semana", label: "Esta semana" },
  { preset: "ultimos-30", label: "Últimos 30 dias" },
  { preset: "este-mes", label: "Este mês" },
  { preset: "mes-passado", label: "Mês passado" },
  { preset: "ultimos-90", label: "Últimos 90 dias" },
  { preset: "tudo", label: "Todo o período" },
];

const PRESET_LABELS: Record<DateRangePreset, string> = {
  ...Object.fromEntries(PRESET_OPTIONS.map((o) => [o.preset, o.label])),
  personalizado: "Personalizado",
} as Record<DateRangePreset, string>;

/** Chave de dia local (AAAA-MM-DD) — evita o deslocamento de fuso do toISOString. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Dia em que o evento foi recebido pelo sistema (created_at), no fuso local.
 * É a data de referência de Eventos e Dashboard — a data do pedido no Bling
 * não é usada.
 */
export function eventDay(event: { created_at: string }): string {
  return dayKey(new Date(event.created_at));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Converte "AAAA-MM-DD" em Date local (meia-noite). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDay(day: string): boolean {
  if (!DAY_PATTERN.test(day)) return false;
  return dayKey(parseDay(day)) === day; // rejeita 2026-02-31 etc.
}

/** Calcula o intervalo de um atalho em relação a "hoje". */
export function resolveRange(
  preset: DateRangePreset,
  today: Date = new Date(),
  custom?: { start: string; end: string },
): DateRangeValue {
  const t = startOfDay(today);
  const range = (start: Date | null, end: Date | null): DateRangeValue => ({
    preset,
    start: start ? dayKey(start) : null,
    end: end ? dayKey(end) : null,
  });

  switch (preset) {
    case "hoje":
      return range(t, t);
    case "ontem":
      return range(addDays(t, -1), addDays(t, -1));
    case "ultimos-7":
      return range(addDays(t, -6), t);
    case "ultimos-30":
      return range(addDays(t, -29), t);
    case "ultimos-90":
      return range(addDays(t, -89), t);
    case "esta-semana": {
      const offset = (t.getDay() - WEEK_STARTS_ON + 7) % 7;
      return range(addDays(t, -offset), t);
    }
    case "este-mes":
      return range(new Date(t.getFullYear(), t.getMonth(), 1), t);
    case "mes-passado":
      return range(new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0));
    case "personalizado":
      return { preset, start: custom?.start ?? null, end: custom?.end ?? null };
    case "tudo":
    default:
      return { preset: "tudo", start: null, end: null };
  }
}

export function isDayInRange(day: string, range: Pick<DateRangeValue, "start" | "end">): boolean {
  if (range.start && day < range.start) return false;
  if (range.end && day > range.end) return false;
  return true;
}

/** Todos os dias do intervalo, do primeiro ao último (exige início e fim). */
export function daysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  for (let d = parseDay(start); dayKey(d) <= end; d = addDays(d, 1)) {
    days.push(dayKey(d));
  }
  return days;
}

/** Os N dias imediatamente anteriores a um intervalo de N dias. */
export function previousRange(start: string, end: string): { start: string; end: string } {
  const length = daysInRange(start, end).length;
  const prevEnd = addDays(parseDay(start), -1);
  return { start: dayKey(addDays(prevEnd, -(length - 1))), end: dayKey(prevEnd) };
}

/** Valida um intervalo personalizado; devolve a mensagem de erro ou null. */
export function validateCustomRange(start: string, end: string, today: Date = new Date()): string | null {
  if (!start || !end || !isValidDay(start) || !isValidDay(end)) return "Informe a data inicial e a data final.";
  if (end < start) return "A data final deve ser igual ou posterior à data inicial";
  if (end > dayKey(today)) return "Não é possível escolher datas futuras.";
  return null;
}

function formatShort(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

function formatFull(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export function presetLabel(preset: DateRangePreset): string {
  return PRESET_LABELS[preset];
}

/** Datas do intervalo para exibição: "01/10 – 14/10" (ou com ano no personalizado). */
export function formatRangeDates(range: DateRangeValue): string {
  if (!range.start || !range.end) return "";
  const fmt = range.preset === "personalizado" ? formatFull : formatShort;
  return range.start === range.end ? fmt(range.start) : `${fmt(range.start)} – ${fmt(range.end)}`;
}

/** Texto completo do período, usado em mensagens ("Nenhum evento em ..."). */
export function formatRangeLabel(range: DateRangeValue): string {
  if (range.preset === "tudo") return "todo o período";
  if (range.preset === "personalizado") return formatRangeDates(range);
  const dates = formatRangeDates(range);
  return dates ? `${presetLabel(range.preset).toLowerCase()} (${dates})` : presetLabel(range.preset).toLowerCase();
}

/** Valor de ?periodo= → período. Retorna null se inválido (a tela usa o padrão). */
export function parseRangeParam(param: string | null, today: Date = new Date()): DateRangeValue | null {
  if (!param) return null;
  const custom = param.match(/^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/);
  if (custom) {
    const [, start, end] = custom;
    return validateCustomRange(start, end, today) === null ? resolveRange("personalizado", today, { start, end }) : null;
  }
  const preset = PRESET_OPTIONS.find((o) => o.preset === param)?.preset;
  return preset ? resolveRange(preset, today) : null;
}

/** Período → valor de ?periodo=. */
export function serializeRangeParam(range: DateRangeValue): string {
  if (range.preset === "personalizado" && range.start && range.end) return `${range.start}_${range.end}`;
  return range.preset;
}
