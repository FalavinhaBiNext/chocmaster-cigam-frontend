import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  X,
  Download,
  Copy,
  Check,
  Calendar,
  Filter,
  Package,
  Trash2,
  AlertTriangle,
  Send,
  RefreshCw,
  Printer,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createLabelError, getFriendlyLabelErrorMessage } from "../utils/labelErrors";

interface NotaFiscalCigam {
  id: string;
  numero_pedido_cigam: string;
  numero_pedido_marketplace: string | null;
  marketplace: string | null;
  unidade_negocio: string | null;
  data_faturamento: string | null;
  numero_nf: string | null;
  serie_nf: string | null;
  chave_acesso: string | null;
  enviado_marketplace: boolean;
  xml_content: string;
  tray_invoice_id: string | null;
  tem_etiqueta_pdf: boolean;
  created_at: string;
  updated_at: string;
}

interface VerificacaoEnviosShopee {
  resumo: {
    verificados: number;
    jaOrganizados: number;
    organizadosAgora: number;
    falhas: number;
    ignorados: number;
    naoEncontrados: number;
  };
  itens: Array<{
    orderSn: string;
    status?: string;
    situacao: "ja_organizado" | "organizado_agora" | "falha" | "ignorado" | "nao_encontrado";
    erro?: string;
    numeroPedidoCigam: string | null;
  }>;
}

interface NotasFiscaisCigamSectionProps {
  API_BASE_URL: string;
  authHeaders: () => Record<string, string>;
}

const marketplaceLabels: Record<string, string> = {
  mercado_livre: "Mercado Livre",
  bling: "Bling",
  shopee: "Shopee",
  amazon: "Amazon",
  magalu: "Magazine Luiza",
  americanas: "Americanas",
  via_varejo: "Via Varejo",
};

export const NotasFiscaisCigamSection = ({
  API_BASE_URL,
  authHeaders,
}: NotasFiscaisCigamSectionProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [notas, setNotas] = useState<NotaFiscalCigam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<
    "todas" | "enviadas" | "pendentes"
  >("todas");
  const [filtroMarketplace, setFiltroMarketplace] = useState<string>("todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [notaSelecionada, setNotaSelecionada] =
    useState<NotaFiscalCigam | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notaParaExcluir, setNotaParaExcluir] =
    useState<NotaFiscalCigam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [printingLabelId, setPrintingLabelId] = useState<string | null>(null);
  const [notaParaImprimir, setNotaParaImprimir] =
    useState<NotaFiscalCigam | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [verificandoShopee, setVerificandoShopee] = useState(false);
  const [resultadoShopee, setResultadoShopee] = useState<VerificacaoEnviosShopee | null>(null);

  const fetchNotas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notas-fiscais-cigam`,
        { headers: authHeaders() },
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar notas fiscais.");
      }

      const data = await response.json();
      setNotas(data.data || []);
    } catch (error: unknown) {
      console.error(error);
      setError("Não foi possível carregar as notas fiscais do CIGAM.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, authHeaders]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleEnviarXml = async (nota: NotaFiscalCigam) => {
    setSendingId(nota.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notas-fiscais-cigam/${nota.id}/enviar-marketplace`,
        { method: "POST", headers: authHeaders() },
      );

      const data = await response.json().catch(() => null);

      if (!data?.success) {
        throw new Error(
          data?.message ||
          data?.error?.message ||
          "O XML ainda não pode ser enviado ao marketplace. Aguarde o marketplace liberar o envio.",
        );
      }

      setNotas((prev) =>
        prev.map((n) => (n.id === nota.id ? { ...n, enviado_marketplace: true } : n)),
      );
      setToast({
        message: data.message || "NF-e enviada com sucesso ao marketplace!",
        type: "success",
      });
    } catch (err: unknown) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : "O XML ainda não pode ser enviado ao marketplace. Aguarde o marketplace liberar o envio.",
        type: "error",
      });
    } finally {
      setSendingId(null);
    }
  };

  // Fallback: verifica na Shopee se o envio das NF-es já enviadas foi
  // organizado (ship_order) e organiza as que ainda estão pendentes.
  const handleVerificarEnviosShopee = async () => {
    setVerificandoShopee(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notas-fiscais-cigam/shopee/verificar-envios?dias=30`,
        { method: "POST", headers: authHeaders() },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Não foi possível verificar os envios na Shopee.");
      }

      setResultadoShopee(data.data);
      setToast({ message: data.message, type: data.data.resumo.falhas > 0 ? "error" : "success" });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        message: "Não foi possível verificar os envios na Shopee agora. Tente novamente em instantes.",
        type: "error",
      });
    } finally {
      setVerificandoShopee(false);
    }
  };

  const handleAtualizarTray = async (nota: NotaFiscalCigam) => {
    setUpdatingId(nota.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notas-fiscais-cigam/${nota.id}/atualizar-tray`,
        { method: "POST", headers: authHeaders() },
      );

      const data = await response.json().catch(() => null);

      if (!data?.success) {
        throw new Error(
          data?.message ||
          data?.error?.message ||
          "Não foi possível atualizar os dados fiscais na Tray.",
        );
      }

      setToast({
        message: data.message || "Dados fiscais atualizados com sucesso na Tray!",
        type: "success",
      });
    } catch (err: unknown) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : "Não foi possível atualizar os dados fiscais na Tray.",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrintLabel = async (
    nota: NotaFiscalCigam,
    modo: "cigam" | "marketplace" | "ambos",
  ) => {
    setPrintingLabelId(nota.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notas-fiscais-cigam/${nota.id}/etiqueta?modo=${modo}`,
        { headers: authHeaders() },
      );

      if (!response.ok) {
        throw await createLabelError(response);
      }

      // O backend decide o conteúdo conforme o modo: só o PDF do CIGAM, só a
      // etiqueta do marketplace, ou as duas juntas num único PDF.
      const disposition = response.headers.get("content-disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `etiqueta-${nota.numero_pedido_cigam}.pdf`;

      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast({ message: "Etiqueta baixada com sucesso!", type: "success" });
    } catch (err: unknown) {
      console.error(err);
      setToast({ message: getFriendlyLabelErrorMessage(err), type: "error" });
    } finally {
      setPrintingLabelId(null);
      setNotaParaImprimir(null);
    }
  };

  const handleDeleteNota = async () => {
    if (!notaParaExcluir) return;

    setDeletingId(notaParaExcluir.id);
    setDeleteError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notas-fiscais-cigam/${notaParaExcluir.id}`,
        { method: "DELETE", headers: authHeaders() },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Erro ao excluir a nota fiscal.");
      }

      setNotas((prev) => prev.filter((n) => n.id !== notaParaExcluir.id));
      setNotaParaExcluir(null);
    } catch (error: unknown) {
      setDeleteError(
        error instanceof Error ? error.message : "Erro ao excluir a nota fiscal.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Obter lista única de marketplaces presentes nos dados
  const marketplacesUnicos = Array.from(
    new Set(notas.map((n) => n.marketplace).filter(Boolean)),
  ) as string[];

  const notasFiltradas = notas.filter((nota) => {
    // Filtro por status
    const matchStatus =
      filtroStatus === "todas" ||
      (filtroStatus === "enviadas" && nota.enviado_marketplace) ||
      (filtroStatus === "pendentes" && !nota.enviado_marketplace);

    // Filtro por marketplace
    const matchMarketplace =
      filtroMarketplace === "todos" ||
      nota.marketplace === filtroMarketplace;

    // Filtro por data de recebimento (created_at)
    let matchData = true;
    if (filtroDataInicio || filtroDataFim) {
      const dataRecebimento = new Date(nota.created_at);
      if (filtroDataInicio) {
        const inicio = new Date(filtroDataInicio);
        inicio.setHours(0, 0, 0, 0);
        matchData = matchData && dataRecebimento >= inicio;
      }
      if (filtroDataFim) {
        const fim = new Date(filtroDataFim);
        fim.setHours(23, 59, 59, 999);
        matchData = matchData && dataRecebimento <= fim;
      }
    }

    // Filtro por busca
    const matchBusca =
      busca === "" ||
      nota.numero_pedido_cigam.toLowerCase().includes(busca.toLowerCase()) ||
      nota.numero_nf?.toLowerCase().includes(busca.toLowerCase()) ||
      nota.chave_acesso?.toLowerCase().includes(busca.toLowerCase()) ||
      nota.numero_pedido_marketplace
        ?.toLowerCase()
        .includes(busca.toLowerCase());

    return matchStatus && matchMarketplace && matchData && matchBusca;
  });

  const totalEnviadas = notas.filter((n) => n.enviado_marketplace).length;
  const totalPendentes = notas.filter((n) => !n.enviado_marketplace).length;

  const limparFiltros = () => {
    setFiltroStatus("todas");
    setFiltroMarketplace("todos");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setBusca("");
  };

  const temFiltrosAtivos =
    filtroStatus !== "todas" ||
    filtroMarketplace !== "todos" ||
    filtroDataInicio !== "" ||
    filtroDataFim !== "" ||
    busca !== "";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Para campos DATEONLY do banco (ex.: data_faturamento) — vêm como "aaaa-mm-dd",
  // sem horário. `new Date("aaaa-mm-dd")` interpreta como UTC meia-noite, e ao
  // converter pro fuso local (BR, UTC-3) isso "volta" pro dia anterior. Por isso
  // montamos a data como horário local explícito, sem exibir hora.
  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
  };

  const handleCopyXml = async (xml: string) => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  const highlightXml = (xml: string) => {
    // Escape HTML entities first
    const escaped = xml
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Apply syntax highlighting
    return escaped
      // Tags
      .replace(
        /(&lt;\/?)([\w:.-]+)/g,
        '$1<span class="text-blue-400">$2</span>',
      )
      // Attributes
      .replace(
        /\s([\w:.-]+)(=)(&quot;)(.*?)(&quot;)/g,
        ' <span class="text-yellow-300">$1</span>$2<span class="text-green-400">$3$4$5</span>',
      )
      // Comments
      .replace(
        /(&lt;!--[\s\S]*?--&gt;)/g,
        '<span class="text-gray-500 italic">$1</span>',
      )
      // XML declaration
      .replace(
        /(&lt;\?xml[\s\S]*?\?&gt;)/g,
        '<span class="text-purple-400">$1</span>',
      );
  };

  const handleDownloadXml = (nota: NotaFiscalCigam) => {
    const blob = new Blob([nota.xml_content], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NF_${nota.numero_nf || nota.numero_pedido_cigam}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className="
            flex items-center gap-3
            rounded-xl border border-slate-200/80
            bg-white p-4
            shadow-sm
          "
        >
          <div
            className="
              flex h-10 w-10 items-center justify-center
              rounded-lg bg-slate-100 text-slate-600
            "
          >
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{notas.length}</p>
            <p className="text-xs text-slate-500">Total de NF-e</p>
          </div>
        </div>

        <div
          className="
            flex items-center gap-3
            rounded-xl border border-green-200/80
            bg-green-50 p-4
            shadow-sm
          "
        >
          <div
            className="
              flex h-10 w-10 items-center justify-center
              rounded-lg bg-green-100 text-green-600
            "
          >
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{totalEnviadas}</p>
            <p className="text-xs text-green-600">Enviadas ao Marketplace</p>
          </div>
        </div>

        <div
          className="
            flex items-center gap-3
            rounded-xl border border-amber-200/80
            bg-amber-50 p-4
            shadow-sm
          "
        >
          <div
            className="
              flex h-10 w-10 items-center justify-center
              rounded-lg bg-amber-100 text-amber-600
            "
          >
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{totalPendentes}</p>
            <p className="text-xs text-amber-600">Pendentes</p>
          </div>
        </div>
      </div>

      {/* Envios Shopee — verifica/organiza o envio (ship_order) das NF-es já enviadas */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Envios Shopee</p>
            <p className="text-xs text-slate-500">
              Confere se o envio das NF-es Shopee dos últimos 30 dias foi organizado e organiza os pendentes,
              liberando a etiqueta.
            </p>
          </div>
          <button
            type="button"
            onClick={handleVerificarEnviosShopee}
            disabled={verificandoShopee}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Package className={`h-4 w-4 ${verificandoShopee ? "animate-pulse" : ""}`} />
            {verificandoShopee ? "Verificando na Shopee..." : "Verificar envios Shopee"}
          </button>
        </div>

        {resultadoShopee && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
              <li><span className="font-semibold text-slate-900">{resultadoShopee.resumo.verificados}</span> verificados</li>
              <li><span className="font-semibold text-emerald-700">{resultadoShopee.resumo.organizadosAgora}</span> organizados agora</li>
              <li><span className="font-semibold text-slate-900">{resultadoShopee.resumo.jaOrganizados}</span> já estavam organizados</li>
              <li><span className="font-semibold text-red-700">{resultadoShopee.resumo.falhas}</span> com falha</li>
              {resultadoShopee.resumo.ignorados > 0 && (
                <li><span className="font-semibold text-slate-900">{resultadoShopee.resumo.ignorados}</span> ignorados (cancelados ou fora de status)</li>
              )}
              {resultadoShopee.resumo.naoEncontrados > 0 && (
                <li><span className="font-semibold text-slate-900">{resultadoShopee.resumo.naoEncontrados}</span> não encontrados na Shopee</li>
              )}
            </ul>

            {resultadoShopee.itens.some((i) => i.situacao === "falha") && (
              <ul className="mt-3 space-y-1.5">
                {resultadoShopee.itens
                  .filter((i) => i.situacao === "falha")
                  .map((item) => (
                    <li key={item.orderSn} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">
                          Pedido {item.orderSn}
                          {item.numeroPedidoCigam && ` (CIGAM #${item.numeroPedidoCigam})`}:
                        </span>{" "}
                        {item.erro || "falha ao organizar o envio"}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Filtros e busca */}
      <div
        className="
          rounded-xl border border-slate-200/80
          bg-white p-4
          shadow-sm
        "
      >
        <div className="space-y-4">
          {/* Primeira linha: Status e Marketplace */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Filtros de status */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltroStatus("todas")}
                className={`
                  rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                  ${filtroStatus === "todas"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                Todas ({notas.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus("enviadas")}
                className={`
                  rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                  ${filtroStatus === "enviadas"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                  }
                `}
              >
                Enviadas ({totalEnviadas})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus("pendentes")}
                className={`
                  rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                  ${filtroStatus === "pendentes"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }
                `}
              >
                Pendentes ({totalPendentes})
              </button>
            </div>

            {/* Filtro de Marketplace */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              <select
                value={filtroMarketplace}
                onChange={(e) => setFiltroMarketplace(e.target.value)}
                className="
                  h-9 rounded-lg border border-slate-200
                  bg-white px-3 text-xs text-slate-700
                  focus:border-[#00B0F1] focus:outline-none
                "
              >
                <option value="todos">Todos os Marketplaces</option>
                {marketplacesUnicos.map((mp) => (
                  <option key={mp} value={mp}>
                    {marketplaceLabels[mp] || mp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segunda linha: Datas e Busca */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Filtros de data */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="
                    h-9 rounded-lg border border-slate-200
                    bg-white px-3 text-xs text-slate-700
                    focus:border-[#00B0F1] focus:outline-none
                  "
                  placeholder="Data início"
                />
                <span className="text-xs text-slate-400">até</span>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="
                    h-9 rounded-lg border border-slate-200
                    bg-white px-3 text-xs text-slate-700
                    focus:border-[#00B0F1] focus:outline-none
                  "
                  placeholder="Data fim"
                />
              </div>
            </div>

            {/* Campo de busca */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por pedido, NF ou chave..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="
                  h-9 w-full rounded-lg border border-slate-200
                  pl-9 pr-4 text-xs
                  focus:border-[#00B0F1] focus:outline-none
                "
              />
            </div>

            {/* Botão limpar filtros */}
            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="
                  flex h-9 items-center gap-1.5 rounded-lg
                  border border-slate-200 bg-white px-3
                  text-xs font-medium text-slate-600
                  transition-colors hover:bg-slate-50
                "
              >
                <Filter className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de notas fiscais */}
      <div
        className="
          overflow-hidden rounded-xl border border-slate-200/80
          bg-white shadow-sm
        "
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#00B0F1]/30 border-t-[#00B0F1]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : notasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              {temFiltrosAtivos
                ? "Nenhuma nota fiscal encontrada com os filtros selecionados."
                : "Nenhuma nota fiscal recebida do CIGAM."}
            </p>
            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="
                  mt-3 text-xs font-semibold text-[#00B0F1]
                  hover:text-[#008FC7]
                "
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Pedido CIGAM
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Pedido Marketplace
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Marketplace
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    NF-e
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Data Faturamento
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Recebido em
                  </th>
                  <th className="px-4 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notasFiltradas.map((nota) => (
                  <tr
                    key={nota.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {nota.numero_pedido_cigam}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {nota.numero_pedido_marketplace || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {nota.marketplace ? (
                        <span
                          className={`
                            inline-flex items-center rounded-full px-2 py-0.5
                            text-[0.65rem] font-semibold
                            ${nota.marketplace === "mercado_livre"
                              ? "bg-yellow-100 text-yellow-800"
                              : nota.marketplace === "bling"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                            }
                          `}
                        >
                          {marketplaceLabels[nota.marketplace] || nota.marketplace}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-slate-900">
                          {nota.numero_nf || "-"}
                        </span>
                        {nota.serie_nf && (
                          <span className="ml-1 text-xs text-slate-400">
                            Série {nota.serie_nf}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {formatDateOnly(nota.data_faturamento)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {formatDate(nota.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {nota.enviado_marketplace ? (
                          <span
                            className="
                              inline-flex items-center gap-1 rounded-full
                              bg-green-100 px-2.5 py-1
                              text-[0.65rem] font-semibold text-green-700
                            "
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Enviada
                          </span>
                        ) : (
                          <span
                            className="
                              inline-flex items-center gap-1 rounded-full
                              bg-amber-100 px-2.5 py-1
                              text-[0.65rem] font-semibold text-amber-700
                            "
                          >
                            <Clock className="h-3 w-3" />
                            Pendente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNotaSelecionada(nota);
                            setShowXmlModal(true);
                          }}
                          className="
                            rounded-lg p-1.5 text-slate-400
                            transition-colors hover:bg-slate-100 hover:text-slate-600
                          "
                          title="Visualizar XML"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadXml(nota)}
                          className="
                            rounded-lg p-1.5 text-slate-400
                            transition-colors hover:bg-slate-100 hover:text-slate-600
                          "
                          title="Download XML"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {!nota.enviado_marketplace && (
                          <button
                            type="button"
                            onClick={() => handleEnviarXml(nota)}
                            disabled={sendingId === nota.id}
                            className="
                              rounded-lg p-1.5 text-slate-400
                              transition-colors hover:bg-blue-50 hover:text-blue-600
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                            title="Enviar XML ao marketplace"
                          >
                            {sendingId === nota.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {nota.enviado_marketplace &&
                          nota.marketplace !== "mercado_livre" &&
                          nota.marketplace !== "shopee" && (
                            <button
                              type="button"
                              onClick={() => handleAtualizarTray(nota)}
                              disabled={updatingId === nota.id}
                              className="
                                rounded-lg p-1.5 text-slate-400
                                transition-colors hover:bg-amber-50 hover:text-amber-600
                                disabled:cursor-not-allowed disabled:opacity-50
                              "
                              title="Atualizar dados fiscais na Tray"
                            >
                              {updatingId === nota.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        {nota.enviado_marketplace && (
                          <button
                            type="button"
                            onClick={() => setNotaParaImprimir(nota)}
                            disabled={printingLabelId === nota.id}
                            className="
                              rounded-lg p-1.5 text-slate-400
                              transition-colors hover:bg-violet-50 hover:text-violet-600
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                            title="Imprimir etiqueta de envio"
                          >
                            {printingLabelId === nota.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setNotaParaExcluir(nota);
                            }}
                            className="
                              rounded-lg p-1.5 text-slate-400
                              transition-colors hover:bg-red-50 hover:text-red-600
                            "
                            title="Excluir NF-e"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de visualização do XML - renderizado via portal */}
      {showXmlModal &&
        notaSelecionada &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowXmlModal(false)}
          >
            <div
              className="
                relative flex max-h-[90vh] w-full max-w-5xl
                flex-col overflow-hidden rounded-2xl bg-white shadow-2xl
                animate-scaleIn
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    XML da NF-e
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pedido: {notaSelecionada.numero_pedido_cigam} | NF:{" "}
                    {notaSelecionada.numero_nf || "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="
                    rounded-lg p-2 text-slate-400
                    transition-colors hover:bg-slate-100 hover:text-slate-600
                  "
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Informações da nota */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase text-slate-400">
                      Chave de Acesso
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-700">
                      {notaSelecionada.chave_acesso || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase text-slate-400">
                      Unidade de Negócio
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      {notaSelecionada.unidade_negocio || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase text-slate-400">
                      Data Faturamento
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      {formatDate(notaSelecionada.data_faturamento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase text-slate-400">
                      Status
                    </p>
                    <p className="mt-1">
                      {notaSelecionada.enviado_marketplace ? (
                        <span className="text-xs font-semibold text-green-600">
                          Enviada ao Marketplace
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600">
                          Pendente de Envio
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Conteúdo XML com syntax highlighting */}
                <div className="relative rounded-lg bg-slate-950 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[0.6rem] font-semibold uppercase text-slate-500">
                      Conteúdo XML
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyXml(notaSelecionada.xml_content)
                      }
                      className="
                        flex items-center gap-1.5 rounded-md
                        bg-slate-800 px-2.5 py-1 text-[0.65rem]
                        font-medium text-slate-400
                        transition-colors hover:bg-slate-700 hover:text-slate-200
                      "
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-green-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 scrollbar-dark">
                    <code
                      className="text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: highlightXml(notaSelecionada.xml_content),
                      }}
                    />
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => handleDownloadXml(notaSelecionada)}
                  className="
                    flex items-center gap-2 rounded-lg
                    bg-[#00B0F1] px-4 py-2
                    text-sm font-semibold text-white
                    hover:bg-[#008FC7]
                  "
                >
                  <Download className="h-4 w-4" />
                  Download XML
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="
                    rounded-lg border border-slate-200 bg-white
                    px-4 py-2 text-sm font-semibold text-slate-600
                    hover:bg-slate-50
                  "
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de escolha do tipo de etiqueta - renderizado via portal */}
      {notaParaImprimir &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => {
              if (printingLabelId === notaParaImprimir.id) return;
              setNotaParaImprimir(null);
            }}
          >
            <div
              className="
                relative w-full max-w-md rounded-2xl bg-white
                p-6 shadow-2xl animate-scaleIn
              "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                  <Printer className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Imprimir etiqueta
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Pedido{" "}
                    <span className="font-semibold text-slate-700">
                      {notaParaImprimir.numero_pedido_cigam}
                    </span>
                    . Escolha o que deseja imprimir:
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintLabel(notaParaImprimir, "cigam")}
                  disabled={printingLabelId === notaParaImprimir.id}
                  className="
                    flex items-center justify-between rounded-lg
                    border border-slate-200 px-4 py-3
                    text-left text-sm font-semibold text-slate-700
                    transition-colors hover:border-violet-300 hover:bg-violet-50
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Imprimir etiqueta CIGAM
                  <FileText className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintLabel(notaParaImprimir, "marketplace")}
                  disabled={printingLabelId === notaParaImprimir.id}
                  className="
                    flex items-center justify-between rounded-lg
                    border border-slate-200 px-4 py-3
                    text-left text-sm font-semibold text-slate-700
                    transition-colors hover:border-violet-300 hover:bg-violet-50
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Imprimir Etiqueta Marketplace
                  <Package className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintLabel(notaParaImprimir, "ambos")}
                  disabled={printingLabelId === notaParaImprimir.id}
                  className="
                    flex items-center justify-between rounded-lg
                    border border-violet-200 bg-violet-50 px-4 py-3
                    text-left text-sm font-semibold text-violet-700
                    transition-colors hover:bg-violet-100
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  {printingLabelId === notaParaImprimir.id
                    ? "Gerando..."
                    : "Imprimir as Duas Opções"}
                  <Printer className="h-4 w-4 text-violet-500" />
                </button>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotaParaImprimir(null)}
                  disabled={printingLabelId === notaParaImprimir.id}
                  className="
                    rounded-lg border border-slate-200 bg-white
                    px-4 py-2 text-sm font-semibold text-slate-600
                    hover:bg-slate-50
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de confirmação de exclusão - renderizado via portal */}
      {notaParaExcluir &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => {
              if (deletingId) return;
              setNotaParaExcluir(null);
            }}
          >
            <div
              className="
                relative w-full max-w-md rounded-2xl bg-white
                p-6 shadow-2xl animate-scaleIn
              "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Excluir nota fiscal
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Tem certeza que deseja excluir a NF-e do pedido{" "}
                    <span className="font-semibold text-slate-700">
                      {notaParaExcluir.numero_pedido_cigam}
                    </span>
                    {notaParaExcluir.numero_nf && (
                      <>
                        {" "}
                        (nota{" "}
                        <span className="font-semibold text-slate-700">
                          {notaParaExcluir.numero_nf}
                        </span>
                        )
                      </>
                    )}
                    ? Essa ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">{deleteError}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNotaParaExcluir(null)}
                  disabled={!!deletingId}
                  className="
                    rounded-lg border border-slate-200 bg-white
                    px-4 py-2 text-sm font-semibold text-slate-600
                    hover:bg-slate-50
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteNota}
                  disabled={!!deletingId}
                  className="
                    flex items-center gap-2 rounded-lg
                    bg-red-600 px-4 py-2
                    text-sm font-semibold text-white
                    hover:bg-red-700
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Toast de envio de XML - renderizado via portal */}
      {toast &&
        createPortal(
          <div className="fixed right-4 top-4 z-[100] w-full max-w-sm animate-slideIn">
            <div
              className={`
                relative overflow-hidden rounded-2xl border bg-white p-4
                shadow-[0_20px_60px_-15px_rgba(2,6,23,0.45)]
                ${toast.type === "success" ? "border-emerald-200" : "border-red-200"}
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border
                    ${toast.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-red-200 bg-red-50 text-red-600"
                    }
                  `}
                >
                  {toast.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-700">
                  {toast.message}
                </p>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
