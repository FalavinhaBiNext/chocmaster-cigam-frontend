import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Compass, Lightbulb, ListChecks, Target, Workflow, X } from "lucide-react";
import { useTour } from "../../contexts/TourContext";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;
const CARD_GAP = 16;
const VIEWPORT_MARGIN = 16;
const CARD_WIDTH = 400;
// Tempo máximo esperando o elemento aparecer (troca de rota, carregamento).
const TARGET_WAIT_MS = 2500;

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

// Retorna o retângulo visível do elemento, ou null se ele não existe ou está
// fora da tela (ex.: menu lateral escondido no celular).
function measureTarget(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0 || r.right <= 0 || r.left >= window.innerWidth) return null;

  // Elementos maiores que a tela: destaca só a parte visível.
  const top = Math.max(r.top, VIEWPORT_MARGIN / 2);
  const bottom = Math.min(r.bottom, window.innerHeight - VIEWPORT_MARGIN / 2);
  return { top, left: r.left, width: r.width, height: Math.max(bottom - top, 0) };
}

function placeCard(rect: Rect | null, cardHeight: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const clampTop = (top: number) => Math.min(Math.max(top, VIEWPORT_MARGIN), vh - cardHeight - VIEWPORT_MARGIN);
  const clampLeft = (left: number) => Math.min(Math.max(left, VIEWPORT_MARGIN), vw - width - VIEWPORT_MARGIN);

  if (!rect) {
    return { top: Math.max((vh - cardHeight) / 2, VIEWPORT_MARGIN), left: (vw - width) / 2, width };
  }

  const spot = {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    right: rect.left + rect.width + SPOTLIGHT_PADDING,
    bottom: rect.top + rect.height + SPOTLIGHT_PADDING,
  };

  if (vw - spot.right >= width + CARD_GAP + VIEWPORT_MARGIN) {
    return { top: clampTop(spot.top), left: spot.right + CARD_GAP, width };
  }
  if (vh - spot.bottom >= cardHeight + CARD_GAP + VIEWPORT_MARGIN) {
    return { top: spot.bottom + CARD_GAP, left: clampLeft(spot.left), width };
  }
  if (spot.top >= cardHeight + CARD_GAP + VIEWPORT_MARGIN) {
    return { top: spot.top - CARD_GAP - cardHeight, left: clampLeft(spot.left), width };
  }
  if (spot.left >= width + CARD_GAP + VIEWPORT_MARGIN) {
    return { top: clampTop(spot.top), left: spot.left - CARD_GAP - width, width };
  }
  // Sem espaço ao redor: card fixo na parte de baixo da tela, sobre o destaque.
  return { top: vh - cardHeight - VIEWPORT_MARGIN, left: (vw - width) / 2, width };
}

export function ProductTour() {
  const { active, steps, index, scope, next, prev, finish } = useTour();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const step = active ? steps[index] : undefined;

  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const [, setViewportTick] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Leva o usuário até a tela do passo.
  useEffect(() => {
    if (step?.route && pathname !== step.route) {
      navigate(step.route);
    }
  }, [step, pathname, navigate]);

  // Acompanha a posição do elemento destacado. Usa polling porque o alvo pode
  // surgir depois (troca de rota, skeleton de carregamento) e mudar de lugar.
  useEffect(() => {
    setRect(null);
    if (!step?.target) return;
    const target = step.target;
    const startedAt = Date.now();
    let scrolled = false;

    const update = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      const next = measureTarget(target);
      setRect((current) => (sameRect(current, next) ? current : next));
    };

    update();
    const interval = window.setInterval(() => {
      // Depois do tempo de espera, só continua se o alvo já foi encontrado.
      if (!scrolled && Date.now() - startedAt > TARGET_WAIT_MS) return;
      update();
    }, 150);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => setViewportTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  // Altura real do card (varia por passo) para posicioná-lo sem sair da tela.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    setCardHeight(card.offsetHeight);
    const observer = new ResizeObserver(() => setCardHeight(card.offsetHeight));
    observer.observe(card);
    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (!active) return;
    cardRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, index, next, prev, finish]);

  if (!step) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;
  const position = placeCard(rect, cardHeight);

  return createPortal(
    <div className="fixed inset-0 z-[10000]" aria-live="polite">
      {/* Bloqueia cliques na página enquanto o tour está aberto */}
      <div className={`absolute inset-0 ${rect ? "" : "bg-slate-950/60 backdrop-blur-[2px]"} animate-fadeIn`} />

      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl ring-2 ring-[#00B0F1] transition-all duration-300 ease-out"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.60), 0 0 24px 4px rgba(0, 176, 241, 0.45)",
          }}
        />
      )}

      <div
        ref={cardRef}
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        className="animate-scaleIn absolute flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white text-slate-900 shadow-[0_30px_70px_-25px_rgba(2,6,23,0.80)] transition-[top,left] duration-300 ease-out focus:outline-none"
        style={{ top: position.top, left: position.left, width: position.width }}
      >
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#00B0F1] to-[#008FC7] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#00B0F1]/20 bg-[#00B0F1]/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#008FC7]">
                <Compass className="h-3 w-3" aria-hidden="true" />
                {step.section}
              </span>
              <span className="text-[0.68rem] font-medium text-slate-400">
                {index + 1} de {steps.length}
              </span>
            </div>
            <h3 id="tour-title" className="mt-2 text-base font-bold tracking-tight text-slate-900">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Fechar tour"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-subtle mt-3 flex-1 space-y-4 overflow-y-auto px-5 pb-4 text-sm leading-relaxed text-slate-600">
          <TourBlock icon={Target} title="Objetivo">
            <p>{step.objective}</p>
          </TourBlock>

          {step.howItWorks && (
            <TourBlock icon={Workflow} title="Como funciona">
              <ul className="space-y-1.5">
                {step.howItWorks.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00B0F1]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TourBlock>
          )}

          {step.steps && (
            <TourBlock icon={ListChecks} title="Passo a passo">
              <ol className="space-y-1.5">
                {step.steps.map((item, i) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.65rem] font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </TourBlock>
          )}

          {step.tip && (
            <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[0.8rem] text-amber-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <p>{step.tip}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          {isLast ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={finish}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              {scope ? "Fechar" : "Pular tour"}
            </button>
          )}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={prev}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#00B0F1] to-[#008FC7] px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(0,176,241,0.85)] hover:brightness-105"
            >
              {isFirst && !scope ? "Começar" : isLast ? "Concluir" : "Próximo"}
              {isLast ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TourBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </h4>
      {children}
    </section>
  );
}
