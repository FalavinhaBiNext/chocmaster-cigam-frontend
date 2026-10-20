import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FC } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import {
  PRESET_OPTIONS,
  dayKey,
  formatRangeDates,
  presetLabel,
  resolveRange,
  validateCustomRange,
  type DateRangeValue,
} from "../utils/dateRange";

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const MENU_WIDTH = 256;
const GAP = 8;
const VIEWPORT_MARGIN = 12;

/**
 * Seletor de período: botão com o período aplicado + menu de atalhos e
 * intervalo personalizado. Mesmo visual do controle de período do Dashboard.
 *
 * O menu é renderizado em portal com posição fixa, para não ser cortado por
 * painéis com overflow-hidden (ex.: o "Histórico de eventos"). Alinha pela
 * esquerda do botão quando cabe, senão pela direita; abre para cima se faltar
 * espaço embaixo.
 */
export const DateRangeFilter: FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.start ?? "");
  const [customEnd, setCustomEnd] = useState(value.end ?? "");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const today = dayKey(new Date());

  const posicionarMenu = useCallback(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu.scrollHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = rect.left + MENU_WIDTH <= vw - VIEWPORT_MARGIN
      ? rect.left
      : Math.max(VIEWPORT_MARGIN, rect.right - MENU_WIDTH);

    const espacoAbaixo = vh - rect.bottom - GAP - VIEWPORT_MARGIN;
    const espacoAcima = rect.top - GAP - VIEWPORT_MARGIN;
    const abrirParaCima = menuHeight > espacoAbaixo && espacoAcima > espacoAbaixo;
    const maxHeight = Math.max(abrirParaCima ? espacoAcima : espacoAbaixo, 160);

    setMenuStyle({
      position: "fixed",
      left,
      width: MENU_WIDTH,
      maxHeight,
      ...(abrirParaCima ? { bottom: vh - rect.top + GAP } : { top: rect.bottom + GAP }),
    });
  }, []);

  // Posiciona antes de pintar e acompanha rolagem/redimensionamento.
  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle({ visibility: "hidden" });
      return;
    }
    posicionarMenu();
    window.addEventListener("resize", posicionarMenu);
    window.addEventListener("scroll", posicionarMenu, true);
    return () => {
      window.removeEventListener("resize", posicionarMenu);
      window.removeEventListener("scroll", posicionarMenu, true);
    };
  }, [open, posicionarMenu]);

  // Ao abrir, o personalizado começa com o período atual (ou hoje).
  useEffect(() => {
    if (!open) return;
    setCustomStart(value.start ?? today);
    setCustomEnd(value.end ?? today);
  }, [open, value.start, value.end, today]);

  // Fecha com Esc e clique fora.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const alvo = e.target as Node;
      // O menu está em portal (fora do container), então conta como "dentro" também.
      if (!containerRef.current?.contains(alvo) && !menuRef.current?.contains(alvo)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const customError = customStart && customEnd ? validateCustomRange(customStart, customEnd) : null;
  const dates = formatRangeDates(value);

  const applyCustom = () => {
    if (validateCustomRange(customStart, customEnd) !== null) return;
    onChange(resolveRange("personalizado", new Date(), { start: customStart, end: customEnd }));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B0F1]/40"
      >
        <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <span>{value.preset === "personalizado" ? "Personalizado" : presetLabel(value.preset)}</span>
        {dates && <span className="font-normal text-slate-500">{dates}</span>}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="dialog"
          aria-label="Selecionar período"
          style={menuStyle}
          className="z-9990 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <ul role="listbox" aria-label="Atalhos de período">
            {PRESET_OPTIONS.map((option) => {
              const selected = value.preset === option.preset;
              return (
                <li key={option.preset}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(resolveRange(option.preset));
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                      selected ? "font-semibold text-slate-900" : "text-slate-700"
                    }`}
                  >
                    {option.label}
                    {selected && <Check className="h-4 w-4 text-slate-900" strokeWidth={2.5} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-1.5 border-t border-slate-100 px-2.5 pb-1.5 pt-2.5">
            <p className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
              Personalizado
              {value.preset === "personalizado" && <Check className="h-4 w-4 text-slate-900" strokeWidth={2.5} aria-hidden="true" />}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[0.7rem] text-slate-500">
                De
                <input
                  type="date"
                  value={customStart}
                  max={today}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-[#00B0F1] focus:outline-none focus:ring-2 focus:ring-[#00B0F1]/20"
                />
              </label>
              <label className="text-[0.7rem] text-slate-500">
                Até
                <input
                  type="date"
                  value={customEnd}
                  max={today}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-[#00B0F1] focus:outline-none focus:ring-2 focus:ring-[#00B0F1]/20"
                />
              </label>
            </div>
            {customError && (
              <p role="alert" className="mt-1.5 text-[0.7rem] text-red-700">
                {customError}
              </p>
            )}
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customStart || !customEnd || customError !== null}
              className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
