import { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { DeParaSection } from "./components/DeParaSection";
import { EventsSection } from "./components/EventsSection";
import { ConfiguracoesSection } from "./components/ConfiguracoesSection";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuth } from "./contexts/AuthContext";
import {
  Users,
  ShoppingBag,
  CreditCard,
  Truck,
  RefreshCw,
  CheckCircle2,
  Activity,
  Terminal,
  X,
  MoonIcon,
  Settings,
  LogOut,
} from "lucide-react";

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

type TabType =
  | "clientes"
  | "produtos"
  | "formas_pagamento"
  | "transportadoras"
  | "eventos"
  | "configuracoes";

interface BlingItem {
  id: string;
  name: string;
  codigo?: string;
  temVariacoes?: boolean;
  id_produto?: string;
  preco?: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  descricaoCurta?: string;
  unidade?: string;
  tipoProduto?: string;
  condicao?: number;
  marca?: string;
  categoria_id?: number;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  fornecedor_codigo?: string;
  fornecedor_precoCusto?: number;
  ncm?: string;
  quantidade_estoque?: number;
  ativo?: boolean;
  [key: string]: unknown;
}

interface CigamItem {
  id: string;
  name: string;
  extra?: string;
  [key: string]: unknown;
}

interface Mapping {
  id_bling: string;
  id_cigam: string;
  nome: string;
}

interface MappingStatus {
  produtos: Mapping[];
  clientes: Mapping[];
  formas_pagamento: Mapping[];
  transportadoras: Mapping[];
}

export default function App() {
  const { user, token, logout } = useAuth();

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [activeTab, setActiveTab] = useState<TabType>("clientes");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    percent: 0,
    completed: 0,
    total: 0,
    erros: 0,
    tempoDecorrido: "",
    tempoEstimado: "",
  });

  const [cigamUsers, setCigamUsers] = useState<any[]>([]);
  const [activeEnv, setActiveEnv] = useState<string>("homologacao");

  // Bling Lists
  const [blingClientes, setBlingClientes] = useState<BlingItem[]>([]);
  const [blingProdutos, setBlingProdutos] = useState<BlingItem[]>([]);
  const [blingFormasPagamento, setBlingFormasPagamento] = useState<BlingItem[]>(
    [],
  );
  const [blingTransportadoras, setBlingTransportadoras] = useState<BlingItem[]>(
    [],
  );

  // CIGAM Lists
  const [cigamClientes, setCigamClientes] = useState<CigamItem[]>([]);
  const [cigamProdutos, setCigamProdutos] = useState<CigamItem[]>([]);
  const [cigamFormasPagamento, setCigamFormasPagamento] = useState<CigamItem[]>(
    [],
  );
  const [cigamTransportadoras, setCigamTransportadoras] = useState<CigamItem[]>(
    [],
  );

  // De-Para Mappings
  const [mappings, setMappings] = useState<MappingStatus>({
    produtos: [],
    clientes: [],
    formas_pagamento: [],
    transportadoras: [],
  });

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const [
        resBlingCli,
        resBlingProd,
        resBlingPay,
        resBlingTrans,
        resCigamCli,
        resCigamProd,
        resCigamPay,
        resCigamTrans,
        resMapCli,
        resMapProd,
        resMapPay,
        resMapTrans,
        resCigamUsers,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/clientes`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/produtos`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/formas-pagamento`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/transportadoras`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/clientes-cigam`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/produtos-cigam`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/formas-pagamento-cigam`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/transportadoras-cigam`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/depara/clientes`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/depara/produtos`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/depara/formas_pagamento`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/depara/transportadoras`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/cigam/usuarios/find-all`, { headers: authHeaders() }).then((r) => r.json()),
      ]);

      setBlingClientes(
        (resBlingCli.data || []).map((c: any) => ({
          id: c.id_bling,
          name: c.nome,
          extra: c.documento || undefined,
        })),
      );
      setBlingProdutos(
        (resBlingProd.data || []).map((p: any) => ({
          id: p.id_bling,
          name: p.nome,
          codigo: p.codigo,
          temVariacoes: p.temVariacoes,
          id_produto: p.id_produto,
          preco: p.preco,
          tipo: p.tipo,
          situacao: p.situacao,
          formato: p.formato,
          descricaoCurta: p.descricaoCurta,
          unidade: p.unidade,
          tipoProduto: p.tipoProduto,
          condicao: p.condicao,
          marca: p.marca,
          categoria_id: p.categoria_id,
          fornecedor_id: p.fornecedor_id,
          fornecedor_nome: p.fornecedor_nome,
          fornecedor_codigo: p.fornecedor_codigo,
          fornecedor_precoCusto: p.fornecedor_precoCusto,
          ncm: p.ncm,
          quantidade_estoque: p.quantidade_estoque,
          ativo: p.ativo,
        })),
      );
      setBlingFormasPagamento(
        (resBlingPay.data || []).map((f: any) => ({
          id: f.id_bling,
          name: f.descricao || f.nome,
        })),
      );
      setBlingTransportadoras(
        (resBlingTrans.data || []).map((t: any) => ({
          id: t.id_bling,
          name: t.nome || t.fantasia,
        })),
      );

      setCigamClientes(
        (resCigamCli.data || []).map((c: any) => ({
          id: c.codigo_cigam || c.id_cigam || c.id,
          name: c.nome || c.nome_completo || c.NomeCompleto,
          extra: c.documento || undefined,
        })),
      );
      setCigamProdutos(
        (resCigamProd.data || []).map((p: any) => ({
          id: p.codigo_cigam || p.id_cigam || p.id,
          name: p.nome,
          codigo: p.codigo,
          temVariacoes: p.temVariacoes,
          id_produto: p.id_produto,
          preco: p.preco,
          tipo: p.tipo,
          situacao: p.situacao,
          formato: p.formato,
          descricaoCurta: p.descricaoCurta,
          unidade: p.unidade,
          tipoProduto: p.tipoProduto,
          condicao: p.condicao,
          marca: p.marca,
          categoria_id: p.categoria_id,
          fornecedor_id: p.fornecedor_id,
          fornecedor_nome: p.fornecedor_nome,
          fornecedor_codigo: p.fornecedor_codigo,
          fornecedor_precoCusto: p.fornecedor_precoCusto,
          ncm: p.ncm,
          quantidade_estoque: p.quantidade_estoque,
          ativo: p.ativo,
        })),
      );
      setCigamFormasPagamento(
        (resCigamPay.data || []).map((f: any) => ({
          id: f.codigo_cigam || f.id_cigam || f.id,
          name: f.descricao,
        })),
      );
      setCigamTransportadoras(
        (resCigamTrans.data || []).map((t: any) => ({
          id: t.codigo_cigam || t.id_cigam || t.id,
          name: t.nome || t.fantasia,
        })),
      );

      setMappings({
        produtos: resMapProd.data || [],
        clientes: resMapCli.data || [],
        formas_pagamento: resMapPay.data || [],
        transportadoras: resMapTrans.data || [],
      });

      const users = resCigamUsers.data || [];
      setCigamUsers(users);
      const activeUser = users.find((u: any) => u.ativo);
      if (activeUser) {
        setActiveEnv(activeUser.ambiente.toLowerCase());
      }
    } catch (err: any) {
      console.error(err);
      setError(
        "Falha ao se conectar com o servidor backend Chocmaster na porta 3333.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectEnvironment = async (env: string) => {
    setError(null);
    try {
      const user = cigamUsers.find((u) => u.ambiente.toLowerCase() === env.toLowerCase());
      if (!user) {
        setError(
          `Nenhum usuário CIGAM configurado para o ambiente "${
            env === "producao" ? "Produção" : "Homologação"
          }". Por favor, configure-o na aba de Configurações.`
        );
        setActiveTab("configuracoes");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/cigam/usuarios/alter-ativo/${user.id}`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao ativar o ambiente no servidor.");
      }

      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao tentar alterar o ambiente ativo.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveMapping = async (
    idBling: string,
    idCigam: string,
    name: string,
  ) => {
    const response = await fetch(`${API_BASE_URL}/depara/manual`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        entity: activeTab,
        id_bling: idBling,
        id_cigam: idCigam,
        nome: name,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || "Erro ao salvar mapeamento");
    }

    await fetchData({ silent: true });
  };

  const handleDeleteMapping = async (idBling: string) => {
    const response = await fetch(`${API_BASE_URL}/depara/${activeTab}/${idBling}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Erro ao excluir mapeamento");
    }

    await fetchData({ silent: true });
  };

  const runSyncStream = async (endpoint: string) => {
    setSyncing(true);
    setSyncLogs([]);
    setShowLogs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bling/sync/${endpoint}`, {
        method: "POST",
        headers: authHeaders(),
      });

      if (!response.body) {
        throw new Error("ReadableStream nao suportado na resposta.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              if (data.type === "log") {
                setSyncLogs((prev) => [...prev, data.message]);
              } else if (data.type === "error") {
                setSyncLogs((prev) => [...prev, `[ERRO] ${data.message}`]);
              } else if (data.type === "auth_required") {
                setSyncLogs((prev) => [
                  ...prev,
                  `[AUTH] ${data.message}`,
                ]);
                setError(data.message);
                if (data.authUrl) {
                  setSyncLogs((prev) => [
                    ...prev,
                    `[AUTH] Clique no link para autenticar novamente: ${data.authUrl}`,
                  ]);
                  // Abre a URL de autenticação em nova aba
                  window.open(data.authUrl, "_blank");
                }
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }

      await fetchData();
    } catch (err: any) {
      console.error(err);
      const errorMsg = `[ERRO] Falha de conexao: ${err.message}`;
      setSyncLogs((prev) => [...prev, errorMsg]);
    } finally {
      setSyncing(false);
    }
  };

  const runSyncFila = async () => {
    setSyncing(true);
    setSyncLogs([]);
    setSyncProgress({
      percent: 0,
      completed: 0,
      total: 0,
      erros: 0,
      tempoDecorrido: "",
      tempoEstimado: "",
    });
    setShowLogs(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bling/produto-sync/sincronizar-fila`,
        {
          method: "POST",
          headers: authHeaders(),
        },
      );
      if (!response.body) {
        throw new Error("ReadableStream nao suportado na resposta.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              if (data.type === "log") {
                const msg = data.message;
                setSyncLogs((prev) => [...prev, msg]);
                // Parse progresso: "Progresso: 25% (580/2323) | Erros: 0 | Tempo: 9m 40s | Estimado: 29m 10s"
                const progressMatch = msg.match(
                  /Progresso: (\d+)% \((\d+)\/(\d+)\) \| Erros: (\d+) \| Tempo: (.+?) \| Estimado: (.+)/,
                );
                if (progressMatch) {
                  setSyncProgress({
                    percent: parseInt(progressMatch[1]),
                    completed: parseInt(progressMatch[2]),
                    total: parseInt(progressMatch[3]),
                    erros: parseInt(progressMatch[4]),
                    tempoDecorrido: progressMatch[5],
                    tempoEstimado: progressMatch[6],
                  });
                }
              } else if (data.type === "error") {
                setSyncLogs((prev) => [...prev, `[ERRO] ${data.message}`]);
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const errorMsg = `[ERRO] Falha de conexao: ${err.message}`;
      setSyncLogs((prev) => [...prev, errorMsg]);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncBling = async () => {
    await runSyncStream("all");
  };

  const handleSyncEntity = async (entity: TabType) => {
    if (entity === "produtos") {
      await runSyncFila();
    } else {
      const endpoint =
        entity === "formas_pagamento" ? "formas-pagamento" : entity;
      await runSyncStream(endpoint);
    }
  };

  const totalMappings =
    mappings.clientes.length +
    mappings.produtos.length +
    mappings.formas_pagamento.length +
    mappings.transportadoras.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-lg font-semibold tracking-wide text-slate-200">
          Carregando Chocmaster
        </h2>
        <p className="text-xs text-slate-500">
          Buscando cadastros, mapeamentos e eventos do CIGAM e Bling...
        </p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00B0F1] to-[#e3f4fa] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <MoonIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#FF8301] flex items-center space-x-2">
                      <span>CHOCMASTER | CIGAM</span>
                      <span className="text-xs text-indigo-400 bg-indigo-950 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                        Integrador CIGAM
                      </span>
                    </h1>
                    <p className="text-xs text-white/80 italic">
                      Gerenciador de Mapeamentos De-Para de Integracao
                    </p>
                  </div>
                </div>
          <div className="flex items-center space-x-4">
            {/* Seletor de Ambiente CIGAM */}
            <div className="flex items-center bg-slate-905 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => handleSelectEnvironment("homologacao")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
                  activeEnv === "homologacao"
                    ? "bg-amber-600/90 text-white shadow-md shadow-amber-600/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Homologação
              </button>
              <button
                onClick={() => handleSelectEnvironment("producao")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
                  activeEnv === "producao"
                    ? "bg-emerald-600/90 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Produção
              </button>
            </div>

            <button
              onClick={handleSyncBling}
              disabled={syncing || loading}
              className={`px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition duration-200 flex items-center space-x-2 ${
                syncing ? "cursor-not-allowed opacity-55" : "cursor-pointer"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              />
              <span>{syncing ? "Sincronizando..." : "Sincronizar Bling"}</span>
            </button>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition duration-200 cursor-pointer"
              title="Recarregar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-400">{user?.nome}</span>
              <button
                onClick={logout}
                className="p-2 bg-slate-800 hover:bg-red-950/30 hover:border-red-500/30 hover:text-red-400 border border-slate-700 rounded-xl text-slate-300 transition duration-200 cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 flex items-center space-x-3 text-red-200">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Stats Grid Widget */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Geral</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">{totalMappings}</p>
            <span className="text-[10px] text-slate-500">
              Mapeamentos Concluidos
            </span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Clientes</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {mappings.clientes.length}
            </p>
            <span className="text-[10px] text-slate-500">
              Mapeados / Total Bling: {blingClientes.length}
            </span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Produtos</span>
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {mappings.produtos.length}
            </p>
            <span className="text-[10px] text-slate-500">
              Mapeados / Total Bling: {blingProdutos.length}
            </span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Transportadoras</span>
              <Truck className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {mappings.transportadoras.length}
            </p>
            <span className="text-[10px] text-slate-500">
              Mapeadas / Total Bling: {blingTransportadoras.length}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800/60 pb-px">
          <button
            onClick={() => setActiveTab("clientes")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold text-sm transition duration-200 cursor-pointer ${
              activeTab === "clientes"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab("produtos")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold text-sm transition duration-200 cursor-pointer ${
              activeTab === "produtos"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Produtos</span>
          </button>

          <button
            onClick={() => setActiveTab("formas_pagamento")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold text-sm transition duration-200 cursor-pointer ${
              activeTab === "formas_pagamento"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Formas de Pagamento</span>
          </button>

          <button
            onClick={() => setActiveTab("transportadoras")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold text-sm transition duration-200 cursor-pointer ${
              activeTab === "transportadoras"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Transportadoras</span>
          </button>

          <button
            onClick={() => setActiveTab("eventos")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold text-sm transition duration-200 cursor-pointer ${
              activeTab === "eventos"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Eventos</span>
          </button>

          <button
            onClick={() => setActiveTab("configuracoes")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold text-sm transition duration-200 cursor-pointer ${
              activeTab === "configuracoes"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Tab Content Section */}
        <div className="min-h-96">
          {activeTab === "clientes" && (
            <DeParaSection
              entity="clientes"
              title="Clientes"
              blingData={blingClientes}
              cigamData={cigamClientes}
              mappings={mappings.clientes}
              onSaveMapping={handleSaveMapping}
              onDeleteMapping={handleDeleteMapping}
              loading={loading}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}

          {activeTab === "produtos" && (
            <DeParaSection
              entity="produtos"
              title="Produtos"
              blingData={blingProdutos}
              cigamData={cigamProdutos}
              mappings={mappings.produtos}
              onSaveMapping={handleSaveMapping}
              onDeleteMapping={handleDeleteMapping}
              loading={loading}
              onSync={() => handleSyncEntity("produtos")}
              syncing={syncing}
              logs={syncLogs}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}

          {activeTab === "formas_pagamento" && (
            <DeParaSection
              entity="formas_pagamento"
              title="Formas de Pagamento"
              blingData={blingFormasPagamento}
              cigamData={cigamFormasPagamento}
              mappings={mappings.formas_pagamento}
              onSaveMapping={handleSaveMapping}
              onDeleteMapping={handleDeleteMapping}
              loading={loading}
              onSync={() => handleSyncEntity("formas_pagamento")}
              syncing={syncing}
              logs={syncLogs}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}

          {activeTab === "transportadoras" && (
            <DeParaSection
              entity="transportadoras"
              title="Transportadoras"
              blingData={blingTransportadoras}
              cigamData={cigamTransportadoras}
              mappings={mappings.transportadoras}
              onSaveMapping={handleSaveMapping}
              onDeleteMapping={handleDeleteMapping}
              loading={loading}
              onSync={() => handleSyncEntity("transportadoras")}
              syncing={syncing}
              logs={syncLogs}
              onRefresh={() => fetchData({ silent: true })}
            />
          )}

          {activeTab === "eventos" && <EventsSection />}

          {activeTab === "configuracoes" && (
            <ConfiguracoesSection
              API_BASE_URL={API_BASE_URL}
              onRefreshGlobal={fetchData}
            />
          )}
        </div>
      </main>

      {/* Log Panel - aparece durante sincronizacao */}
      {showLogs && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-200">
                  Sincronizacao Bling
                </span>
                {syncing && (
                  <span className="text-xs text-indigo-400 bg-indigo-950 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    Em andamento...
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            {syncProgress.total > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>
                    {syncProgress.completed} / {syncProgress.total} produtos
                  </span>
                  <span>{syncProgress.percent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress.percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Decorrido: {syncProgress.tempoDecorrido || "0s"}</span>
                  <span>
                    Estimado: {syncProgress.tempoEstimado || "Calculando..."}
                  </span>
                  {syncProgress.erros > 0 && (
                    <span className="text-red-400">
                      Erros: {syncProgress.erros}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="bg-slate-950 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
              {syncLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-start space-x-2 ${
                    log.startsWith("[ERRO]")
                      ? "text-red-400"
                      : log.startsWith("Progresso:")
                        ? "text-indigo-400"
                        : "text-slate-300"
                  }`}
                >
                  <span className="text-slate-600 shrink-0">
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span>{log}</span>
                </div>
              ))}
              {syncing && (
                <div className="flex items-center space-x-2 text-indigo-400">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  <span>Aguardando proximo log...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 Chocmaster. Todos os direitos reservados.</p>
      </footer>
    </div>
      </ProtectedRoute>
      } />
    </Routes>
  );
}
