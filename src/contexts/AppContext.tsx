import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../config/api";

export type EntityType = "clientes" | "produtos" | "formas_pagamento" | "transportadoras";

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
  unidade_negocio?: string;
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

interface SyncProgress {
  percent: number;
  completed: number;
  total: number;
  erros: number;
  tempoDecorrido: string;
  tempoEstimado: string;
}

interface AppContextType {
  // Data
  blingClientes: BlingItem[];
  blingProdutos: BlingItem[];
  blingFormasPagamento: BlingItem[];
  blingTransportadoras: BlingItem[];
  cigamClientes: CigamItem[];
  cigamProdutos: CigamItem[];
  cigamFormasPagamento: CigamItem[];
  cigamTransportadoras: CigamItem[];
  mappings: MappingStatus;
  canaisVenda: any[];
  pendingNfeCount: number;

  // State
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncLogs: string[];
  showLogs: boolean;
  syncProgress: SyncProgress;
  activeEnv: string;

  // Actions
  setError: (error: string | null) => void;
  setShowLogs: (show: boolean) => void;
  fetchData: (options?: { silent?: boolean }) => Promise<void>;
  handleSaveMapping: (entity: EntityType, idBling: string, idCigam: string, name: string) => Promise<void>;
  handleDeleteMapping: (entity: EntityType, idBling: string) => Promise<void>;
  handleSyncEntity: (entity: EntityType) => Promise<void>;
  handleSelectEnvironment: (env: string) => Promise<void>;
  authHeaders: () => Record<string, string>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  const authHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    percent: 0,
    completed: 0,
    total: 0,
    erros: 0,
    tempoDecorrido: "",
    tempoEstimado: "",
  });

  const [cigamUsers, setCigamUsers] = useState<any[]>([]);
  const [activeEnv, setActiveEnv] = useState<string>("homologacao");

  const [blingClientes, setBlingClientes] = useState<BlingItem[]>([]);
  const [blingProdutos, setBlingProdutos] = useState<BlingItem[]>([]);
  const [blingFormasPagamento, setBlingFormasPagamento] = useState<BlingItem[]>([]);
  const [blingTransportadoras, setBlingTransportadoras] = useState<BlingItem[]>([]);

  const [cigamClientes, setCigamClientes] = useState<CigamItem[]>([]);
  const [cigamProdutos, setCigamProdutos] = useState<CigamItem[]>([]);
  const [cigamFormasPagamento, setCigamFormasPagamento] = useState<CigamItem[]>([]);
  const [cigamTransportadoras, setCigamTransportadoras] = useState<CigamItem[]>([]);

  const [mappings, setMappings] = useState<MappingStatus>({
    produtos: [],
    clientes: [],
    formas_pagamento: [],
    transportadoras: [],
  });

  const [canaisVenda, setCanaisVenda] = useState<any[]>([]);
  const [pendingNfeCount, setPendingNfeCount] = useState(0);

  const fetchData = useCallback(
    async (options?: { silent?: boolean }) => {
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
          resCanaisVenda,
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
          fetch(`${API_BASE_URL}/canais-venda`, { headers: authHeaders() })
            .then((r) => r.json())
            .catch(() => ({ data: [] })),
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
            id: (c.codigo_cigam || c.id_cigam || c.id || "").toString().trim(),
            name: c.nome || c.nome_completo || c.NomeCompleto,
            extra: c.documento || undefined,
          })),
        );
        setCigamProdutos(
          (resCigamProd.data || []).map((p: any) => ({
            id: (p.codigo_cigam || p.id_cigam || p.id || "").toString().trim(),
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
            id: (f.codigo_cigam || f.id_cigam || f.id || "").toString().trim(),
            name: f.descricao,
          })),
        );
        setCigamTransportadoras(
          (resCigamTrans.data || []).map((t: any) => ({
            id: (t.codigo_cigam || t.id_cigam || t.id || "").toString().trim(),
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

        setCanaisVenda(resCanaisVenda.data || []);

        try {
          const resNotasPendentes = await fetch(`${API_BASE_URL}/notas-fiscais-cigam/nao-enviadas`, {
            headers: authHeaders(),
          });
          if (resNotasPendentes.ok) {
            const notasData = await resNotasPendentes.json();
            setPendingNfeCount(notasData.data?.length || 0);
          }
        } catch {
          // Ignorar erro
        }
      } catch (err: any) {
        console.error(err);
        setError("Falha ao se conectar com o servidor backend Chocmaster na porta 3333.");
      } finally {
        setLoading(false);
      }
    },
    [authHeaders],
  );

  const handleSelectEnvironment = async (env: string) => {
    setError(null);
    try {
      const user = cigamUsers.find((u) => u.ambiente.toLowerCase() === env.toLowerCase());
      if (!user) {
        setError(
          `Nenhum usuário CIGAM configurado para o ambiente "${env === "producao" ? "Produção" : "Homologação"}". Por favor, configure-o na aba de Configurações.`,
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cigam/usuarios/alter-ativo/${user.id}`, {
        method: "PATCH",
        headers: authHeaders(),
      });

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

  const handleSaveMapping = async (entity: EntityType, idBling: string, idCigam: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/depara/manual`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        entity,
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

  const handleDeleteMapping = async (entity: EntityType, idBling: string) => {
    const response = await fetch(`${API_BASE_URL}/depara/${entity}/${idBling}`, {
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
                setSyncLogs((prev) => [...prev, `[AUTH] ${data.message}`]);
                setError(data.message);
                if (data.authUrl) {
                  setSyncLogs((prev) => [...prev, `[AUTH] Clique no link para autenticar novamente: ${data.authUrl}`]);
                  window.open(data.authUrl, "_blank");
                }
              }
            } catch {
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
      const response = await fetch(`${API_BASE_URL}/bling/produto-sync/sincronizar-fila`, {
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
                const msg = data.message;
                setSyncLogs((prev) => [...prev, msg]);
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
            } catch {
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

  const handleSyncEntity = async (entity: EntityType) => {
    if (entity === "produtos") {
      await runSyncFila();
    } else {
      const endpoint = entity === "formas_pagamento" ? "formas-pagamento" : entity;
      await runSyncStream(endpoint);
    }
  };

  return (
    <AppContext.Provider
      value={{
        blingClientes,
        blingProdutos,
        blingFormasPagamento,
        blingTransportadoras,
        cigamClientes,
        cigamProdutos,
        cigamFormasPagamento,
        cigamTransportadoras,
        mappings,
        canaisVenda,
        pendingNfeCount,
        loading,
        error,
        syncing,
        syncLogs,
        showLogs,
        syncProgress,
        activeEnv,
        setError,
        setShowLogs,
        fetchData,
        handleSaveMapping,
        handleDeleteMapping,
        handleSyncEntity,
        handleSelectEnvironment,
        authHeaders,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
