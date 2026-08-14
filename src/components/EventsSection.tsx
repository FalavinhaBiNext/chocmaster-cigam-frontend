import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
} from "react";
import { createPortal } from "react-dom";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FileText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

interface EventItem {
  id: string;
  event: string;
  pedido_id: number;
  data_pedido: string;
  numero_pedido: number;
  numero_loja: string;
  total_pedido: number;
  cigam_sincronizado: boolean;
  cigam_pedido_id: string | null;
  created_at: string;
}

interface OrderDetail {
  id: string;
  id_bling: string;
  codigo_curto: string;
  numero_loja: string;
  data_pedido: string;
  total_produtos: number;
  total_venda: number;
  nome_cliente: string;
  documento_cliente: string;
  nome_transportadora: string;
  codigo_transportadora: string;
  codigo_rastreio: string;
  desconto: number;
  valor_frete: number;
  status_venda: string;
  unidade_negocio: string | null;
  data_prevista: string | null;
}

interface OrderProduct {
  id: string;
  id_produto: string;
  quantidade: number;
  preco: number;
  total: number;
}

interface ProductDetails {
  id: string;
  id_bling: string;
  nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL =
  "https://api-chocmaster.falavinhanext.tec.br/api/v1";

const parseApiResponse = async <T,>(
  response: Response,
): Promise<ApiResponse<T>> => {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `A requisição falhou com o status ${response.status}.`,
    );
  }

  if (!payload) {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  return payload;
};

export const EventsSection: FC<{ unidadeNegocioFilter?: string }> = ({ unidadeNegocioFilter }) => {
  const { token } = useAuth();

  const authHeaders = useMemo<HeadersInit>(
    () => ({
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    }),
    [token],
  );

  const [events, setEvents] = useState<EventItem[]>([]);
  const [pedidosMap, setPedidosMap] = useState<Record<string, { unidade_negocio: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] =
    useState<EventItem | null>(null);

  const [orderDetails, setOrderDetails] =
    useState<OrderDetail | null>(null);

  const [orderProducts, setOrderProducts] = useState<
    OrderProduct[]
  >([]);

  const [productsMap, setProductsMap] = useState<
    Record<string, string>
  >({});

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [detailError, setDetailError] = useState<
    string | null
  >(null);

  const [retryingEventId, setRetryingEventId] = useState<
    string | null
  >(null);

  const [deletingEventId, setDeletingEventId] = useState<
    string | null
  >(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [searchPedido, setSearchPedido] = useState("");

  const [filtroSincronizacao, setFiltroSincronizacao] = useState<
    "pendentes" | "sincronizados" | "todos"
  >("pendentes");

  const filteredEvents = useMemo(() => {
    let result = events;

    // Filtro por sincronização
    if (filtroSincronizacao === "pendentes") {
      result = result.filter((event) => !event.cigam_sincronizado);
    } else if (filtroSincronizacao === "sincronizados") {
      result = result.filter((event) => event.cigam_sincronizado);
    }

    if (unidadeNegocioFilter) {
      result = result.filter((event) => {
        const pedido = pedidosMap[String(event.pedido_id)];
        return pedido?.unidade_negocio === unidadeNegocioFilter;
      });
    }

    if (searchPedido.trim()) {
      const term = searchPedido.trim().toLowerCase();
      result = result.filter((event) =>
        String(event.pedido_id).includes(term) ||
        String(event.numero_pedido).toLowerCase().includes(term)
      );
    }

    return result;
  }, [events, pedidosMap, unidadeNegocioFilter, searchPedido, filtroSincronizacao]);

  const filteredSynchronizedEvents = useMemo(
    () =>
      filteredEvents.filter((event) => event.cigam_sincronizado)
        .length,
    [filteredEvents],
  );

  const filteredPendingEvents = useMemo(
    () => filteredEvents.length - filteredSynchronizedEvents,
    [filteredEvents.length, filteredSynchronizedEvents],
  );

  const filteredTotalValue = useMemo(
    () =>
      filteredEvents.reduce(
        (total, event) =>
          total + Number(event.total_pedido || 0),
        0,
      ),
    [filteredEvents],
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Data indisponível";
    }

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchEventsAndProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [eventsResponse, productsResponse, pedidosResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/events`, {
            headers: authHeaders,
          }),
          fetch(`${API_BASE_URL}/produtos`, {
            headers: authHeaders,
          }),
          fetch(`${API_BASE_URL}/pedidos`, {
            headers: authHeaders,
          }).catch(() => null),
        ]);

      const [eventsResult, productsResult] =
        await Promise.all([
          parseApiResponse<EventItem[]>(eventsResponse),
          parseApiResponse<ProductDetails[]>(
            productsResponse,
          ),
        ]);

      if (!eventsResult.success) {
        throw new Error(
          eventsResult.message ||
            "Falha ao obter os eventos.",
        );
      }

      const sortedEvents = [
        ...(eventsResult.data || []),
      ].sort(
        (eventA, eventB) =>
          new Date(eventB.created_at).getTime() -
          new Date(eventA.created_at).getTime(),
      );

      setEvents(sortedEvents);

      if (
        productsResult.success &&
        productsResult.data
      ) {
        const productNames: Record<string, string> = {};

        productsResult.data.forEach((product) => {
          productNames[product.id] = product.nome;
        });

        setProductsMap(productNames);
      }

      // Build pedidos map for unidade_negocio filtering
      if (pedidosResponse?.ok) {
        try {
          const pedidosResult = await parseApiResponse<any[]>(pedidosResponse);
          if (pedidosResult.success && pedidosResult.data) {
            const map: Record<string, { unidade_negocio: string | null }> = {};
            pedidosResult.data.forEach((p: any) => {
              map[p.id_bling] = { unidade_negocio: p.unidade_negocio || null };
            });
            setPedidosMap(map);
          }
        } catch {
          // Ignore pedidos fetch errors
        }
      }
    } catch (error: unknown) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Falha ao carregar eventos do servidor.",
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchEventsAndProducts();
  }, [fetchEventsAndProducts]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSelectEvent = async (
    event: EventItem,
  ) => {
    setSelectedEvent(event);
    setOrderDetails(null);
    setOrderProducts([]);
    setLoadingDetail(true);
    setDetailError(null);

    try {
      const orderResponse = await fetch(
        `${API_BASE_URL}/pedidos/bling/${event.pedido_id}`,
        {
          headers: authHeaders,
        },
      );

      const orderResult =
        await parseApiResponse<OrderDetail>(
          orderResponse,
        );

      if (!orderResult.success || !orderResult.data) {
        setDetailError(
          "Pedido não localizado no banco de dados local.",
        );
        return;
      }

      const order = orderResult.data;

      setOrderDetails(order);

      const productsResponse = await fetch(
        `${API_BASE_URL}/pedido-produtos/pedido/${order.id}`,
        {
          headers: authHeaders,
        },
      );

      const productsResult =
        await parseApiResponse<OrderProduct[]>(
          productsResponse,
        );

      if (productsResult.success) {
        setOrderProducts(productsResult.data || []);
      }
    } catch (error: unknown) {
      console.error(error);

      setDetailError(
        error instanceof Error
          ? error.message
          : "Erro ao buscar os detalhes do pedido.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRetryCigam = async (
    event: EventItem,
  ) => {
    setRetryingEventId(event.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${event.id}/retry-cigam`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );

      const result = await parseApiResponse<{ cigamPedidoId: string }>(
        response,
      );

      if (result.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? {
                  ...e,
                  cigam_sincronizado: true,
                  cigam_pedido_id: result.data?.cigamPedidoId || null,
                }
              : e,
          ),
        );

        if (selectedEvent?.id === event.id) {
          setSelectedEvent((prev) =>
            prev
              ? {
                  ...prev,
                  cigam_sincronizado: true,
                  cigam_pedido_id: result.data?.cigamPedidoId || null,
                }
              : prev,
          );
        }

        setToast({
          message: `Pedido #${event.numero_pedido} sincronizado com sucesso!`,
          type: "success",
        });
      }
    } catch (error: unknown) {
      console.error(error);

      setToast({
        message: `Falha ao sincronizar o pedido #${event.numero_pedido} no CIGAM.`,
        type: "error",
      });
    } finally {
      setRetryingEventId(null);
    }
  };

  const handleDeleteEvent = async (
    event: EventItem,
  ) => {
    setDeletingEventId(event.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${event.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      const result = await parseApiResponse<unknown>(
        response,
      );

      if (result.success) {
        setEvents((prev) =>
          prev.filter((e) => e.id !== event.id),
        );

        if (selectedEvent?.id === event.id) {
          setSelectedEvent(null);
          setOrderDetails(null);
          setOrderProducts([]);
        }
      }
    } catch (error: unknown) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Falha ao excluir o evento.",
      );
    } finally {
      setDeletingEventId(null);
    }
  };

  const panelClassName = `
    relative
    overflow-hidden
    rounded-[24px]
    border border-slate-200/80
    bg-white/[0.96]
    shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.05)]
  `;

  return (
    <div className="space-y-6">
      {/* Toast via Portal */}
      {createPortal(
        toast && (
          <div
            className={`
              fixed right-4 bottom-4 z-[9999]
              flex items-center gap-3
              rounded-xl border px-4 py-3
              shadow-lg transition-all duration-300
              ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }
            `}
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
        document.body
      )}

      {/* Cabeçalho */}
      <header
        className="
          relative
          overflow-hidden
          rounded-2xl
          border border-slate-200/80
          bg-gradient-to-br
          from-white
          to-slate-50
          px-5 py-5
          shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:px-6
        "
      >
        <div
          aria-hidden="true"
          className="
            absolute -right-16 -top-16
            h-40 w-40
            rounded-full
            bg-[#00B0F1]/10
            blur-3xl
          "
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-2xl
                border border-[#00B0F1]/20
                bg-[#00B0F1]/10
                text-[#008FC7]
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]
              "
            >
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Eventos de Integração
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Acompanhe os webhooks recebidos, os pedidos
                criados e o status de sincronização com o ERP
                CIGAM.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchEventsAndProducts}
            disabled={loading}
            title="Recarregar eventos"
            aria-label="Recarregar eventos"
            className="
              inline-flex h-10
              items-center justify-center gap-2
              rounded-xl
              border border-slate-300
              bg-white
              px-4
              text-xs font-semibold
              text-slate-700
              shadow-sm
              transition-all duration-200
              hover:-translate-y-0.5
              hover:border-[#00B0F1]/40
              hover:bg-[#00B0F1]/10
              hover:text-[#008FC7]
              focus:outline-none
              focus:ring-4
              focus:ring-[#00B0F1]/15
              disabled:cursor-not-allowed
              disabled:opacity-50
              disabled:hover:translate-y-0
            "
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />

            <span>
              {loading ? "Atualizando..." : "Atualizar eventos"}
            </span>
          </button>
        </div>
      </header>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          className="
            rounded-2xl
            border border-slate-200/80
            bg-white/95
            p-4
            shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                Total de eventos
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {filteredEvents.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B0F1]/10 text-[#008FC7]">
              <Activity className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article
          className="
            rounded-2xl
            border border-slate-200/80
            bg-white/95
            p-4
            shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                Sincronizados
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">
                {filteredSynchronizedEvents}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article
          className="
            rounded-2xl
            border border-slate-200/80
            bg-white/95
            p-4
            shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                Pendentes
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
                {filteredPendingEvents}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article
          className="
            rounded-2xl
            border border-slate-200/80
            bg-white/95
            p-4
            shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          "
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                Valor movimentado
              </p>

              <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900">
                {formatCurrency(filteredTotalValue)}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#E66F00]">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
        </article>
      </section>

      {loading ? (
        <div
          className="
            flex min-h-80
            flex-col items-center justify-center
            rounded-[24px]
            border border-slate-200/80
            bg-white/95
            px-6 py-12
            shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          "
        >
          <div
            className="
              h-10 w-10
              animate-spin
              rounded-full
              border-[3px]
              border-[#00B0F1]/20
              border-t-[#00B0F1]
            "
          />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Buscando histórico de eventos
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Aguarde enquanto consultamos os pedidos e produtos.
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="
            flex items-start gap-3
            rounded-2xl
            border border-red-200
            bg-red-50/95
            p-4
            text-red-800
            shadow-[0_12px_28px_-24px_rgba(127,29,29,0.60),inset_0_1px_1px_rgba(255,255,255,0.85)]
          "
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Não foi possível carregar os eventos
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Lista de eventos */}
          <section
            className={`${panelClassName} flex h-[700px] flex-col xl:col-span-2`}
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute inset-[5px]
                rounded-[18px]
                border border-white
              "
            />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="border-b border-slate-200/80 px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Histórico de eventos
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Ordenado do evento mais recente para o
                      mais antigo.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar pedido Bling..."
                        value={searchPedido}
                        onChange={(e) => setSearchPedido(e.target.value)}
                        className="
                          h-9
                          w-48
                          rounded-lg
                          border border-slate-200
                          bg-white
                          pl-9
                          pr-3
                          text-xs
                          text-slate-700
                          placeholder:text-slate-400
                          focus:border-[#00B0F1]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#00B0F1]/20
                        "
                      />
                    </div>

                    <span
                      className="
                        rounded-full
                        border border-[#00B0F1]/20
                        bg-[#00B0F1]/10
                        px-2.5 py-1
                        text-[0.65rem] font-bold
                        text-[#008FC7]
                      "
                    >
                      {filteredEvents.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtros de sincronização */}
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setFiltroSincronizacao("pendentes")}
                  className={`
                    inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                    ${
                      filtroSincronizacao === "pendentes"
                        ? "border border-amber-300 bg-amber-100 text-amber-700"
                        : "border border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }
                  `}
                >
                  <XCircle className="h-3 w-3" />
                  Pendentes
                  <span className="ml-0.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-800">
                    {events.filter((e) => !e.cigam_sincronizado).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroSincronizacao("sincronizados")}
                  className={`
                    inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                    ${
                      filtroSincronizacao === "sincronizados"
                        ? "border border-emerald-300 bg-emerald-100 text-emerald-700"
                        : "border border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }
                  `}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Sincronizados
                  <span className="ml-0.5 rounded-full bg-emerald-200 px-1.5 py-0.5 text-[0.6rem] font-bold text-emerald-800">
                    {events.filter((e) => e.cigam_sincronizado).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroSincronizacao("todos")}
                  className={`
                    inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                    ${
                      filtroSincronizacao === "todos"
                        ? "border border-slate-300 bg-slate-200 text-slate-700"
                        : "border border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }
                  `}
                >
                  Todos
                  <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[0.6rem] font-bold text-slate-700">
                    {events.length}
                  </span>
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 sm:p-5">
                {filteredEvents.map((event) => {
                  const isSelected =
                    selectedEvent?.id === event.id;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() =>
                        handleSelectEvent(event)
                      }
                      className={`
                        w-full
                        rounded-2xl
                        border
                        p-4
                        text-left
                        transition-all duration-200
                        ${
                          isSelected
                            ? `
                              border-[#00B0F1]/45
                              bg-[#00B0F1]/[0.07]
                              shadow-[0_12px_28px_-24px_rgba(0,176,241,0.75)]
                            `
                            : `
                              border-slate-200
                              bg-white
                              hover:-translate-y-0.5
                              hover:border-slate-300
                              hover:shadow-[0_12px_28px_-25px_rgba(2,6,23,0.50)]
                            `
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span
                            className="
                              inline-flex
                              max-w-48
                              truncate
                              rounded-full
                              border border-slate-200
                              bg-slate-50
                              px-2.5 py-1
                              text-[0.62rem] font-bold
                              uppercase tracking-[0.06em]
                              text-slate-600
                            "
                          >
                            {event.event}
                          </span>

                          {event.cigam_sincronizado ? (
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full
                                border border-emerald-200
                                bg-emerald-50
                                px-2.5 py-1
                                text-[0.62rem] font-bold
                                text-emerald-700
                              "
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              CIGAM sincronizado
                            </span>
                          ) : (
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full
                                border border-amber-200
                                bg-amber-50
                                px-2.5 py-1
                                text-[0.62rem] font-bold
                                text-amber-700
                              "
                            >
                              <XCircle className="h-3 w-3" />
                              CIGAM pendente
                            </span>
                          )}
                        </div>

                        <span className="shrink-0 text-[0.62rem] text-slate-400">
                          {formatDate(event.created_at)}
                        </span>
                      </div>

                      {!event.cigam_sincronizado && (
                        <div className="mt-3">
                          <button
                            type="button"
                            disabled={retryingEventId === event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryCigam(event);
                            }}
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-xl
                              border border-amber-300
                              bg-amber-50
                              px-3
                              py-1.5
                              text-[0.65rem]
                              font-semibold
                              text-amber-700
                              transition-all
                              duration-200
                              hover:border-amber-400
                              hover:bg-amber-100
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            <RotateCcw
                              className={`h-3 w-3 ${
                                retryingEventId === event.id
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            {retryingEventId === event.id
                              ? "Sincronizando..."
                              : "Tentar novamente"}
                          </button>
                        </div>
                      )}

                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={deletingEventId === event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event);
                          }}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-xl
                            border border-red-200
                            bg-red-50
                            px-3
                            py-1.5
                            text-[0.65rem]
                            font-semibold
                            text-red-600
                            transition-all
                            duration-200
                            hover:border-red-300
                            hover:bg-red-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <Trash2
                            className={`h-3 w-3 ${
                              deletingEventId === event.id
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {deletingEventId === event.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      </div>

                      <div className="mt-4">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                          Pedido #{event.numero_pedido}
                          {pedidosMap[String(event.pedido_id)]?.unidade_negocio && (
                            <span className="inline-flex items-center rounded-full bg-[#00B0F1]/10 px-2 py-0.5 text-[0.6rem] font-bold text-[#008FC7]">
                              {pedidosMap[String(event.pedido_id)].unidade_negocio}
                            </span>
                          )}
                        </p>

                        {event.cigam_pedido_id && (
                          <p className="mt-1 text-xs font-medium text-emerald-600">
                            CIGAM: {event.cigam_pedido_id}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          ID Bling: {event.pedido_id}
                          {event.numero_loja &&
                            ` • Loja: ${event.numero_loja}`}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">
                            Data do pedido
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {formatDate(event.data_pedido)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">
                            Valor
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#008FC7]">
                            {formatCurrency(
                              event.total_pedido,
                            )}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {events.length === 0 && (
                  <div className="flex min-h-64 flex-col items-center justify-center text-center">
                    <div
                      className="
                        flex h-14 w-14
                        items-center justify-center
                        rounded-2xl
                        border border-slate-200
                        bg-slate-50
                        text-slate-400
                      "
                    >
                      <Activity className="h-6 w-6" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      Nenhum evento registrado
                    </p>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                      Os novos webhooks e pedidos recebidos serão
                      exibidos neste histórico.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Detalhes do pedido */}
          <section
            className={`${panelClassName} flex min-h-[700px] flex-col xl:col-span-3`}
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute inset-[5px]
                rounded-[18px]
                border border-white
              "
            />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              {!selectedEvent ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div
                    className="
                      flex h-16 w-16
                      items-center justify-center
                      rounded-2xl
                      border border-slate-200
                      bg-slate-50
                      text-slate-300
                      shadow-sm
                    "
                  >
                    <FileText className="h-7 w-7" />
                  </div>

                  <p className="mt-5 text-sm font-semibold text-slate-700">
                    Nenhum evento selecionado
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Selecione um evento no histórico para consultar
                    os dados completos do pedido, cliente,
                    transportadora e produtos.
                  </p>
                </div>
              ) : loadingDetail ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
                  <div
                    className="
                      h-10 w-10
                      animate-spin
                      rounded-full
                      border-[3px]
                      border-[#00B0F1]/20
                      border-t-[#00B0F1]
                    "
                  />

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Obtendo detalhes do pedido
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Consultando pedido e produtos associados.
                  </p>
                </div>
              ) : detailError ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div
                    className="
                      flex h-16 w-16
                      items-center justify-center
                      rounded-2xl
                      border border-amber-200
                      bg-amber-50
                      text-amber-600
                    "
                  >
                    <ShieldAlert className="h-7 w-7" />
                  </div>

                  <p className="mt-5 text-sm font-semibold text-slate-800">
                    {detailError}
                  </p>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                    O evento possui o ID Bling{" "}
                    <strong className="text-slate-700">
                      {selectedEvent.pedido_id}
                    </strong>
                    , mas o registro completo do pedido pode ainda
                    não ter sido sincronizado localmente.
                  </p>
                </div>
              ) : orderDetails ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {/* Cabeçalho do pedido */}
                  <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="
                              rounded-full
                              border border-[#00B0F1]/20
                              bg-[#00B0F1]/10
                              px-2.5 py-1
                              text-[0.62rem] font-bold
                              uppercase tracking-[0.08em]
                              text-[#008FC7]
                            "
                          >
                            Detalhes do pedido
                          </span>

                          {selectedEvent.cigam_sincronizado ? (
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full
                                border border-emerald-200
                                bg-emerald-50
                                px-2.5 py-1
                                text-[0.62rem] font-bold
                                text-emerald-700
                              "
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Sincronizado
                            </span>
                          ) : (
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full
                                border border-amber-200
                                bg-amber-50
                                px-2.5 py-1
                                text-[0.62rem] font-bold
                                text-amber-700
                              "
                            >
                              <XCircle className="h-3 w-3" />
                              Pendente
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                          Pedido #{orderDetails.codigo_curto}
                          {orderDetails.unidade_negocio && (
                            <span className="inline-flex items-center rounded-full bg-[#00B0F1]/10 px-2 py-0.5 text-xs font-bold text-[#008FC7]">
                              {orderDetails.unidade_negocio}
                            </span>
                          )}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          ID Bling: {orderDetails.id_bling}
                          {orderDetails.numero_loja &&
                            ` • Loja: ${orderDetails.numero_loja}`}
                          {orderDetails.data_pedido &&
                            ` • ${formatDate(
                              orderDetails.data_pedido,
                            )}`}
                        </p>

                        {orderDetails.data_prevista && (
                          <p className="mt-0.5 text-xs font-medium text-[#008FC7]">
                            Previsão faturamento/etiqueta: {formatDate(orderDetails.data_prevista)}
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">
                          Status Bling
                        </p>

                        <span
                          className="
                            mt-2 inline-flex
                            rounded-xl
                            border border-emerald-200
                            bg-emerald-50
                            px-3 py-1.5
                            text-xs font-bold
                            text-emerald-700
                          "
                        >
                          {orderDetails.status_venda ||
                            "Não informado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-4 sm:p-6">
                    {/* Cliente e transportadora */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <article
                        className="
                          rounded-2xl
                          border border-slate-200
                          bg-slate-50/60
                          p-4
                          shadow-[inset_0_1px_1px_rgba(255,255,255,0.90)]
                        "
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B0F1]/10 text-[#008FC7]">
                            <User className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                              Cliente
                            </p>

                            <p className="text-sm font-semibold text-slate-900">
                              Dados do comprador
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {orderDetails.nome_cliente ||
                              "Cliente não informado"}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            Documento:{" "}
                            {orderDetails.documento_cliente ||
                              "Não informado"}
                          </p>
                        </div>
                      </article>

                      <article
                        className="
                          rounded-2xl
                          border border-slate-200
                          bg-slate-50/60
                          p-4
                          shadow-[inset_0_1px_1px_rgba(255,255,255,0.90)]
                        "
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#E66F00]">
                            <Truck className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                              Transportadora
                            </p>

                            <p className="text-sm font-semibold text-slate-900">
                              Dados da entrega
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {orderDetails.nome_transportadora ||
                              "Retirada ou sem transportadora"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Código:{" "}
                            {orderDetails.codigo_transportadora ||
                              "Não informado"}
                          </p>

                          {orderDetails.codigo_rastreio && (
                            <div
                              className="
                                mt-3
                                rounded-xl
                                border border-slate-200
                                bg-white
                                px-3 py-2
                              "
                            >
                              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">
                                Código de rastreio
                              </p>

                              <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-700">
                                {orderDetails.codigo_rastreio}
                              </p>
                            </div>
                          )}
                        </div>
                      </article>
                    </div>

                    {/* Produtos */}
                    <section>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-[#008FC7]" />

                          <h4 className="text-sm font-bold text-slate-900">
                            Produtos do pedido
                          </h4>
                        </div>

                        <span
                          className="
                            rounded-full
                            border border-slate-200
                            bg-slate-50
                            px-2.5 py-1
                            text-[0.65rem] font-semibold
                            text-slate-600
                          "
                        >
                          {orderProducts.length} itens
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[620px] text-left">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/90">
                              <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                                Produto
                              </th>

                              <th className="px-4 py-3 text-center text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                                Quantidade
                              </th>

                              <th className="px-4 py-3 text-right text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                                Unitário
                              </th>

                              <th className="px-4 py-3 text-right text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                                Total
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-200 bg-white">
                            {orderProducts.map((product) => {
                              const productName =
                                productsMap[
                                  product.id_produto
                                ] ||
                                "Produto não cadastrado";

                              return (
                                <tr
                                  key={product.id}
                                  className="transition-colors hover:bg-slate-50/80"
                                >
                                  <td className="px-4 py-3.5">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {productName}
                                    </p>

                                    <p className="mt-1 font-mono text-[0.65rem] text-slate-400">
                                      ID: {product.id_produto}
                                    </p>
                                  </td>

                                  <td className="px-4 py-3.5 text-center text-sm font-semibold text-slate-700">
                                    {product.quantidade}
                                  </td>

                                  <td className="px-4 py-3.5 text-right text-sm text-slate-600">
                                    {formatCurrency(
                                      product.preco,
                                    )}
                                  </td>

                                  <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-900">
                                    {formatCurrency(
                                      product.total,
                                    )}
                                  </td>
                                </tr>
                              );
                            })}

                            {orderProducts.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-10 text-center"
                                >
                                  <ShoppingBag className="mx-auto h-6 w-6 text-slate-300" />

                                  <p className="mt-3 text-sm font-semibold text-slate-600">
                                    Nenhum produto localizado
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    O pedido não possui produtos
                                    sincronizados no banco local.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* Resumo financeiro */}
                    <section className="flex justify-end">
                      <div
                        className="
                          w-full
                          rounded-2xl
                          border border-slate-200
                          bg-gradient-to-br
                          from-slate-50
                          to-white
                          p-4
                          shadow-[inset_0_1px_1px_rgba(255,255,255,0.90)]
                          sm:max-w-sm
                        "
                      >
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Resumo financeiro
                        </p>

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Produtos
                            </span>

                            <span className="font-semibold text-slate-700">
                              {formatCurrency(
                                Number(
                                  orderDetails.total_produtos,
                                ),
                              )}
                            </span>
                          </div>

                          {Number(orderDetails.desconto) > 0 && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-slate-500">
                                Desconto
                              </span>

                              <span className="font-semibold text-red-600">
                                -
                                {formatCurrency(
                                  Number(
                                    orderDetails.desconto,
                                  ),
                                )}
                              </span>
                            </div>
                          )}

                          {Number(orderDetails.valor_frete) >
                            0 && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-slate-500">
                                Frete
                              </span>

                              <span className="font-semibold text-slate-700">
                                {formatCurrency(
                                  Number(
                                    orderDetails.valor_frete,
                                  ),
                                )}
                              </span>
                            </div>
                          )}

                          {orderDetails.data_prevista && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-slate-500">
                                Data Prevista
                              </span>

                              <span className="font-semibold text-slate-700">
                                {new Date(orderDetails.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                            <span className="text-sm font-bold text-slate-900">
                              Total geral
                            </span>

                            <span className="text-lg font-bold text-[#008FC7]">
                              {formatCurrency(
                                Number(
                                  orderDetails.total_venda,
                                ),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};