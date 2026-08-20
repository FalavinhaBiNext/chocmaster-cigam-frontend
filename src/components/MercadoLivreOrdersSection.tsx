import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface MLOrder {
  id: number;
  status: string;
  date_created: string;
  date_closed: string;
  expiration_date: string;
  order_cost: number;
  total_amount: number;
  paid_amount: number;
  currency_id: string;
  buyer: {
    id: number;
    nickname: string;
    first_name: string;
    last_name: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
      variation_id: number | null;
      seller_sku: string | null;
    };
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  shipping: {
    id: number;
    status: string;
    logistic_type: string;
  } | null;
  payments: Array<{
    id: number;
    status: string;
    payment_type: string;
    total_paid_amount: number;
  }>;
}

interface MLOrdersResponse {
  results: MLOrder[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  payment_required: "Aguardando pagamento",
  payment_in_process: "Processando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  not_yet_created: "Não criado",
  closed: "Fechado",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  payment_required: "bg-amber-50 text-amber-700 border-amber-200",
  payment_in_process: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-slate-50 text-slate-600 border-slate-200",
};

export const MercadoLivreOrdersSection: FC = () => {
  const { token } = useAuth();

  const authHeaders = useMemo<HeadersInit>(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const [orders, setOrders] = useState<MLOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mercado-livre/orders?limit=50`, {
        headers: authHeaders,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Erro ao buscar pedidos");
      }
      const mlResponse = data.data as MLOrdersResponse;
      setOrders(mlResponse.results || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar pedidos do Mercado Livre.",
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Data indisponível";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== "todos") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id).includes(term) ||
          o.buyer?.nickname?.toLowerCase().includes(term) ||
          o.order_items?.some((item) =>
            item.item.title?.toLowerCase().includes(term),
          ),
      );
    }

    return result;
  }, [orders, statusFilter, searchTerm]);

  const totalValue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [filteredOrders],
  );

  const paidOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "paid" || o.status === "confirmed"),
    [filteredOrders],
  );

  const shippedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "shipped" || o.status === "delivered"),
    [filteredOrders],
  );

  const panelClassName = `
    relative overflow-hidden rounded-2xl
    border border-slate-200/80 bg-white/[0.96]
    shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.05)]
  `;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {createPortal(
        toast && (
          <div
            className={`fixed right-4 bottom-4 z-[9999] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 shrink-0 rounded-lg p-1 hover:bg-black/5"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ),
        document.body,
      )}

      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-yellow-50 to-white px-5 py-5 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)] sm:px-6">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-300/40 bg-yellow-100 text-yellow-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Pedidos Mercado Livre
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Visualize os 50 pedidos mais recentes da sua conta no Mercado Livre.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            title="Atualizar pedidos"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-400/40 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-500/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Atualizando..." : "Atualizar pedidos"}</span>
          </button>
        </div>
      </header>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{filteredOrders.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">Pagos / Confirmados</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">{paidOrders.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">Enviados / Entregues</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-700">{shippedOrders.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Truck className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">Valor total</p>
              <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900">{formatCurrency(totalValue)}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#E66F00]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
        </article>
      </section>

      {/* Filtros e busca */}
      <div className={panelClassName}>
        <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, comprador ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "todos", label: "Todos" },
              { key: "confirmed", label: "Confirmados" },
              { key: "paid", label: "Pagos" },
              { key: "shipped", label: "Enviados" },
              { key: "delivered", label: "Entregues" },
              { key: "cancelled", label: "Cancelados" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === f.key
                    ? "border border-yellow-300 bg-yellow-100 text-yellow-800"
                    : "border border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white/95 px-6 py-12 shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-yellow-400/20 border-t-yellow-500" />
          <p className="mt-4 text-sm font-semibold text-slate-700">Buscando pedidos do Mercado Livre</p>
          <p className="mt-1 text-xs text-slate-400">Aguarde enquanto consultamos a API...</p>
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/95 p-4 text-red-800 shadow-[0_12px_28px_-24px_rgba(127,29,29,0.60),inset_0_1px_1px_rgba(255,255,255,0.85)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Não foi possível carregar os pedidos</p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white/95 px-6 py-12 text-center shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">Nenhum pedido encontrado</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                {searchTerm || statusFilter !== "todos"
                  ? "Tente ajustar os filtros de busca."
                  : "Nenhum pedido foi retornado pela API do Mercado Livre."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`${panelClassName} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-25px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95)]`}
              >
                <div className="relative z-10">
                  {/* Cabeçalho do pedido */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-48 truncate rounded-full border border-yellow-300/40 bg-yellow-50 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-yellow-800">
                        ML #{order.id}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${STATUS_COLORS[order.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      {order.status === "cancelled" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[0.62rem] font-bold text-red-700">
                          <XCircle className="h-3 w-3" />
                          Cancelado
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[0.62rem] text-slate-400">
                      {formatDate(order.date_created)}
                    </span>
                  </div>

                  {/* Comprador */}
                  <div className="mt-3 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">
                      {order.buyer?.nickname || "Comprador desconhecido"}
                    </span>
                    {order.buyer?.first_name && (
                      <span className="text-xs text-slate-500">
                        ({order.buyer.first_name} {order.buyer.last_name})
                      </span>
                    )}
                  </div>

                  {/* Itens */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-800">{item.item.title}</p>
                            <p className="text-[0.62rem] text-slate-500">
                              Qtd: {item.quantity} x {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-bold text-slate-900">
                            {formatCurrency(item.full_unit_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Envio */}
                  {order.shipping && (
                    <div className="mt-3 flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600">
                        Envio: {STATUS_LABELS[order.shipping.status] || order.shipping.status}
                        {order.shipping.logistic_type && ` (${order.shipping.logistic_type})`}
                      </span>
                    </div>
                  )}

                  {/* Totais */}
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {order.paid_amount > 0 ? `Pago: ${formatCurrency(order.paid_amount)}` : "Não pago"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                      <p className="mt-1 text-lg font-bold text-yellow-700">{formatCurrency(order.total_amount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
