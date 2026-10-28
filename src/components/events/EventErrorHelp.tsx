import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Copy, ListChecks, RotateCcw, ShieldAlert } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getEventErrorGuide } from "../../utils/eventErrors";

interface EventErrorHelpProps {
  errorMessage: string;
  retryCount?: number;
  onRetry?: () => void;
  retrying?: boolean;
}

/** Explica a falha de sincronização de um pedido e aponta como resolvê-la. */
export function EventErrorHelp({ errorMessage, retryCount = 0, onRetry, retrying = false }: EventErrorHelpProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const guide = getEventErrorGuide(errorMessage);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const canUseAction = guide.action && (!guide.action.adminOnly || isAdmin);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  return (
    <section aria-label="Como resolver a falha" className="mt-3 overflow-hidden rounded-xl border border-red-200 bg-red-50/70 text-left">
      <div className="flex items-start gap-3 px-4 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-red-900">
            {guide.title}
            {retryCount > 0 && (
              <span className="ml-2 text-[0.68rem] font-semibold text-red-600">
                {retryCount} {retryCount === 1 ? "tentativa" : "tentativas"}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-red-800">{guide.explanation}</p>
        </div>
      </div>

      <div className="px-4 pt-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-red-700/80">
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          Como resolver
        </p>
        <ol className="space-y-1">
          {guide.steps.map((step, i) => (
            <li key={step} className="flex gap-2 text-xs leading-relaxed text-slate-700">
              <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[0.6rem] font-bold text-red-700 ring-1 ring-red-200">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {guide.action && !canUseAction && guide.adminHint && (
          <p className="mt-2 text-xs font-medium text-red-800">{guide.adminHint}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-4">
        {canUseAction && guide.action && (
          <Link
            to={guide.action.to}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
          >
            {guide.action.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
            {retrying ? "Tentando..." : "Tentar novamente"}
          </button>
        )}
      </div>

      <div className="mt-3 border-t border-red-200/70 bg-white/50 px-4 py-2">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="flex w-full items-center justify-between text-[0.68rem] font-semibold text-slate-500 hover:text-slate-800"
        >
          Detalhes técnicos (para o suporte)
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {showDetails && (
          <div className="mt-2 space-y-2">
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-2.5 font-mono text-[0.68rem] leading-relaxed text-slate-200">
              {errorMessage}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-slate-500 hover:text-slate-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar mensagem"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
