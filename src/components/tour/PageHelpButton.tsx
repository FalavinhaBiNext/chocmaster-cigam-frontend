import { CircleHelp } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTour } from "../../contexts/TourContext";

/** Botão "?" do cabeçalho: abre só os passos do tour da tela atual. */
export function PageHelpButton() {
  const { pathname } = useLocation();
  const { start, hasPageTour } = useTour();

  if (!hasPageTour(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() => start(pathname)}
      aria-label="Como usar esta tela"
      title="Como usar esta tela"
      className="inline-flex h-7 items-center gap-1 rounded-full border border-[#00B0F1]/20 bg-[#00B0F1]/5 px-2.5 text-[0.7rem] font-semibold text-[#008FC7] transition hover:bg-[#00B0F1]/10"
    >
      <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      Como usar
    </button>
  );
}
