import { useEffect, useRef, useState, type FC, type KeyboardEvent } from "react";
import { CHART_COLOR, formatDayLong, formatDayShort, formatInt, type DailyPoint } from "./metrics";

const PLOT_HEIGHT = 180;
const AXIS_BAND = 24;
const TOP_PAD = 18; // espaço para o rótulo do pico
const LEFT_PAD = 36;
const MAX_BAR = 24;

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function columnPath(x: number, w: number, base: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  const y = base - h;
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${base}Z`;
}

/** Colunas de pedidos por dia — série única, uma cor, hover/teclado e tabela. */
export const DailyOrdersChart: FC<{ data: DailyPoint[] }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const total = data.reduce((acc, p) => acc + p.count, 0);
  const peakIndex = data.reduce((best, p, i) => (p.count > data[best].count ? i : best), 0);
  const yMax = niceMax(Math.max(...data.map((p) => p.count), 0));
  const ticks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  const plotW = Math.max(width - LEFT_PAD, 0);
  const band = data.length > 0 ? plotW / data.length : 0;
  const barW = Math.max(Math.min(MAX_BAR, band - 2, band * 0.7), 1);
  const base = TOP_PAD + PLOT_HEIGHT;
  const yOf = (v: number) => base - (v / yMax) * PLOT_HEIGHT;

  const maxLabels = Math.max(Math.floor(plotW / 52), 2);
  const labelStep = Math.ceil(data.length / maxLabels);

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setActive((prev) => {
        const start = prev ?? (dir > 0 ? -1 : data.length);
        return Math.min(Math.max(start + dir, 0), data.length - 1);
      });
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const activePoint = active !== null ? data[active] : null;
  const tooltipLeft = active !== null ? LEFT_PAD + band * active + band / 2 : 0;

  return (
    <div>
      <div ref={containerRef} className="relative w-full" style={{ height: base + AXIS_BAND }}>
        {width > 0 && (
          <svg
            width={width}
            height={base + AXIS_BAND}
            role="img"
            aria-label={`Pedidos recebidos por dia: ${formatInt(total)} no período, pico de ${formatInt(data[peakIndex]?.count ?? 0)} em ${data[peakIndex] ? formatDayShort(data[peakIndex].day) : "-"}. Use as setas para navegar pelos dias.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            onMouseLeave={() => setActive(null)}
            className="overflow-visible rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B0F1]/40"
          >
            {/* Grade e eixo Y — hairlines sólidas e recessivas */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={LEFT_PAD} x2={width} y1={yOf(t)} y2={yOf(t)} stroke={t === 0 ? "#cbd5e1" : "#eef2f6"} strokeWidth={1} />
                <text x={LEFT_PAD - 8} y={yOf(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums">
                  {formatInt(t)}
                </text>
              </g>
            ))}

            {data.map((point, i) => {
              const h = (point.count / yMax) * PLOT_HEIGHT;
              const x = LEFT_PAD + band * i + (band - barW) / 2;
              const dimmed = active !== null && active !== i;
              return (
                <g key={point.day}>
                  <path d={columnPath(x, barW, base, h)} fill={CHART_COLOR} opacity={dimmed ? 0.45 : 1} />
                  {/* Área de toque = a faixa inteira do dia, maior que a coluna */}
                  <rect
                    x={LEFT_PAD + band * i}
                    y={TOP_PAD}
                    width={band}
                    height={PLOT_HEIGHT}
                    fill="transparent"
                    onMouseEnter={() => setActive(i)}
                  />
                  {/* Rótulos espaçados para não colidir; o último dia (hoje) sempre aparece */}
                  {(i === data.length - 1 || (i % labelStep === 0 && data.length - 1 - i >= labelStep * 0.6)) && (
                    <text x={LEFT_PAD + band * i + band / 2} y={base + 16} textAnchor="middle" className="fill-slate-500 text-[11px] tabular-nums">
                      {formatDayShort(point.day)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Rótulo seletivo: só o pico */}
            {total > 0 && active === null && (
              <text
                x={LEFT_PAD + band * peakIndex + band / 2}
                y={yOf(data[peakIndex].count) - 6}
                textAnchor="middle"
                className="fill-slate-700 text-[11px] font-semibold"
              >
                {formatInt(data[peakIndex].count)}
              </text>
            )}
          </svg>
        )}

        {activePoint && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
            style={{ left: Math.min(Math.max(tooltipLeft, 60), width - 60), top: Math.max(yOf(activePoint.count) - 58, 0) }}
          >
            <p className="text-sm font-semibold text-slate-900">
              {formatInt(activePoint.count)} {activePoint.count === 1 ? "pedido" : "pedidos"}
            </p>
            <p className="text-xs capitalize text-slate-500">{formatDayLong(activePoint.day)}</p>
          </div>
        )}

        {total === 0 && width > 0 && (
          <p className="absolute inset-x-0 top-1/3 text-center text-sm text-slate-500">Nenhum pedido no período</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        aria-expanded={showTable}
        className="mt-2 text-xs font-medium text-[#007BAD] hover:underline"
      >
        {showTable ? "Ocultar tabela" : "Ver em tabela"}
      </button>

      {showTable && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Dia</th>
                <th className="px-3 py-2 text-right font-semibold">Pedidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[...data].reverse().map((p) => (
                <tr key={p.day}>
                  <td className="px-3 py-1.5 capitalize">{formatDayLong(p.day)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatInt(p.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
