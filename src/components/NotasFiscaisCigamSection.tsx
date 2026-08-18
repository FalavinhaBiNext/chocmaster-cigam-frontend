import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  X,
  Download,
} from "lucide-react";

interface NotaFiscalCigam {
  id: string;
  numero_pedido_cigam: string;
  numero_pedido_marketplace: string | null;
  unidade_negocio: string | null;
  data_faturamento: string | null;
  numero_nf: string | null;
  serie_nf: string | null;
  chave_acesso: string | null;
  enviado_marketplace: boolean;
  xml_content: string;
  created_at: string;
  updated_at: string;
}

interface NotasFiscaisCigamSectionProps {
  API_BASE_URL: string;
  authHeaders: () => Record<string, string>;
}

export const NotasFiscaisCigamSection = ({
  API_BASE_URL,
  authHeaders,
}: NotasFiscaisCigamSectionProps) => {
  const [notas, setNotas] = useState<NotaFiscalCigam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<
    "todas" | "enviadas" | "pendentes"
  >("todas");
  const [busca, setBusca] = useState("");
  const [notaSelecionada, setNotaSelecionada] =
    useState<NotaFiscalCigam | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);

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

  const notasFiltradas = notas.filter((nota) => {
    const matchStatus =
      filtroStatus === "todas" ||
      (filtroStatus === "enviadas" && nota.enviado_marketplace) ||
      (filtroStatus === "pendentes" && !nota.enviado_marketplace);

    const matchBusca =
      busca === "" ||
      nota.numero_pedido_cigam.toLowerCase().includes(busca.toLowerCase()) ||
      nota.numero_nf?.toLowerCase().includes(busca.toLowerCase()) ||
      nota.chave_acesso?.toLowerCase().includes(busca.toLowerCase()) ||
      nota.numero_pedido_marketplace
        ?.toLowerCase()
        .includes(busca.toLowerCase());

    return matchStatus && matchBusca;
  });

  const totalEnviadas = notas.filter((n) => n.enviado_marketplace).length;
  const totalPendentes = notas.filter((n) => !n.enviado_marketplace).length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
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

      {/* Filtros e busca */}
      <div
        className="
          rounded-xl border border-slate-200/80
          bg-white p-4
          shadow-sm
        "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filtros de status */}
          <div className="flex gap-2">
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

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por pedido, NF ou chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="
                h-9 w-full rounded-lg border border-slate-200
                pl-9 pr-4 text-xs
                focus:border-[#00B0F1] focus:outline-none sm:w-64
              "
            />
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
              {busca
                ? "Nenhuma nota fiscal encontrada para esta busca."
                : "Nenhuma nota fiscal recebida do CIGAM."}
            </p>
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
                    NF-e
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Unidade
                  </th>
                  <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Data Faturamento
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
                        {nota.unidade_negocio || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {formatDate(nota.data_faturamento)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de visualização do XML */}
      {showXmlModal && notaSelecionada && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowXmlModal(false)}
        >
          <div
            className="
              relative max-h-[80vh] w-full max-w-4xl
              overflow-hidden rounded-2xl bg-white shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="overflow-y-auto p-6" style={{ maxHeight: "60vh" }}>
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

              {/* Conteúdo XML */}
              <div className="rounded-lg bg-slate-900 p-4">
                <pre className="overflow-x-auto text-xs text-green-400">
                  <code>{notaSelecionada.xml_content}</code>
                </pre>
              </div>
            </div>

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
        </div>
      )}
    </div>
  );
};
