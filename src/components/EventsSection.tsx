import React, { useState, useEffect } from 'react';
import { Activity, FileText, ShoppingBag, Truck, User, RefreshCw, ShieldAlert } from 'lucide-react';

interface EventItem {
  id: string;
  event: string;
  pedido_id: number;
  data_pedido: string;
  numero_pedido: number;
  numero_loja: string;
  total_pedido: number;
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

export const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected Event & Detail State
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, string>>({}); // id -> name
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const API_BASE_URL = 'https://chocmaster.falavinhanext.tec.br/api/v1';

  const fetchEventsAndProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events`).then(r => r.json()),
        fetch(`${API_BASE_URL}/produtos`).then(r => r.json())
      ]);

      if (eventsRes.success) {
        // Sort events by created_at descending
        const sorted = (eventsRes.data || []).sort(
          (a: EventItem, b: EventItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setEvents(sorted);
      } else {
        setError('Falha ao obter eventos.');
      }

      if (productsRes.success && productsRes.data) {
        const pMap: Record<string, string> = {};
        productsRes.data.forEach((p: ProductDetails) => {
          pMap[p.id] = p.nome;
        });
        setProductsMap(pMap);
      }
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar eventos do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndProducts();
  }, []);

  const handleSelectEvent = async (event: EventItem) => {
    setSelectedEvent(event);
    setOrderDetails(null);
    setOrderProducts([]);
    setLoadingDetail(true);
    setDetailError(null);

    try {
      // 1. Fetch Order Details by Bling ID
      const orderRes = await fetch(`${API_BASE_URL}/pedidos/bling/${event.pedido_id}`).then(r => r.json());
      
      if (orderRes.success && orderRes.data) {
        const order = orderRes.data as OrderDetail;
        setOrderDetails(order);

        // 2. Fetch Order Products using the local order UUID
        const productsRes = await fetch(`${API_BASE_URL}/pedido-produtos/pedido/${order.id}`).then(r => r.json());
        if (productsRes.success) {
          setOrderProducts(productsRes.data || []);
        }
      } else {
        setDetailError('Pedido não localizado no banco de dados local.');
      }
    } catch (err) {
      console.error(err);
      setDetailError('Erro ao buscar detalhes do pedido.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-slate-900/30 p-4 border border-slate-800/80 rounded-2xl">
        <div className="text-left">
          <h3 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>Eventos de Integração</span>
          </h3>
          <p className="text-xs text-slate-400">Linha do tempo de webhooks e criações de pedidos em tempo real</p>
        </div>
        <button
          onClick={fetchEventsAndProducts}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition duration-200 cursor-pointer"
          title="Recarregar eventos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Buscando histórico de eventos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 text-center text-red-400">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Events List Left Panel */}
          <div className="lg:col-span-1 bg-slate-850/40 border border-slate-800/80 rounded-2xl p-6 h-[600px] flex flex-col">
            <h4 className="text-sm font-bold text-slate-400 mb-4 text-left uppercase tracking-wider">Histórico de Eventos</h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => handleSelectEvent(evt)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition duration-200 ${
                    selectedEvent?.id === evt.id
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
                      {evt.event}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDate(evt.created_at)}</span>
                  </div>
                  <h5 className="font-semibold text-sm text-slate-200">Pedido #{evt.numero_pedido}</h5>
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                    <span>ID Bling: {evt.pedido_id}</span>
                    <span className="font-bold text-indigo-400">{formatCurrency(evt.total_pedido)}</span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-slate-500 text-sm py-12 text-center">Nenhum evento registrado no sistema.</p>
              )}
            </div>
          </div>

          {/* Details Right Panel */}
          <div className="lg:col-span-2 bg-slate-850/40 border border-slate-800/80 rounded-2xl p-6 h-[600px] flex flex-col justify-start overflow-y-auto">
            {selectedEvent ? (
              loadingDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm animate-pulse">Obtendo detalhes completos do pedido...</p>
                </div>
              ) : detailError ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <ShieldAlert className="w-12 h-12 text-amber-500/80 mb-2" />
                  <p className="text-sm font-semibold">{detailError}</p>
                  <p className="text-xs text-slate-500 max-w-xs text-center">
                    Este evento possui o ID de pedido Bling {selectedEvent.pedido_id}, mas o registro completo do pedido não foi sincronizado localmente.
                  </p>
                </div>
              ) : orderDetails ? (
                <div className="space-y-6 text-left">
                  {/* Detail Header */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] bg-indigo-950 border border-indigo-500/30 text-indigo-400 font-bold px-2.5 py-0.5 rounded-full">
                        Detalhes do Pedido
                      </span>
                      <h4 className="text-xl font-bold text-white mt-2">Pedido #{orderDetails.codigo_curto}</h4>
                      <p className="text-xs text-slate-400 mt-1">ID Bling: {orderDetails.id_bling} • Loja: {orderDetails.numero_loja}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Status Bling</span>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5 bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded-md text-center">
                        {orderDetails.status_venda}
                      </p>
                    </div>
                  </div>

                  {/* Customer & Carrier Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer info */}
                    <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Cliente</span>
                      </h5>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{orderDetails.nome_cliente}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">Doc: {orderDetails.documento_cliente}</p>
                      </div>
                    </div>

                    {/* Carrier Info */}
                    <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Transportadora</span>
                      </h5>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {orderDetails.nome_transportadora || 'Retirada / Sem Transportadora'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Código: {orderDetails.codigo_transportadora || 'N/A'}</p>
                        {orderDetails.codigo_rastreio && (
                          <p className="text-xs text-slate-400 mt-1 font-mono bg-slate-950/40 px-2 py-0.5 rounded border border-slate-805/30 inline-block">
                            Rastreio: {orderDetails.codigo_rastreio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Products List */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Produtos do Pedido ({orderProducts.length})</span>
                    </h5>
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="bg-slate-900/40 border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="py-2.5 px-4">Produto</th>
                            <th className="py-2.5 px-4 text-center">Qtd</th>
                            <th className="py-2.5 px-4 text-right">Unitário</th>
                            <th className="py-2.5 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
                          {orderProducts.map((p) => {
                            const pName = productsMap[p.id_produto] || 'Produto não cadastrado';
                            return (
                              <tr key={p.id} className="hover:bg-slate-900/20">
                                <td className="py-3 px-4 text-slate-200">
                                  <div className="font-medium">{pName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {p.id_produto}</div>
                                </td>
                                <td className="py-3 px-4 text-center text-slate-300 font-medium">{p.quantidade}</td>
                                <td className="py-3 px-4 text-right text-slate-400">{formatCurrency(p.preco)}</td>
                                <td className="py-3 px-4 text-right text-slate-200 font-semibold">{formatCurrency(p.total)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-xl flex flex-col space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Valor de Produtos:</span>
                      <span>{formatCurrency(Number(orderDetails.total_produtos))}</span>
                    </div>
                    {Number(orderDetails.desconto) > 0 && (
                      <div className="flex justify-between text-xs text-rose-400">
                        <span>Desconto:</span>
                        <span>-{formatCurrency(Number(orderDetails.desconto))}</span>
                      </div>
                    )}
                    {Number(orderDetails.valor_frete) > 0 && (
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Frete:</span>
                        <span>{formatCurrency(Number(orderDetails.valor_frete))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-2 text-white">
                      <span>Total Geral:</span>
                      <span className="text-indigo-400">{formatCurrency(Number(orderDetails.total_venda))}</span>
                    </div>
                  </div>

                </div>
              ) : null
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-slate-500">
                <FileText className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-sm font-medium">Nenhum evento selecionado</p>
                <p className="text-xs text-slate-600">Selecione um evento na barra lateral para ver o detalhamento do pedido</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
