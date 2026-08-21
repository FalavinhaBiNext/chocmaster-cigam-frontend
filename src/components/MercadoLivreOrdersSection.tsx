import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface PedidoLocal {
  id: string;
  id_bling: string;
  codigo_curto: string;
  numero_loja: string;
  data_pedido: string;
  total_produtos: number;
  total_venda: number;
  id_cliente_bling: string;
  nome_cliente: string;
  documento_cliente: string;
  tipo_pessoa: string;
  id_loja: string;
  desconto: number;
  quantidade_itens: number;
  status_venda: string;
  codigo_transportadora: string;
  valor_frete: number;
  nome_transportadora: string;
  codigo_rastreio: string;
  unidade_negocio: string | null;
  data_prevista: string | null;
  numero_pedido_cigam: string | null;
  marketplace: string | null;
  status_nfe: string | null;
  shipping_id: string | null;
  created_at: string;
  updated_at: string;
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

const SUBSTATUS_LABELS: Record<string, string> = {
  shipment_paid: "Pagamento confirmado",
  invoice_pending: "Aguardando NF-e",
  waiting_for_carrier_authorization: "Aguardando autorização da transportadora",
  ready_to_print: "Pronto para impressão",
  picked_up: "Coletado",
  in_hub: "No hub de distribuição",
  in_packing_list: "Na lista de embalagem",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  not_delivered: "Não entregue",
  route_assigned: "Rota atribuída",
  delay: "Atrasado",
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

  const [orders, setOrders] = useState<PedidoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("todos");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [shipmentResults, setShipmentResults] = useState<Record<string, {
    shipmentId: number | null;
    status: string | null;
    substatus: string | null;
    readyForInvoice: boolean;
    substatusHistory: Array<{ date: string; substatus: string; status: string }>;
  }>>({});
  const [checkingShipment, setCheckingShipment] = useState<string | null>(null);
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const [pendingInvoices, setPendingInvoices] = useState<Record<string, { id: string; numero_nf: string | null }>>({});
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [sentInvoices, setSentInvoices] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersResponse, notasResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/pedidos`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/notas-fiscais-cigam/nao-enviadas`, { headers: authHeaders }),
      ]);
      const data = await ordersResponse.json();
      if (!data.success) {
        throw new Error(data.message || "Erro ao buscar pedidos");
      }
      setOrders(data.data || []);

      // Mapear NF-e pendentes por numero_pedido_marketplace
      try {
        const notasData = await notasResponse.json();
        if (notasData.success && notasData.data) {
          const pending: Record<string, { id: string; numero_nf: string | null }> = {};
          for (const nota of notasData.data) {
            if (nota.numero_pedido_marketplace) {
              pending[nota.numero_pedido_marketplace] = {
                id: nota.id,
                numero_nf: nota.numero_nf,
              };
            }
          }
          setPendingInvoices(pending);
        }
      } catch {
        // Ignorar erro ao buscar NF-e pendentes
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar pedidos do Mercado Livre.",
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const handleCheckShipment = useCallback(async (orderId: string) => {
    setCheckingShipment(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/mercado-livre/orders/${orderId}/shipment-status`, {
        headers: authHeaders,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Erro ao consultar shipment");
      }
      setShipmentResults((prev) => ({
        ...prev,
        [orderId]: data.data,
      }));
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : "Erro ao verificar envio.",
        type: "error",
      });
    } finally {
      setCheckingShipment(null);
    }
  }, [authHeaders]);

  const handleSendInvoice = useCallback(async (orderId: string) => {
    setSendingInvoice(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/mercado-livre/orders/${orderId}/send-invoice`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Erro ao enviar NF-e");
      }
      setSentInvoices((prev) => new Set(prev).add(orderId));
      setPendingInvoices((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setToast({
        message: `NF-e enviada com sucesso ao Mercado Livre!`,
        type: "success",
      });
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : "Erro ao enviar NF-e.",
        type: "error",
      });
    } finally {
      setSendingInvoice(null);
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
      result = result.filter((o) => o.status_venda === statusFilter);
    }

    if (marketplaceFilter !== "todos") {
      result = result.filter((o) => o.marketplace === marketplaceFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.id_bling?.toLowerCase().includes(term) ||
          o.nome_cliente?.toLowerCase().includes(term) ||
          o.codigo_curto?.toLowerCase().includes(term) ||
          o.numero_loja?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [orders, statusFilter, marketplaceFilter, searchTerm]);

  const totalValue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + Number(o.total_venda || 0), 0),
    [filteredOrders],
  );

  const paidOrders = useMemo(
    () => filteredOrders.filter((o) => o.status_venda === "paid" || o.status_venda === "confirmed"),
    [filteredOrders],
  );

  const shippedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status_venda === "shipped" || o.status_venda === "delivered"),
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
                Pedidos Marketplace
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Visualize os pedidos sincronizados via Bling, filtrados por marketplace. Use "Verificar Envio" para consultar shipments no Mercado Livre.
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
        <div className="relative z-10 p-5">
          {/* Barra de pesquisa */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID do pedido, nome do cliente, número da loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
            />
          </div>

          {/* Linha divisória */}
          <div className="mb-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Filtros */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {/* Status do pedido */}
            <div className="flex-1">
              <p className="mb-2.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">Status do pedido</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "todos", label: "Todos", color: "slate" },
                  { key: "confirmed", label: "Confirmados", color: "blue" },
                  { key: "paid", label: "Pagos", color: "emerald" },
                  { key: "shipped", label: "Enviados", color: "indigo" },
                  { key: "delivered", label: "Entregues", color: "green" },
                  { key: "cancelled", label: "Cancelados", color: "red" },
                ].map((f) => {
                  const isActive = statusFilter === f.key;
                  const colorMap: Record<string, string> = {
                    slate: isActive ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    blue: isActive ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                    emerald: isActive ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    indigo: isActive ? "bg-indigo-600 text-white shadow-sm" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                    green: isActive ? "bg-green-600 text-white shadow-sm" : "bg-green-50 text-green-700 hover:bg-green-100",
                    red: isActive ? "bg-red-600 text-white shadow-sm" : "bg-red-50 text-red-700 hover:bg-red-100",
                  };
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStatusFilter(f.key)}
                      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${colorMap[f.color]}`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separador vertical */}
            <div className="hidden h-auto w-px bg-slate-200 lg:block" />

            {/* Canal de venda */}
            <div className="flex-1">
              <p className="mb-2.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">Canal de venda</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "todos", label: "Todos", color: "slate" },
                  { key: "mercado_livre", label: "Mercado Livre", color: "yellow" },
                  { key: "shopee", label: "Shopee", color: "orange" },
                  { key: "AMAZON", label: "Amazon", color: "amber" },
                  { key: "MAGAZINE LUIZA", label: "Magalu", color: "sky" },
                  { key: "LOJA VIRTUAL", label: "Loja Virtual", color: "violet" },
                  { key: "PARTICULAR", label: "Particular", color: "stone" },
                ].map((f) => {
                  const isActive = marketplaceFilter === f.key;
                  const colorMap: Record<string, string> = {
                    slate: isActive ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    yellow: isActive ? "bg-yellow-500 text-white shadow-sm" : "bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
                    orange: isActive ? "bg-orange-500 text-white shadow-sm" : "bg-orange-50 text-orange-700 hover:bg-orange-100",
                    amber: isActive ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 text-amber-800 hover:bg-amber-100",
                    sky: isActive ? "bg-sky-600 text-white shadow-sm" : "bg-sky-50 text-sky-700 hover:bg-sky-100",
                    violet: isActive ? "bg-violet-600 text-white shadow-sm" : "bg-violet-50 text-violet-700 hover:bg-violet-100",
                    stone: isActive ? "bg-stone-600 text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                  };
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setMarketplaceFilter(f.key)}
                      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${colorMap[f.color]}`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{filteredOrders.length}</span> de {orders.length} pedidos
            </p>
            {(statusFilter !== "todos" || marketplaceFilter !== "todos" || searchTerm.trim()) && (
              <button
                type="button"
                onClick={() => { setStatusFilter("todos"); setMarketplaceFilter("todos"); setSearchTerm(""); }}
                className="text-xs font-semibold text-yellow-700 hover:text-yellow-900 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white/95 px-6 py-12 shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-yellow-400/20 border-t-yellow-500" />
          <p className="mt-4 text-sm font-semibold text-slate-700">Buscando pedidos</p>
          <p className="mt-1 text-xs text-slate-400">Aguarde enquanto consultamos o banco de dados...</p>
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                        ML #{order.id_bling}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${STATUS_COLORS[order.status_venda] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {STATUS_LABELS[order.status_venda] || order.status_venda}
                      </span>
                      {order.numero_pedido_cigam && (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[0.62rem] font-bold text-blue-700">
                          CIGAM #{order.numero_pedido_cigam}
                        </span>
                      )}
                      {order.status_nfe && order.status_nfe !== 'pendente' && (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${
                          order.status_nfe === 'enviada' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                          order.status_nfe === 'faturada' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                          'border-slate-200 bg-slate-50 text-slate-600'
                        }`}>
                          NF-e: {order.status_nfe === 'enviada' ? 'Enviada' : order.status_nfe === 'faturada' ? 'Faturada' : order.status_nfe}
                        </span>
                      )}
                      {order.marketplace && (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${
                          order.marketplace === 'mercado_livre' ? 'border-yellow-300 bg-yellow-50 text-yellow-800' :
                          order.marketplace === 'shopee' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                          order.marketplace === 'AMAZON' ? 'border-amber-300 bg-amber-50 text-amber-800' :
                          order.marketplace === 'MAGAZINE LUIZA' ? 'border-blue-300 bg-blue-50 text-blue-700' :
                          'border-slate-300 bg-slate-50 text-slate-600'
                        }`}>
                          {order.marketplace === 'mercado_livre' ? 'Mercado Livre' :
                           order.marketplace === 'shopee' ? 'Shopee' :
                           order.marketplace}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[0.62rem] text-slate-400">
                      {formatDate(order.data_pedido)}
                    </span>
                  </div>

                  {/* Comprador */}
                  <div className="mt-3 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">
                      {order.nome_cliente || "Comprador desconhecido"}
                    </span>
                    {order.documento_cliente && (
                      <span className="text-xs text-slate-500">
                        ({order.documento_cliente})
                      </span>
                    )}
                  </div>

                  {/* Info do pedido */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.62rem] text-slate-500">
                    <span>Pedido #{order.codigo_curto}</span>
                    {order.numero_loja && <span>Loja: {order.numero_loja}</span>}
                    <span>{order.quantidade_itens} {order.quantidade_itens === 1 ? 'item' : 'itens'}</span>
                    {order.nome_transportadora && <span>Transp: {order.nome_transportadora}</span>}
                    {order.unidade_negocio && (
                      <span className="inline-flex items-center rounded-full bg-[#00B0F1]/10 px-1.5 py-0.5 text-[0.58rem] font-bold text-[#008FC7]">
                        {order.unidade_negocio}
                      </span>
                    )}
                  </div>

                  {/* Envio - Verificar shipment via ML */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Verificar envio no ML</p>
                          <p className="text-[0.62rem] text-slate-500">
                            {order.shipping_id
                              ? `Shipment #${order.shipping_id} — Pedido #${order.numero_loja}`
                              : `Consulta o shipment do pedido #${order.numero_loja} no Mercado Livre`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={checkingShipment === order.numero_loja}
                        onClick={() => handleCheckShipment(order.numero_loja)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {checkingShipment === order.numero_loja ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Search className="h-3.5 w-3.5" />
                            Verificar Envio
                          </>
                        )}
                      </button>
                    </div>

                    {/* Resultado da verificação */}
                    {shipmentResults[order.numero_loja] && (
                      <>
                        {/* Sem shipment ID */}
                        {shipmentResults[order.numero_loja].shipmentId === null && (
                          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-700">ID de envio não informado</p>
                              <p className="text-[0.62rem] text-slate-500">O Mercado Livre ainda não atribuiu um shipment a este pedido.</p>
                            </div>
                          </div>
                        )}

                        {/* Com shipment ID - status do XML */}
                        {shipmentResults[order.numero_loja].shipmentId !== null && (
                          <div className={`mt-2.5 flex items-center gap-2 rounded-lg border px-3 py-2 ${
                            shipmentResults[order.numero_loja].readyForInvoice
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-amber-200 bg-amber-50"
                          }`}>
                            {shipmentResults[order.numero_loja].readyForInvoice ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                <div>
                                  <p className="text-xs font-bold text-emerald-800">XML liberado para envio</p>
                                  <p className="text-[0.62rem] text-emerald-600">Shipment #{shipmentResults[order.numero_loja].shipmentId} — Status: ready_to_ship / invoice_pending</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                                <div>
                                  <p className="text-xs font-bold text-amber-800">XML não liberado</p>
                                  <p className="text-[0.62rem] text-amber-600">
                                    Shipment #{shipmentResults[order.numero_loja].shipmentId} — Status: {shipmentResults[order.numero_loja].status}
                                    {shipmentResults[order.numero_loja].substatus && ` / ${shipmentResults[order.numero_loja].substatus}`}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Timeline do shipment */}
                        {shipmentResults[order.numero_loja].shipmentId !== null && (
                          <div className="mt-2.5">
                            {shipmentResults[order.numero_loja].substatusHistory.length > 0 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setExpandedShipment(
                                    expandedShipment === order.numero_loja ? null : order.numero_loja
                                  )}
                                  className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                  {expandedShipment === order.numero_loja ? (
                                    <>
                                      <ChevronUp className="h-3 w-3" />
                                      Ocultar timeline
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3" />
                                      Ver timeline ({shipmentResults[order.numero_loja].substatusHistory.length} movimentações)
                                    </>
                                  )}
                                </button>

                                {expandedShipment === order.numero_loja && (
                                  <div className="mt-2 space-y-0">
                                    {shipmentResults[order.numero_loja].substatusHistory
                                      .slice()
                                      .reverse()
                                      .map((entry, idx, arr) => {
                                        const isLatest = idx === 0;
                                        const entryDate = new Date(entry.date);
                                        const formattedDate = entryDate.toLocaleString("pt-BR", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        });
                                        return (
                                          <div key={idx} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                                isLatest ? "bg-blue-500 ring-2 ring-blue-200" : "bg-slate-300"
                                              }`} />
                                              {idx < arr.length - 1 && (
                                                <div className="w-px flex-1 bg-slate-200" />
                                              )}
                                            </div>
                                            <div className={`pb-3 ${isLatest ? "" : "opacity-70"}`}>
                                              <p className={`text-[0.62rem] font-bold ${isLatest ? "text-blue-800" : "text-slate-700"}`}>
                                                {SUBSTATUS_LABELS[entry.substatus] || entry.substatus}
                                              </p>
                                              <p className="text-[0.58rem] text-slate-500">
                                                {formattedDate}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <p className="text-[0.62rem] text-slate-500">Nenhuma movimentação registrada neste envio.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* NF-e pendente */}
                  {(pendingInvoices[order.id_bling] || sentInvoices.has(order.id_bling)) && (
                    <div className={`mt-2.5 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                      sentInvoices.has(order.id_bling)
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-blue-200 bg-blue-50"
                    }`}>
                      <div className="flex items-center gap-2">
                        {sentInvoices.has(order.id_bling) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            <div>
                              <p className="text-xs font-bold text-emerald-800">NF-e enviada ao ML</p>
                              <p className="text-[0.62rem] text-emerald-600">XML enviado com sucesso</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                            <div>
                              <p className="text-xs font-bold text-blue-800">NF-e aguardando envio</p>
                              <p className="text-[0.62rem] text-blue-600">
                                XML do CIGAM vinculado
                                {pendingInvoices[order.id_bling]?.numero_nf && ` — NF ${pendingInvoices[order.id_bling].numero_nf}`}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      {!sentInvoices.has(order.id_bling) && (
                        <button
                          type="button"
                          disabled={sendingInvoice === order.id_bling}
                          onClick={() => handleSendInvoice(order.id_bling)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          {sendingInvoice === order.id_bling ? (
                            <>
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <FileText className="h-3.5 w-3.5" />
                              Enviar XML
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Totais */}
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {order.total_venda > 0 ? `Total: ${formatCurrency(order.total_venda)}` : "Sem valor"}
                      </span>
                      {order.desconto > 0 && (
                        <span className="text-[0.62rem] text-purple-600">
                          Desc: {formatCurrency(order.desconto)}
                        </span>
                      )}
                      {order.valor_frete > 0 && (
                        <span className="text-[0.62rem] text-slate-500">
                          Frete: {formatCurrency(order.valor_frete)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                      <p className="mt-1 text-lg font-bold text-yellow-700">{formatCurrency(order.total_venda)}</p>
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
