import type { FC, MouseEvent } from "react";
import { CheckCircle2, RotateCcw, ShieldAlert, Square, SquareCheck, Trash2, XCircle } from "lucide-react";
import { getEventErrorGuide } from "../../utils/eventErrors";

export interface EventListRowEvent {
  id: string;
  numero_pedido: number;
  total_pedido: number;
  cigam_sincronizado: boolean;
  sync_status: "pendente" | "sincronizado" | "falha";
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

interface EventListRowProps {
  event: EventListRowEvent;
  marketplace?: string | null;
  /** Evento aberto no painel de detalhes. */
  isOpen: boolean;
  showCheckbox: boolean;
  isChecked: boolean;
  retrying: boolean;
  deleting: boolean;
  onToggleCheck: () => void;
  onRetry: () => void;
  onDelete: () => void;
}

const CHANNEL_BADGE: Record<string, { label: string; className: string }> = {
  mercado_livre: { label: "ML", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  shopee: { label: "Shopee", className: "border-orange-200 bg-orange-50 text-orange-700" },
  bling: { label: "Bling", className: "border-blue-200 bg-blue-50 text-blue-700" },
};

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "14/10 08:39" — data/hora local de recebimento (created_at). */
function formatRecebimento(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} ${hora}`;
}

/**
 * Conteúdo de uma linha do modo "Lista" do Histórico de eventos. É renderizado
 * dentro de cada item da AnimatedList (renderItem): clique, Enter e navegação
 * por setas ficam com a AnimatedList; aqui ficam o layout e as ações.
 */
export const EventListRow: FC<EventListRowProps> = ({
  event,
  marketplace,
  isOpen,
  showCheckbox,
  isChecked,
  retrying,
  deleting,
  onToggleCheck,
  onRetry,
  onDelete,
}) => {
  const channel = marketplace
    ? CHANNEL_BADGE[marketplace] ?? { label: marketplace, className: "border-slate-200 bg-slate-50 text-slate-600" }
    : null;

  // Ações não podem abrir o detalhe do evento (o clique no item abre).
  const stop = (handler: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    handler();
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-2.5 text-left">
      {/* Marca do evento aberto no painel de detalhes */}
      {isOpen && (
        <span aria-hidden="true" className="absolute inset-y-2.5 left-0 w-1 rounded-r-full bg-[#008FC7]" />
      )}

      {showCheckbox && (
        <button
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          aria-label={`Selecionar pedido #${event.numero_pedido} para exclusão`}
          onClick={stop(onToggleCheck)}
          className="shrink-0 rounded p-0.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B0F1]/40"
        >
          {isChecked ? <SquareCheck className="h-4 w-4 text-[#008FC7]" /> : <Square className="h-4 w-4 text-slate-400" />}
        </button>
      )}

      {/* Duas linhas curtas: a coluna da lista tem ~330px no desktop comum. */}
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-sm font-bold text-slate-900">#{event.numero_pedido}</span>
          {isOpen && <span className="sr-only">(aberto nos detalhes)</span>}
          {channel && (
            <span className={`truncate rounded-full border px-1.5 py-0.5 text-[0.6rem] font-bold ${channel.className}`}>
              {channel.label}
            </span>
          )}
        </p>
        <p className="truncate text-[0.7rem] tabular-nums text-slate-500">
          <span className="font-semibold text-slate-700">{BRL.format(Number(event.total_pedido) || 0)}</span>
          {" · "}
          {formatRecebimento(event.created_at)}
        </p>
      </div>

      {event.sync_status === "sincronizado" ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.68rem] font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Sincronizado
        </span>
      ) : event.sync_status === "falha" ? (
        <span
          tabIndex={0}
          title={event.error_message ? `${getEventErrorGuide(event.error_message).title}. Clique no pedido para ver como resolver.` : undefined}
          aria-label={`Falha${event.retry_count > 0 ? ` após ${event.retry_count} tentativa(s)` : ""}${event.error_message ? `: ${event.error_message}` : ""}`}
          className="inline-flex shrink-0 items-center gap-1 rounded text-[0.68rem] font-semibold text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          onClick={(e) => e.stopPropagation()}
        >
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          Falha{event.retry_count > 0 && ` (${event.retry_count}x)`}
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.68rem] font-semibold text-amber-700">
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Pendente
        </span>
      )}

      <div className="flex shrink-0 items-center justify-end gap-0.5">
        {!event.cigam_sincronizado && (
          <button
            type="button"
            disabled={retrying}
            onClick={stop(onRetry)}
            aria-label={`Tentar novamente o pedido #${event.numero_pedido}`}
            title="Tentar novamente"
            className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          </button>
        )}
        <button
          type="button"
          disabled={deleting}
          onClick={stop(onDelete)}
          aria-label={`Excluir pedido #${event.numero_pedido}`}
          title="Excluir"
          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className={`h-3.5 w-3.5 ${deleting ? "animate-pulse" : ""}`} />
        </button>
      </div>
    </div>
  );
};
