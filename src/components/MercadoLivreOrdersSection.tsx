import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  ExternalLink,
  Package,
  RefreshCw,
  Search,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

interface MLToken {
  id: string;
  user_id_ml: string;
  nickname: string | null;
  scope: string | null;
  app_id: string;
  active: boolean;
  expires_at: string;
}

interface MLOrder {
  id: number;
  status: string;
  status_detail: string;
  date_created: string;
  last_updated: string;
  total_amount: number;
  currency_id: string;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
  };
  seller: {
    id: number;
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    category_id: string;
  }>;
  shipping?: {
    id: string;
    status: string;
    receiver_address?: {
      city: string;
      state: string;
      zip_code: string;
    };
  };
  payments?: Array<{
    id: number;
    status: string;
    payment_type_id: string;
    transaction_amount: number;
  }>;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmado", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  paid: { label: "Pago", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  shipment_required: { label: "Envio necessário", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  shipped: { label: "Enviado", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  delivered: { label: "Entregue", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  closed: { label: "Fechado", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  not_started: { label: "Não iniciado", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  invalid: { label: "Inválido", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

export const MercadoLivreOrdersSection = () => {
  const { token } = useAuth();

  const authHeaders = useMemo<HeadersInit>(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const [tokens, setTokens] = useState<MLToken[]>([]);
  const [orders, setOrders] = useState<MLOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<MLOrder | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mercado-livre/tokens`, {
        headers: authHeaders,
      });
      if (response.ok) {
        const data = await response.json();
        setTokens(data.data || []);
      }
    } catch {
      // ignore
    }
  }, [authHeaders]);

  const fetchOrders = useCallback(async () => {
    const activeToken = tokens.find((t) => t.active);
    if (!activeToken) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoadingOrders(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/mercado-livre/orders?limit=50`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Erro ao buscar pedidos ML.");
      }

      const data = await response.json();
      setOrders(data.data?.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
      setLoading(false);
    }
  }, [tokens, authHeaders]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (tokens.length > 0) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [tokens, fetchOrders]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/mercado-livre/auth-url`,
        { headers: authHeaders },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Erro ao gerar URL de autenticação.");
      }

      const data = await response.json();
      window.location.href = data.data.authUrl;
    } catch (err: any) {
      setError(err.message);
      setConnecting(false);
    }
  };

  const handleDisconnect = async (tokenId: string) => {
    if (!window.confirm("Deseja desconectar esta conta do Mercado Livre?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mercado-livre/tokens/${tokenId}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error("Erro ao desconectar conta.");
      }

      setSuccess("Conta desconectada com sucesso.");
      await fetchTokens();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        String(order.id).includes(searchTerm) ||
        order.buyer?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some((item) =>
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeToken = tokens.find((t) => t.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pedidos Mercado Livre
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Visualize e gerencie os pedidos recebidos pelo Mercado Livre.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeToken && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFE600]/30 bg-[#FFE600]/10 px-3 py-1 text-xs font-semibold text-yellow-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFE600]" />
              {activeToken.nickname || activeToken.user_id_ml}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loadingOrders || !activeToken}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* No connection */}
      {!loading && tokens.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
            <Package className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Nenhuma conta Mercado Livre conectada
          </p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Conecte sua conta do Mercado Livre para visualizar seus pedidos.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FFE600] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-400 disabled:opacity-50"
          >
            {connecting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Conectar Mercado Livre
          </button>
        </div>
      )}

      {/* Connected but loading orders */}
      {!loading && tokens.length > 0 && loadingOrders && (
        <div className="flex min-h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#FFE600]" />
        </div>
      )}

      {/* Orders list */}
      {!loading && !loadingOrders && tokens.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ID, comprador ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-[#FFE600] focus:ring-2 focus:ring-[#FFE600]/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "Todos" },
                { id: "confirmed", label: "Confirmados" },
                { id: "paid", label: "Pagos" },
                { id: "shipment_required", label: "Envio necessário" },
                { id: "shipped", label: "Enviados" },
                { id: "delivered", label: "Entregues" },
                { id: "cancelled", label: "Cancelados" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`
                    inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition
                    ${
                      statusFilter === filter.id
                        ? "border-[#FFE600]/40 bg-[#FFE600]/10 text-yellow-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }
                  `}
                >
                  {filter.label}
                  <span className="text-[0.6rem] text-slate-400">
                    {statusCounts[filter.id] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders table */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Nenhum pedido encontrado
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {orders.length === 0
                  ? "Não há pedidos nesta conta."
                  : "Tente ajustar os filtros de busca."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Pedido</th>
                      <th className="px-5 py-3">Comprador</th>
                      <th className="px-5 py-3">Itens</th>
                      <th className="px-5 py-3">Valor</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Data</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => {
                      const st = statusMap[order.status] || {
                        label: order.status,
                        color: "text-slate-700",
                        bg: "bg-slate-100 border-slate-200",
                      };

                      return (
                        <tr
                          key={order.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <p className="font-mono text-sm font-semibold text-slate-900">
                              #{order.id}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              {order.buyer?.nickname || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-600">
                              {order.items?.length || 0}{" "}
                              {(order.items?.length || 0) === 1 ? "item" : "itens"}
                            </p>
                            {order.items?.[0] && (
                              <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                                {order.items[0].title}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(order.total_amount, order.currency_id)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-bold ${st.bg} ${st.color}`}
                            >
                              {st.label}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs text-slate-500">
                              {formatDate(order.date_created)}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#FFE600]/40 hover:bg-[#FFE600]/10 hover:text-yellow-700"
                            >
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
                {filteredOrders.length} de {orders.length} pedidos
              </div>
            </div>
          )}

          {/* Connected accounts */}
          {tokens.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Contas conectadas</h3>
              <div className="mt-3 space-y-2">
                {tokens.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      t.active
                        ? "border-[#FFE600]/30 bg-[#FFE600]/5"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          t.active ? "bg-[#FFE600]/20 text-yellow-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Tag className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {t.nickname || t.user_id_ml}
                        </p>
                        <p className="text-xs text-slate-400">ID: {t.user_id_ml}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDisconnect(t.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Desconectar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Order detail modal - renderizado via portal */}
      {selectedOrder &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pedido #{selectedOrder.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDate(selectedOrder.date_created)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Status */}
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                    statusMap[selectedOrder.status]?.bg || "bg-slate-100 border-slate-200"
                  } ${statusMap[selectedOrder.status]?.color || "text-slate-700"}`}
                >
                  {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>

              {/* Comprador */}
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                  Comprador
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedOrder.buyer?.nickname}
                </p>
                {selectedOrder.buyer?.email && (
                  <p className="text-xs text-slate-500">{selectedOrder.buyer.email}</p>
                )}
              </div>

              {/* Itens */}
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                  Itens
                </p>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          Qtd: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.unit_price * item.quantity, selectedOrder.currency_id)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagamento */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                    Pagamento
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedOrder.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{p.payment_type_id}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(p.transaction_amount, selectedOrder.currency_id)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Envio */}
              {selectedOrder.shipping && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-slate-400" />
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                      Envio
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    Status: {selectedOrder.shipping.status}
                  </p>
                  {selectedOrder.shipping.receiver_address && (
                    <p className="text-xs text-slate-500">
                      {selectedOrder.shipping.receiver_address.city}/
                      {selectedOrder.shipping.receiver_address.state} -{" "}
                      {selectedOrder.shipping.receiver_address.zip_code}
                    </p>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-lg font-bold text-[#FF8900]">
                  {formatCurrency(selectedOrder.total_amount, selectedOrder.currency_id)}
                </span>
              </div>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
};
