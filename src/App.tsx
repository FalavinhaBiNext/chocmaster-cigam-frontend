import { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { DeParaSection } from "./components/DeParaSection";
import { EventsSection } from "./components/EventsSection";
import { ConfiguracoesSection } from "./components/ConfiguracoesSection";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MercadoLivreCallbackPage } from "./pages/MercadoLivreCallbackPage";
import { MercadoLivreOrdersSection } from "./components/MercadoLivreOrdersSection";
import { useAuth } from "./contexts/AuthContext";
import {
  Users,
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle2,
  Activity,
  Terminal,
  X,
  Settings,
  LogOut,
  AlertCircle,
  Building2,
  Package,
} from "lucide-react";

import Logo from './assets/LogoSFundoBlack.png'
import logoCigam from './assets/LogoCigamBlack.png'
import logoBling from './assets/LogoBlingBlack.png'

const API_BASE_URL = "https://api-chocmaster.falavinhanext.tec.br/api/v1";

function UnidadesNegocioSection({
  data,
  API_BASE_URL,
  authHeaders,
  onRefresh,
}: {
  data: any[];
  API_BASE_URL: string;
  authHeaders: () => Record<string, string>;
  onRefresh: () => Promise<void>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newUnidade, setNewUnidade] = useState('');
  const [newNome, setNewNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newCompanyId.trim() || !newUnidade.trim() || !newNome.trim()) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/depara/unidades-negocio`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          company_id_bling: newCompanyId.trim(),
          unidade_negocio: newUnidade.trim(),
          nome: newNome.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao criar mapeamento');
      }
      setNewCompanyId('');
      setNewUnidade('');
      setNewNome('');
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API_BASE_URL}/depara/unidades-negocio/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao excluir mapeamento');
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Unidades de Negócio</h2>
        <p className="text-sm text-slate-500">Mapeie o companyId da Bling para a unidade de negócio do CIGAM</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Novo Mapeamento</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Company ID (Bling)"
            value={newCompanyId}
            onChange={(e) => setNewCompanyId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#00B0F1] focus:outline-none focus:ring-2 focus:ring-[#00B0F1]/20"
          />
          <input
            type="text"
            placeholder="Unidade (CIGAM)"
            value={newUnidade}
            onChange={(e) => setNewUnidade(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#00B0F1] focus:outline-none focus:ring-2 focus:ring-[#00B0F1]/20"
          />
          <input
            type="text"
            placeholder="Nome descritivo"
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#00B0F1] focus:outline-none focus:ring-2 focus:ring-[#00B0F1]/20"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#00B0F1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008FC7] disabled:opacity-50"
        >
          {isCreating ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Company ID (Bling)</th>
              <th className="px-4 py-3">Unidade (CIGAM)</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhum mapeamento cadastrado
                </td>
              </tr>
            )}
            {data.map((item: any) => (
              <tr key={item.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.company_id_bling}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{item.unidade_negocio}</td>
                <td className="px-4 py-3 text-slate-600">{item.nome}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${item.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting === item.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type TabType =
  | "clientes"
  | "produtos"
  | "formas_pagamento"
  | "transportadoras"
  | "eventos"
  | "unidades_negocio"
  | "mercado_livre"
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

  // Unidades de Negócio
  const [unidadesNegocio, setUnidadesNegocio] = useState<any[]>([]);
  const [unidadeNegocioFilter, setUnidadeNegocioFilter] = useState<string>('');

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
        resUnidadesNegocio,
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
        fetch(`${API_BASE_URL}/depara/unidades-negocio`, { headers: authHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
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
          unidade_negocio: p.unidade_negocio,
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
          id: (c.codigo_cigam || c.id_cigam || c.id || '').toString().trim(),
          name: c.nome || c.nome_completo || c.NomeCompleto,
          extra: c.documento || undefined,
        })),
      );
      setCigamProdutos(
        (resCigamProd.data || []).map((p: any) => ({
          id: (p.codigo_cigam || p.id_cigam || p.id || '').toString().trim(),
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
          id: (f.codigo_cigam || f.id_cigam || f.id || '').toString().trim(),
          name: f.descricao,
        })),
      );
      setCigamTransportadoras(
        (resCigamTrans.data || []).map((t: any) => ({
          id: (t.codigo_cigam || t.id_cigam || t.id || '').toString().trim(),
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

      setUnidadesNegocio(resUnidadesNegocio.data || []);
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
          `Nenhum usuário CIGAM configurado para o ambiente "${env === "producao" ? "Produção" : "Homologação"
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

      <Route path="/mercado-livre/callback" element={<MercadoLivreCallbackPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="relative isolate flex min-h-screen min-h-dvh flex-col overflow-x-hidden bg-slate-100 font-sans text-slate-900">
              {/* Fundo claro da aplicação */}
              <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-30 bg-[#f3f6fb]"
              />

              {/* Iluminação decorativa */}
              <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-20"
                style={{
                  background: `
      radial-gradient(
        circle at 8% 5%,
        rgba(0, 176, 241, 0.12) 0%,
        transparent 30%
      ),
      radial-gradient(
        circle at 92% 10%,
        rgba(255, 131, 1, 0.08) 0%,
        transparent 28%
      ),
      radial-gradient(
        circle at 50% 100%,
        rgba(0, 176, 241, 0.05) 0%,
        transparent 40%
      ),
      linear-gradient(
        145deg,
        #f8fafc 0%,
        #eef3f8 50%,
        #f8fafc 100%
      )
    `,
                }}
              />

              {/* Vinheta clara e discreta */}
              <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-10"
                style={{
                  background: `
      linear-gradient(
        to bottom,
        rgba(255,255,255,0.70) 0%,
        transparent 22%,
        transparent 78%,
        rgba(226,232,240,0.35) 100%
      )
    `,
                }}
              />

              {/* Header */}
              <header
                className="
                sticky top-0 z-50
                border-b border-white/60
                bg-white/[0.92]
                shadow-[0_10px_35px_-20px_rgba(2,6,23,0.45),inset_0_-1px_0_rgba(15,23,42,0.06)]
                backdrop-blur-xl
              "
              >
                <div
                  className="
                  mx-auto
                  flex w-full max-w-[1440px]
                  flex-col gap-5
                  px-4 py-4
                  sm:px-6
                  lg:flex-row lg:items-center lg:justify-between
                  lg:px-8
                "
                >
                  {/* Identidade */}
                  <div className="flex min-w-0 items-center gap-3.5">
                    <img src={Logo} alt="Logo" className="h-16 w-auto" />


                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-sm">
                          CHOCMASTER
                          <span className="mx-2 font-light text-slate-300">
                            |
                          </span>
                          CIGAM
                        </h1>

                        <span
                          className="
                          inline-flex items-center
                          rounded-full
                          border border-[#00B0F1]/20
                          bg-[#00B0F1]/10
                          px-2.5
                          text-[0.65rem] font-bold
                          uppercase tracking-[0.08em]
                          text-[#008FC7]
                        "
                        >
                          Integrador CIGAM
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs text-slate-500 italic">
                        Gerenciador e mapeamentos para integração
                      </p>
                    </div>
                  </div>

                  {/* Ações do header */}
                  <div
                    className="
                    flex w-full
                    flex-col gap-3
                    sm:flex-row sm:flex-wrap sm:items-center
                    lg:w-auto lg:flex-nowrap lg:justify-end
                  "
                  >
                    {/* Seletor de ambiente */}
                    <div
                      className="
                      flex shrink-0
                      items-center
                      rounded-xl
                      border border-slate-200
                      bg-slate-100/80
                      p-1
                      shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]
                    "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectEnvironment("homologacao")
                        }
                        aria-pressed={activeEnv === "homologacao"}
                        className={`
                        flex-1
                        rounded-lg
                        px-3 py-2
                        text-xs font-semibold
                        transition-all duration-200
                        sm:flex-none
                        ${activeEnv === "homologacao"
                            ? `
                              bg-gradient-to-b
                              from-amber-500
                              to-amber-600
                              text-white
                              shadow-[0_5px_12px_-6px_rgba(217,119,6,0.80),inset_0_1px_1px_rgba(255,255,255,0.30)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-white/70
                              hover:text-slate-800
                            `
                          }
                      `}
                      >
                        Homologação
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSelectEnvironment("producao")
                        }
                        aria-pressed={activeEnv === "producao"}
                        className={`
                        flex-1
                        rounded-lg
                        px-3 py-2
                        text-xs font-semibold
                        transition-all duration-200
                        sm:flex-none
                        ${activeEnv === "producao"
                            ? `
                              bg-gradient-to-b
                              from-emerald-500
                              to-emerald-600
                              text-white
                              shadow-[0_5px_12px_-6px_rgba(5,150,105,0.80),inset_0_1px_1px_rgba(255,255,255,0.30)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-white/70
                              hover:text-slate-800
                            `
                          }
                      `}
                      >
                        Produção
                      </button>
                    </div>

                    {/* Filtro Unidade de Negócio */}
                    {unidadesNegocio.length > 0 && (
                      <select
                        value={unidadeNegocioFilter}
                        onChange={(e) => setUnidadeNegocioFilter(e.target.value)}
                        className="
                        shrink-0
                        rounded-xl
                        border border-slate-200
                        bg-white/80
                        px-3 py-2
                        text-xs font-semibold
                        text-slate-700
                        shadow-sm
                        focus:border-[#00B0F1]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#00B0F1]/20
                        "
                      >
                        <option value="">Todas as unidades</option>
                        {unidadesNegocio.map((u: any) => (
                          <option key={u.id} value={u.unidade_negocio}>
                            {u.nome} ({u.unidade_negocio})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Sincronizar */}
                    {/* <button
                      type="button"
                      onClick={handleSyncBling}
                      disabled={syncing || loading}
                      className={`
                      inline-flex min-h-10
                      flex-1 items-center justify-center gap-2
                      rounded-xl
                      border border-slate-900/20
                      bg-gradient-to-b
                      from-slate-700
                      to-slate-950
                      px-4 py-2.5
                      text-sm font-semibold
                      text-white
                      shadow-[0_8px_18px_-10px_rgba(15,23,42,0.90),inset_0_1px_1px_rgba(255,255,255,0.20)]
                      transition-all duration-200
                      sm:flex-none
                      ${syncing || loading
                          ? "cursor-not-allowed opacity-60"
                          : `
                            cursor-pointer
                            hover:-translate-y-0.5
                            hover:from-slate-600
                            hover:to-slate-900
                          `
                        }
                    `}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${syncing ? "animate-spin" : ""
                          }`}
                      />

                      <span>
                        {syncing
                          ? "Sincronizando..."
                          : "Sincronizar Bling"}
                      </span>
                    </button> */}

                    {/* Usuário */}
                    <div
                      className="
                      flex min-w-0
                      items-center justify-between gap-3
                      border-t border-slate-200
                      pt-3
                      sm:border-l sm:border-t-0
                      sm:pl-4 sm:pt-0
                    "
                    >
                      <div className="min-w-0 text-right">
                        <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                          Usuário
                        </span>

                        <span className="block max-w-36 truncate text-xs font-semibold text-slate-700">
                          {user?.nome}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={logout}
                        title="Sair"
                        aria-label="Sair do sistema"
                        className="
                        inline-flex h-10 w-10 shrink-0
                        cursor-pointer
                        items-center justify-center
                        rounded-xl
                        border border-slate-200
                        bg-white/80
                        text-slate-500
                        shadow-sm
                        transition-all duration-200
                        hover:-translate-y-0.5
                        hover:border-red-200
                        hover:bg-red-50
                        hover:text-red-500
                        focus:outline-none
                        focus:ring-4
                        focus:ring-red-500/10
                      "
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {/* Conteúdo principal */}
              <main
                className="
                mx-auto flex w-full max-w-[1440px]
                flex-1 flex-col gap-6
                px-4 py-6
                sm:px-6 sm:py-8
                lg:px-8
              "
              >
                {/* Alerta de erro */}
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="
                    flex items-start gap-3
                    rounded-2xl
                    border border-red-200/80
                    bg-red-50/95
                    p-4
                    text-red-800
                    shadow-[0_14px_32px_-22px_rgba(127,29,29,0.60),inset_0_1px_1px_rgba(255,255,255,0.80)]
                    backdrop-blur-xl
                  "
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Não foi possível concluir a operação
                      </p>

                      <p className="mt-0.5 text-sm text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Indicadores */}
                <section
                  aria-label="Indicadores gerais"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                  {/* Total */}
                  <article
                    className="
                    group relative
                    overflow-hidden
                    rounded-2xl
                    border border-white/70
                    bg-white/[0.94]
                    p-5
                    shadow-[0_18px_45px_-26px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]
                    backdrop-blur-xl
                    transition-all duration-200
                    hover:-translate-y-1
                    hover:shadow-[0_24px_50px_-25px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95)]
                  "
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Total geral
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                          {totalMappings}
                        </p>
                      </div>

                      <div
                        className="
                        flex h-11 w-11
                        items-center justify-center
                        rounded-2xl
                        border border-[#00B0F1]/15
                        bg-[#00B0F1]/10
                        text-[#008FC7]
                        shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]
                      "
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Mapeamentos concluídos
                    </p>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-[#00B0F1] to-[#008FC7]" />
                    </div>
                  </article>

                  {/* Clientes */}
                  <article
                    className="
                    group relative
                    overflow-hidden
                    rounded-2xl
                    border border-white/70
                    bg-white/[0.94]
                    p-5
                    shadow-[0_18px_45px_-26px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]
                    backdrop-blur-xl
                    transition-all duration-200
                    hover:-translate-y-1
                    hover:shadow-[0_24px_50px_-25px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95)]
                  "
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Clientes
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                          {mappings.clientes.length}
                        </p>
                      </div>

                      <div
                        className="
                        flex h-11 w-11
                        items-center justify-center
                        rounded-2xl
                        border border-blue-200
                        bg-blue-50
                        text-blue-600
                        shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]
                      "
                      >
                        <Users className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Mapeados de {blingClientes.length} no Bling
                    </p>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{
                          width:
                            blingClientes.length > 0
                              ? `${Math.min(
                                (mappings.clientes.length /
                                  blingClientes.length) *
                                100,
                                100,
                              )}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </article>

                  {/* Produtos */}
                  <article
                    className="
                    group relative
                    overflow-hidden
                    rounded-2xl
                    border border-white/70
                    bg-white/[0.94]
                    p-5
                    shadow-[0_18px_45px_-26px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]
                    backdrop-blur-xl
                    transition-all duration-200
                    hover:-translate-y-1
                    hover:shadow-[0_24px_50px_-25px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95)]
                  "
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Produtos
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                          {mappings.produtos.length}
                        </p>
                      </div>

                      <div
                        className="
                        flex h-11 w-11
                        items-center justify-center
                        rounded-2xl
                        border border-orange-200
                        bg-orange-50
                        text-[#E66F00]
                        shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]
                      "
                      >
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Mapeados de {blingProdutos.length} no Bling
                    </p>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#FF8301] transition-all duration-500"
                        style={{
                          width:
                            blingProdutos.length > 0
                              ? `${Math.min(
                                (mappings.produtos.length /
                                  blingProdutos.length) *
                                100,
                                100,
                              )}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </article>

                  {/* Transportadoras */}
                  <article
                    className="
                    group relative
                    overflow-hidden
                    rounded-2xl
                    border border-white/70
                    bg-white/[0.94]
                    p-5
                    shadow-[0_18px_45px_-26px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]
                    backdrop-blur-xl
                    transition-all duration-200
                    hover:-translate-y-1
                    hover:shadow-[0_24px_50px_-25px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95)]
                  "
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Transportadoras
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                          {mappings.transportadoras.length}
                        </p>
                      </div>

                      <div
                        className="
                        flex h-11 w-11
                        items-center justify-center
                        rounded-2xl
                        border border-emerald-200
                        bg-emerald-50
                        text-emerald-600
                        shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]
                      "
                      >
                        <Truck className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Mapeadas de {blingTransportadoras.length} no Bling
                    </p>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width:
                            blingTransportadoras.length > 0
                              ? `${Math.min(
                                (mappings.transportadoras.length /
                                  blingTransportadoras.length) *
                                100,
                                100,
                              )}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </article>
                </section>

                {/* Navegação */}
                <nav
                  aria-label="Seções do integrador"
                  className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border border-white/70
                  bg-white/[0.94]
                  p-2
                  shadow-[0_18px_45px_-28px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95)]
                  backdrop-blur-xl
                "
                >
                  <div className="overflow-x-auto">
                    <div className="flex min-w-max items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("clientes")}
                        aria-pressed={activeTab === "clientes"}
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "clientes"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <Users className="h-4 w-4" />
                        <span>Clientes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("produtos")}
                        aria-pressed={activeTab === "produtos"}
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "produtos"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Produtos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab("formas_pagamento")
                        }
                        aria-pressed={
                          activeTab === "formas_pagamento"
                        }
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "formas_pagamento"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Formas de pagamento</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab("transportadoras")
                        }
                        aria-pressed={
                          activeTab === "transportadoras"
                        }
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "transportadoras"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <Truck className="h-4 w-4" />
                        <span>Transportadoras</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("eventos")}
                        aria-pressed={activeTab === "eventos"}
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "eventos"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <Activity className="h-4 w-4" />
                        <span>Eventos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("unidades_negocio")}
                        aria-pressed={activeTab === "unidades_negocio"}
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "unidades_negocio"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Unidades</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("mercado_livre")}
                        aria-pressed={activeTab === "mercado_livre"}
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "mercado_livre"
                            ? `
                              bg-[#FFE600]/15
                              text-yellow-700
                              shadow-[inset_0_0_0_1px_rgba(255,230,0,0.3)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <Package className="h-4 w-4" />
                        <span>Mercado Livre</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab("configuracoes")
                        }
                        aria-pressed={
                          activeTab === "configuracoes"
                        }
                        className={`
                        inline-flex items-center gap-2
                        rounded-xl
                        px-4 py-2.5
                        text-sm font-semibold
                        transition-all duration-200
                        ${activeTab === "configuracoes"
                            ? `
                              bg-[#00B0F1]/10
                              text-[#008FC7]
                              shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]
                            `
                            : `
                              cursor-pointer
                              text-slate-500
                              hover:bg-slate-100
                              hover:text-slate-900
                            `
                          }
                      `}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                      </button>
                    </div>
                  </div>
                </nav>

                {/* Conteúdo das abas */}
                <section
                  className="
                  relative
                  min-h-96
                  overflow-hidden
                  rounded-[28px]
                  border border-white/70
                  bg-white/[0.94]
                  p-3
                  shadow-[0_25px_65px_-35px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(15,23,42,0.06)]
                  backdrop-blur-xl
                  sm:p-5
                "
                >
                  {/* Borda interna */}
                  <div
                    aria-hidden="true"
                    className="
                    pointer-events-none
                    absolute inset-[5px]
                    rounded-[22px]
                    border border-slate-200/70
                    shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.06)]
                  "
                  />

                  <div className="relative z-10">
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
                        onRefresh={() =>
                          fetchData({ silent: true })
                        }
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
                        onSync={() =>
                          handleSyncEntity("produtos")
                        }
                        syncing={syncing}
                        logs={syncLogs}
                        onRefresh={() =>
                          fetchData({ silent: true })
                        }
                        unidadeNegocioFilter={unidadeNegocioFilter}
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
                        onSync={() =>
                          handleSyncEntity("formas_pagamento")
                        }
                        syncing={syncing}
                        logs={syncLogs}
                        onRefresh={() =>
                          fetchData({ silent: true })
                        }
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
                        onSync={() =>
                          handleSyncEntity("transportadoras")
                        }
                        syncing={syncing}
                        logs={syncLogs}
                        onRefresh={() =>
                          fetchData({ silent: true })
                        }
                      />
                    )}

                    {activeTab === "eventos" && (
                      <EventsSection unidadeNegocioFilter={unidadeNegocioFilter} />
                    )}

                    {activeTab === "unidades_negocio" && (
                      <UnidadesNegocioSection
                        data={unidadesNegocio}
                        API_BASE_URL={API_BASE_URL}
                        authHeaders={authHeaders}
                        onRefresh={() => fetchData({ silent: true })}
                      />
                    )}

                    {activeTab === "mercado_livre" && (
                      <MercadoLivreOrdersSection />
                    )}

                    {activeTab === "configuracoes" && (
                      <ConfiguracoesSection
                        API_BASE_URL={API_BASE_URL}
                        onRefreshGlobal={fetchData}
                      />
                    )}
                  </div>
                </section>
              </main>

              {/* Painel de logs */}
              {showLogs && (
                <aside
                  aria-label="Logs da sincronização"
                  className="
                  fixed inset-x-0 bottom-0 z-[60]
                  border-t border-white/70
                  bg-white/[0.96]
                  shadow-[0_-24px_60px_-30px_rgba(2,6,23,0.75)]
                  backdrop-blur-xl
                "
                >
                  <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="
                          flex h-9 w-9 shrink-0
                          items-center justify-center
                          rounded-xl
                          border border-[#00B0F1]/20
                          bg-[#00B0F1]/10
                          text-[#008FC7]
                        "
                        >
                          <Terminal className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              Sincronização Bling
                            </span>

                            {syncing && (
                              <span
                                className="
                                rounded-full
                                border border-[#00B0F1]/20
                                bg-[#00B0F1]/10
                                px-2.5 py-0.5
                                text-[0.65rem] font-bold
                                uppercase tracking-wider
                                text-[#008FC7]
                              "
                              >
                                Em andamento
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Acompanhe o progresso e as mensagens da integração
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowLogs(false)}
                        aria-label="Fechar painel de logs"
                        className="
                        inline-flex h-9 w-9 shrink-0
                        cursor-pointer
                        items-center justify-center
                        rounded-xl
                        border border-slate-200
                        bg-white
                        text-slate-500
                        shadow-sm
                        transition
                        hover:border-red-200
                        hover:bg-red-50
                        hover:text-red-500
                      "
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Progresso */}
                    {syncProgress.total > 0 && (
                      <div
                        className="
                        mb-3
                        rounded-2xl
                        border border-slate-200
                        bg-slate-50/90
                        p-3
                      "
                      >
                        <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                          <span className="font-medium text-slate-600">
                            {syncProgress.completed} de{" "}
                            {syncProgress.total} produtos
                          </span>

                          <span className="font-bold text-[#008FC7]">
                            {syncProgress.percent}%
                          </span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            from-[#00B0F1]
                            to-[#008FC7]
                            shadow-[0_0_10px_rgba(0,176,241,0.45)]
                            transition-all duration-300
                          "
                            style={{
                              width: `${syncProgress.percent}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 text-[0.68rem] text-slate-500">
                          <span>
                            Decorrido:{" "}
                            {syncProgress.tempoDecorrido || "0s"}
                          </span>

                          <span>
                            Estimado:{" "}
                            {syncProgress.tempoEstimado ||
                              "Calculando..."}
                          </span>

                          {syncProgress.erros > 0 && (
                            <span className="font-semibold text-red-500">
                              Erros: {syncProgress.erros}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Terminal */}
                    <div
                      className="
                      max-h-52
                      space-y-1
                      overflow-y-auto
                      rounded-2xl
                      border border-slate-800
                      bg-slate-950
                      p-4
                      font-mono text-xs
                      shadow-[inset_0_2px_8px_rgba(0,0,0,0.40)]
                    "
                    >
                      {syncLogs.map((log, index) => (
                        <div
                          key={index}
                          className={`
                          flex items-start gap-3
                          ${log.startsWith("[ERRO]")
                              ? "text-red-400"
                              : log.startsWith("Progresso:")
                                ? "text-cyan-400"
                                : "text-slate-300"
                            }
                        `}
                        >
                          <span className="shrink-0 select-none text-slate-600">
                            {String(index + 1).padStart(3, "0")}
                          </span>

                          <span className="break-all leading-5">
                            {log}
                          </span>
                        </div>
                      ))}

                      {syncing && (
                        <div className="flex items-center gap-3 text-cyan-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                          <span>Aguardando próximo log...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              )}

              {/* Footer */}
              <footer
                className="
                mt-auto
                border-t border-white/10
                bg-white/30
                px-4 py-6
                text-center
                backdrop-blur-sm
              "
              >
                <p className="text-xs text-slate-400">
                  © 2026 Chocmaster. Todos os direitos reservados.
                </p>

                <p className="mt-1 text-[0.65rem] text-slate-500">
                  Integração Bling{" "}
                  <span className="font-mono font-semibold text-[#00B0F1]">
                    {"< >"}
                  </span>{" "}
                  ERP CIGAM
                </p>
                <div className="flex justify-center items-center gap-3 mt-2">
                  <img
                    src={logoBling}
                    alt="Logo Bling"
                    className="h-9 w-auto object-contain"
                  />

                  <img
                    src={logoCigam}
                    alt="Logo ERP CIGAM"
                    className="h-9 w-auto object-contain"
                  />
                </div>

                {/* <img
                  src={LogoChoc}
                  alt="Logo Chocmaster"
                  className="h-9 w-auto object-contain"
                /> */}
              </footer>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}