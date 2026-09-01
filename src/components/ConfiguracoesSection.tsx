import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Key,
  Link,
  Plus,
  Server,
  Settings,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import logoMercadoLivre from "../assets/MercadoLivre.png";
import logoShopee from "../assets/Shopee.png";

interface UsuarioCigam {
  id: string;
  ambiente: string;
  login: string;
  senha?: string;
  url_ambiente: string;
  ativo: boolean;
}

interface SistemaUsuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at: string;
}

interface ConfiguracoesSectionProps {
  API_BASE_URL: string;
  onRefreshGlobal: () => void;
}

const inputClassName = `
  h-11
  w-full
  rounded-xl
  border border-slate-300
  bg-white/90
  px-3
  text-sm text-slate-900
  shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]
  outline-none
  transition-all duration-200
  placeholder:text-slate-400
  hover:border-slate-400
  focus:border-[#00B0F1]
  focus:bg-white
  focus:ring-4
  focus:ring-[#00B0F1]/15
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:text-slate-500
`;

const labelClassName = `
  mb-2
  block
  text-xs font-semibold
  uppercase tracking-[0.08em]
  text-slate-600
`;

const getErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  return error instanceof Error ? error.message : fallbackMessage;
};

const isProductionEnvironment = (ambiente: string): boolean => {
  const normalizedEnvironment = ambiente
    .trim()
    .toLocaleLowerCase("pt-BR");

  return (
    normalizedEnvironment === "producao" ||
    normalizedEnvironment === "produção"
  );
};

export const ConfiguracoesSection = ({
  API_BASE_URL,
  onRefreshGlobal,
}: ConfiguracoesSectionProps) => {
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

  const [usuarios, setUsuarios] = useState<UsuarioCigam[]>([]);
  const [loading, setLoading] = useState(true);
  const [envioAutomatico, setEnvioAutomatico] = useState(true);
  const [togglingEnvio, setTogglingEnvio] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const [ambiente, setAmbiente] = useState("homologacao");
  const [urlAmbiente, setUrlAmbiente] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mercado Livre state
  const [mlTokens, setMlTokens] = useState<any[]>([]);
  const [loadingMl, setLoadingMl] = useState(true);
  const [mlAuthSuccess, setMlAuthSuccess] = useState(false);
  const [showMlDocs, setShowMlDocs] = useState(false);

  // Shopee state
  const [shopeeTokens, setShopeeTokens] = useState<any[]>([]);
  const [loadingShopee, setLoadingShopee] = useState(true);
  const [shopeeAuthSuccess, setShopeeAuthSuccess] = useState(false);
  const [showShopeeDocs, setShowShopeeDocs] = useState(false);

  // Usuários do sistema
  const [sistemaUsuarios, setSistemaUsuarios] = useState<SistemaUsuario[]>([]);
  const [loadingSistemaUsuarios, setLoadingSistemaUsuarios] = useState(true);

  // Criação de usuário do sistema
  const [showCreateUsuarioDrawer, setShowCreateUsuarioDrawer] = useState(false);
  const [novoUsuarioNome, setNovoUsuarioNome] = useState("");
  const [novoUsuarioEmail, setNovoUsuarioEmail] = useState("");
  const [novoUsuarioSenha, setNovoUsuarioSenha] = useState("");
  const [novoUsuarioRole, setNovoUsuarioRole] = useState("usuario");
  const [showNovoUsuarioSenha, setShowNovoUsuarioSenha] = useState(false);
  const [creatingUsuarioSistema, setCreatingUsuarioSistema] = useState(false);
  const [usuarioSistemaError, setUsuarioSistemaError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [response, configResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/cigam/usuarios/find-all`,
          { headers: authHeaders },
        ),
        fetch(
          `${API_BASE_URL}/configuracoes/envio-automatico`,
          { headers: authHeaders },
        ).catch(() => null),
      ]);

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar os usuários CIGAM.",
        );
      }

      const data = await response.json();

      setUsuarios(data.data || []);

      if (configResponse?.ok) {
        const configData = await configResponse.json();
        setEnvioAutomatico(configData.data?.envio_automatico_cigam ?? true);
      }
    } catch (error: unknown) {
      console.error(error);

      setError(
        "Não foi possível carregar os usuários CIGAM configurados.",
      );
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, authHeaders]);

  const fetchMlTokens = useCallback(async () => {
    setLoadingMl(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/mercado-livre/tokens`,
        { headers: authHeaders },
      );
      if (!response.ok) {
        throw new Error("Erro ao carregar tokens Mercado Livre.");
      }
      const data = await response.json();
      setMlTokens(data.data || []);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoadingMl(false);
    }
  }, [API_BASE_URL, authHeaders]);

  const fetchShopeeTokens = useCallback(async () => {
    setLoadingShopee(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/shopee/tokens`,
        { headers: authHeaders },
      );
      if (!response.ok) {
        throw new Error("Erro ao carregar tokens Shopee.");
      }
      const data = await response.json();
      setShopeeTokens(data.data || []);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoadingShopee(false);
    }
  }, [API_BASE_URL, authHeaders]);

  const fetchSistemaUsuarios = useCallback(async () => {
    setLoadingSistemaUsuarios(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: authHeaders,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Erro ao carregar usuários do sistema.");
      }

      setSistemaUsuarios(data.data || []);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoadingSistemaUsuarios(false);
    }
  }, [API_BASE_URL, authHeaders]);

  useEffect(() => {
    fetchUsuarios();
    fetchMlTokens();
    fetchShopeeTokens();
    fetchSistemaUsuarios();

    // Check if returning from ML auth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("ml_auth") === "success") {
      setMlAuthSuccess(true);
      fetchMlTokens();
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setMlAuthSuccess(false), 5000);
    }

    // Check if returning from Shopee auth
    if (urlParams.get("shopee_auth") === "success") {
      setShopeeAuthSuccess(true);
      fetchShopeeTokens();
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setShopeeAuthSuccess(false), 5000);
    }
  }, [fetchUsuarios, fetchMlTokens, fetchShopeeTokens, fetchSistemaUsuarios]);

  // Listen for messages from auth popups
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin) {
        if (event.data?.type === "ML_AUTH_SUCCESS") {
          setMlAuthSuccess(true);
          fetchMlTokens();
          setTimeout(() => setMlAuthSuccess(false), 5000);
        }
        if (event.data?.type === "SHOPEE_AUTH_SUCCESS") {
          setShopeeAuthSuccess(true);
          fetchShopeeTokens();
          setTimeout(() => setShopeeAuthSuccess(false), 5000);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchMlTokens, fetchShopeeTokens]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h restantes`;
    if (hours > 0) return `${hours}h ${minutes}min restantes`;
    return `${minutes}min restantes`;
  };

  const activeMlToken = mlTokens.find((t) => t.active);

  // Modal de documentação do Mercado Livre
  const mlDocsModal = showMlDocs && createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => setShowMlDocs(false)}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoMercadoLivre} alt="Mercado Livre" className="h-8 w-8 object-contain" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Documentação API - Mercado Livre
              </h3>
              <p className="text-xs text-slate-500">
                Fluxo de autenticação OAuth2 e rotas utilizadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMlDocs(false)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Visão Geral */}
          <div className="mb-8">
            <h4 className="mb-3 text-base font-bold text-slate-900">Visão Geral</h4>
            <p className="text-sm leading-6 text-slate-600">
              O Chocmaster utiliza a API do Mercado Livre para autenticar vendedores e sincronizar pedidos, 
              produtos e notas fiscais. O fluxo segue o padrão OAuth2 <strong>Authorization Code Grant (Server Side)</strong>, 
              onde o usuário autoriza o aplicativo e o backend troca o código de autorização por tokens de acesso.
            </p>
          </div>

          {/* Fluxo de Autenticação */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Fluxo de Autenticação</h4>
            <div className="space-y-4">
              {[
                { step: "1", title: "Geração da URL de Autorização", desc: "O backend gera a URL de autorização com os parâmetros necessários (APP_ID, redirect_uri, state)." },
                { step: "2", title: "Redirecionamento do Usuário", desc: "O usuário é redirecionado para a página de autorização do Mercado Livre em uma nova aba." },
                { step: "3", title: "Autorização do Usuário", desc: "O usuário faz login no Mercado Livre e autoriza o aplicativo a acessar seus dados." },
                { step: "4", title: "Callback com Código", desc: "O Mercado Livre redireciona o usuário de volta com um código de autorização na URL." },
                { step: "5", title: "Troca de Código por Token", desc: "O backend troca o código de autorização por access_token e refresh_token." },
                { step: "6", title: "Salvamento dos Tokens", desc: "Os tokens são salvos no banco de dados com a data de expiração." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rotas Utilizadas */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Rotas da API do Mercado Livre</h4>
            <div className="space-y-4">
              {/* Rota 1 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://auth.mercadolivre.com.br/authorization</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> URL de autorização onde o usuário é redirecionado para autorizar o aplicativo.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros obrigatórios:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">response_type</code>: "code" - Tipo de resposta esperada</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">client_id</code>: APP_ID da aplicação registrado no Mercado Livre</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">redirect_uri</code>: URL de callback configurada na aplicação</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">state</code>: String aleatória para segurança (recomendado)</li>
                  </ul>
                </div>
              </div>

              {/* Rota 2 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">POST</span>
                  <code className="text-xs text-slate-700">https://api.mercadolivre.com.br/oauth/token</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Endpoint para trocar o código de autorização por tokens, ou renovar o access_token usando o refresh_token.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros obrigatórios (troca de código):</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">grant_type</code>: "authorization_code"</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">client_id</code>: APP_ID da aplicação</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">client_secret</code>: Chave secreta da aplicação</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">code</code>: Código de autorização recebido no callback</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">redirect_uri</code>: Mesma URL de redirect configurada</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros obrigatórios (renovação):</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">grant_type</code>: "refresh_token"</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">client_id</code>: APP_ID da aplicação</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">client_secret</code>: Chave secreta da aplicação</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">refresh_token</code>: Token de renovação válido</li>
                  </ul>
                </div>
                <div className="mt-3 rounded-lg bg-slate-100 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Resposta de Sucesso:</p>
                  <pre className="mt-1 overflow-x-auto text-[0.7rem] text-slate-700">
{`{
  "access_token": "APP_USR-xxx-xxx",
  "token_type": "bearer",
  "expires_in": 21600,
  "scope": "offline_access read write",
  "user_id": 1234567,
  "refresh_token": "TG-xxx-xxx"
}`}
                  </pre>
                </div>
              </div>

              {/* Rota 3 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://api.mercadolivre.com.br/users/me</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Obtém informações do usuário autenticado (nickname, email, etc).
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Cabeçalho obrigatório:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">Authorization</code>: Bearer {"{access_token}"}</li>
                  </ul>
                </div>
              </div>

              {/* Rota 4 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://api.mercadolivre.com.br/orders/search</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Busca pedidos do vendedor autenticado.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de consulta:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">seller</code>: ID do vendedor (obtido via /users/me)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">status</code>: Status do pedido (opcional)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">limit</code>: Quantidade de resultados (padrão: 50)</li>
                  </ul>
                </div>
              </div>

              {/* Rota 5 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://api.mercadolivre.com.br/orders/{"{orderId}"}</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Busca os detalhes completos de um pedido específico, incluindo o array <code className="bg-slate-200 px-1 rounded">shipments</code> que contém os IDs de envio.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de caminho:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">orderId</code>: ID do pedido no Mercado Livre</li>
                  </ul>
                </div>
                <div className="mt-3 rounded-lg bg-slate-100 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Resposta (campos relevantes):</p>
                  <pre className="mt-1 overflow-x-auto text-[0.7rem] text-slate-700">
{`{
  "id": 123456789,
  "status": "paid",
  "shipments": [987654321],
  "buyer": { ... },
  "order_items": [ ... ],
  ...
}`}
                  </pre>
                </div>
              </div>

              {/* Rota 6 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://api.mercadolivre.com.br/shipments/{"{shipmentId}"}</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Busca os detalhes de um envio específico. Utilizado para verificar se o shipment está com status <code className="bg-slate-200 px-1 rounded">ready_to_ship</code> e substatus <code className="bg-slate-200 px-1 rounded">invoice_pending</code>, condição necessária para envio da NF-e.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de caminho:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">shipmentId</code>: ID do envio obtido do pedido</li>
                  </ul>
                </div>
                <div className="mt-3 rounded-lg bg-slate-100 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Resposta (campos relevantes):</p>
                  <pre className="mt-1 overflow-x-auto text-[0.7rem] text-slate-700">
{`{
  "id": 987654321,
  "status": "ready_to_ship",
  "substatus": "invoice_pending",
  "tracking_number": "...",
  "receiver_address": { ... },
  ...
}`}
                  </pre>
                </div>
                <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                  <p className="text-[0.65rem] font-semibold text-yellow-800">⚠️ Condição para envio de NF-e:</p>
                  <p className="mt-1 text-[0.7rem] text-yellow-700">
                    O envio da NF-e só é permitido quando <code className="bg-yellow-100 px-1 rounded">status = "ready_to_ship"</code> E <code className="bg-yellow-100 px-1 rounded">substatus = "invoice_pending"</code>. 
                    Caso contrário, a nota fiscal é salva para reenvio posterior.
                  </p>
                </div>
              </div>

              {/* Rota 7 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">POST</span>
                  <code className="text-xs text-slate-700">https://api.mercadolivre.com.br/shipments/{"{shipmentId}"}/invoice_data/?siteId=MLB</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Envia o XML da NF-e faturada para o Mercado Livre. Após o envio bem-sucedido, a etiqueta de envio fica disponível para impressão no painel do vendedor.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de caminho:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">shipmentId</code>: ID do envio</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">siteId</code>: "MLB" (Brasil)</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Cabeçalhos obrigatórios:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">Content-Type</code>: application/xml</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">Authorization</code>: Bearer {"{access_token}"}</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Body:</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Conteúdo XML completo da NF-e faturada (text/xml)
                  </p>
                </div>
                <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-[0.65rem] font-semibold text-emerald-800">✅ Após envio bem-sucedido:</p>
                  <p className="mt-1 text-[0.7rem] text-emerald-700">
                    A etiqueta de envio fica disponível para impressão no painel do Mercado Livre (Seus Envios).
                    O vendedor pode imprimir a etiqueta e despachar o produto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fluxo Completo de Envio de NF-e */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Fluxo Completo de Envio de NF-e</h4>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <div className="space-y-3">
                {[
                  { step: "1", title: "CIGAM envia webhook de NF-e faturada", desc: "O CIGAM envia o XML da NF-e para o endpoint /api/v1/notas-fiscais-cigam/webhook" },
                  { step: "2", title: "Sistema identifica o pedido vinculado", desc: "O sistema busca o pedido correspondente na tabela de pedidos pelo número CIGAM" },
                  { step: "3", title: "Verifica marketplace de destino", desc: "Se o marketplace for 'mercado_livre', inicia o fluxo de envio de NF-e" },
                  { step: "4", title: "Busca detalhes do pedido no ML", desc: "GET /orders/{orderId} para obter o shipment_id do pedido" },
                  { step: "5", title: "Verifica status do shipment", desc: "GET /shipments/{shipmentId} para validar se está em 'invoice_pending'" },
                  { step: "6", title: "Envia XML da NF-e", desc: "POST /shipments/{shipmentId}/invoice_data com o XML da NF-e" },
                  { step: "7", title: "Atualiza status no sistema", desc: "Marca a NF-e como 'enviada' e atualiza status_nfe do pedido" },
                  { step: "8", title: "Etiqueta disponível", desc: "A etiqueta de envio fica disponível para impressão no painel do ML" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-purple-700">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status do Shipment */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Status do Shipment para Envio de NF-e</h4>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Substatus</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2"><code className="bg-green-100 px-1 rounded text-green-700">ready_to_ship</code></td>
                    <td className="px-4 py-2"><code className="bg-green-100 px-1 rounded text-green-700">invoice_pending</code></td>
                    <td className="px-4 py-2 text-green-600 font-semibold">✅ Pode enviar NF-e</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-yellow-100 px-1 rounded text-yellow-700">ready_to_ship</code></td>
                    <td className="px-4 py-2"><code className="bg-yellow-100 px-1 rounded text-yellow-700">invoice_printed</code></td>
                    <td className="px-4 py-2 text-yellow-600">NF-e já enviada</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-blue-100 px-1 rounded text-blue-700">shipped</code></td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2 text-blue-600">Já enviado</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-red-100 px-1 rounded text-red-700">cancelled</code></td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2 text-red-600">Pedido cancelado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Etiqueta de Envio */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Etiqueta de Envio</h4>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Impressão de Etiqueta</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Após o envio bem-sucedido da NF-e via API, a etiqueta de envio fica automaticamente disponível 
                    para impressão no painel do Mercado Livre, na seção <strong>"Seus Envios"</strong>.
                  </p>
                  <p className="mt-2 text-xs text-emerald-700">
                    O vendedor pode acessar o painel, localizar o pedido e imprimir a etiqueta para colar no pacote 
                    antes de despachar na transportadora ou ponto de coleta.
                  </p>
                  <a
                    href="https://www.mercadolivre.com.br/shipment-details/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Acessar Seus Envios no ML
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Rotas Internas do Chocmaster */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Rotas Internas do Chocmaster</h4>
            <div className="space-y-3">
              {[
                { method: "GET", path: "/api/v1/mercado-livre/auth-url", desc: "Gera a URL de autorização para o usuário" },
                { method: "GET", path: "/api/v1/mercado-livre/callback", desc: "Recebe o callback do ML e troca código por token" },
                { method: "GET", path: "/api/v1/mercado-livre/tokens", desc: "Lista todos os tokens salvos" },
                { method: "GET", path: "/api/v1/mercado-livre/me", desc: "Obtém dados do usuário logado no ML" },
                { method: "GET", path: "/api/v1/mercado-livre/orders", desc: "Lista pedidos do vendedor" },
                { method: "DELETE", path: "/api/v1/mercado-livre/tokens/:id", desc: "Remove/desconecta uma conta ML" },
                { method: "PATCH", path: "/api/v1/mercado-livre/tokens/:id/activate", desc: "Ativa um token específico" },
              ].map((route) => (
                <div key={route.path} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3">
                  <span className={`rounded px-2 py-0.5 text-[0.6rem] font-bold ${
                    route.method === "GET" ? "bg-blue-100 text-blue-700" :
                    route.method === "DELETE" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {route.method}
                  </span>
                  <div>
                    <code className="text-xs font-semibold text-slate-800">{route.path}</code>
                    <p className="mt-0.5 text-[0.7rem] text-slate-500">{route.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variáveis de Ambiente */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Variáveis de Ambiente Necessárias</h4>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="space-y-2">
                {[
                  { var: "ML_APP_ID", desc: "ID da aplicação registrado no Mercado Livre (APP ID)" },
                  { var: "ML_CLIENT_SECRET", desc: "Chave secreta da aplicação (Secret Key)" },
                  { var: "ML_REDIRECT_URI", desc: "URL de callback exata configurada na aplicação ML" },
                ].map((env) => (
                  <div key={env.var} className="flex items-start gap-2">
                    <code className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      {env.var}
                    </code>
                    <p className="text-xs text-amber-700">{env.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="mb-6">
            <h4 className="mb-4 text-base font-bold text-slate-900">Informações Importantes</h4>
            <div className="space-y-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800">⏱️ Tempo de Expiração</p>
                <p className="mt-1 text-xs text-blue-700">
                  O access_token expira em <strong>6 horas</strong> (21600 segundos). 
                  O sistema renova automaticamente usando o refresh_token quando necessário.
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800">🔄 Refresh Token</p>
                <p className="mt-1 text-xs text-blue-700">
                  O refresh_token é de <strong>uso único</strong>. A cada renovação, um novo refresh_token é gerado. 
                  O sistema atualiza automaticamente no banco de dados.
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800">🔒 Segurança</p>
                <p className="mt-1 text-xs text-blue-700">
                  A redirect_uri deve ser <strong>exatamente igual</strong> à configurada na aplicação do Mercado Livre. 
                  Não pode conter informações variáveis.
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800">⚠️ Causas de Invalidação</p>
                <p className="mt-1 text-xs text-blue-700">
                  O token pode ser invalidado se: o usuário alterar a senha, revogar permissões, 
                  o client_secret for atualizado, ou se não houver chamadas à API por 4 meses.
                </p>
              </div>
            </div>
          </div>

          {/* Link para Documentação Oficial */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600">
              Para mais informações, consulte a documentação oficial:
            </p>
            <a
              href="https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              developers.mercadolivre.com.br
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowMlDocs(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  // Modal de documentação da Shopee
  const shopeeDocsModal = showShopeeDocs && createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => setShowShopeeDocs(false)}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoShopee} alt="Shopee" className="h-8 w-8 object-contain" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Documentação API - Shopee
              </h3>
              <p className="text-xs text-slate-500">
                Fluxo de autenticação OAuth2 e rotas utilizadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowShopeeDocs(false)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Visão Geral */}
          <div className="mb-8">
            <h4 className="mb-3 text-base font-bold text-slate-900">Visão Geral</h4>
            <p className="text-sm leading-6 text-slate-600">
              O Chocmaster utiliza a API da Shopee Open Platform para autenticar vendedores e gerenciar pedidos. 
              O fluxo segue o padrão OAuth2 <strong>Authorization Code Grant</strong>, com autenticação via 
              <strong> HMAC-SHA256</strong> (Partner ID + Partner Key + Timestamp).
            </p>
          </div>

          {/* Fluxo de Autenticação */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Fluxo de Autenticação</h4>
            <div className="space-y-4">
              {[
                { step: "1", title: "Geração da URL de Autorização", desc: "O backend gera a URL com partner_id, redirect e timestamp. A assinatura HMAC-SHA256 é calculada." },
                { step: "2", title: "Redirecionamento do Usuário", desc: "O usuário é redirecionado para a página de autorização da Shopee em uma nova aba." },
                { step: "3", title: "Autorização da Loja", desc: "O vendedor faz login na Shopee e autoriza o aplicativo a acessar sua loja." },
                { step: "4", title: "Callback com Código", desc: "A Shopee redireciona de volta com o código de autorização e shop_id na URL." },
                { step: "5", title: "Troca de Código por Token", desc: "O backend troca o código por access_token e refresh_token via POST." },
                { step: "6", title: "Busca de Info da Loja", desc: "O sistema busca o nome da loja via GET /shop/get_shop_info." },
                { step: "7", title: "Salvamento dos Tokens", desc: "Os tokens são salvos no banco com shop_id, shop_name e data de expiração." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assinatura HMAC-SHA256 */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Assinatura HMAC-SHA256</h4>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs text-purple-800 font-semibold mb-2">Cálculo da Assinatura</p>
              <p className="text-xs text-purple-700 mb-3">
                Todas as requisições à API da Shopee requerem uma assinatura HMAC-SHA256. O cálculo é:
              </p>
              <div className="rounded-lg bg-purple-100 p-3">
                <code className="text-xs text-purple-900">
                  sign = HMAC_SHA256(partner_key, partner_id + path + timestamp)
                </code>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-purple-700">• <strong>partner_key</strong>: Chave secreta do parceiro</p>
                <p className="text-xs text-purple-700">• <strong>partner_id</strong>: ID do parceiro (como string)</p>
                <p className="text-xs text-purple-700">• <strong>path</strong>: Caminho da API (ex: /api/v2/auth/token/get)</p>
                <p className="text-xs text-purple-700">• <strong>timestamp</strong>: Timestamp Unix atual em segundos</p>
              </div>
            </div>
          </div>

          {/* Rotas Utilizadas */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Rotas da API da Shopee</h4>
            <div className="space-y-4">
              {/* Rota 1 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://partner.shopeemobile.com/api/v2/shop/auth_partner</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> URL de autorização onde o vendedor é redirecionado para autorizar o aplicativo.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros obrigatórios:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro na Shopee Open Platform</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">redirect</code>: URL de callback configurada na aplicação</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">timestamp</code>: Timestamp Unix atual em segundos</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">state</code>: String aleatória para segurança (recomendado)</li>
                  </ul>
                </div>
              </div>

              {/* Rota 2 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">POST</span>
                  <code className="text-xs text-slate-700">https://partner.shopeemobile.com/api/v2/auth/token/get</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Endpoint para trocar o código de autorização por access_token e refresh_token.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de query (assinatura):</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">timestamp</code>: Timestamp Unix</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">sign</code>: Assinatura HMAC-SHA256</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Body (JSON):</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">code</code>: Código de autorização recebido no callback</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">shop_id</code>: ID da loja Shopee (número)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro (número)</li>
                  </ul>
                </div>
                <div className="mt-3 rounded-lg bg-slate-100 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Resposta de Sucesso:</p>
                  <pre className="mt-1 overflow-x-auto text-[0.7rem] text-slate-700">
{`{
  "access_token": "627679f953717732f5439761...",
  "refresh_token": "627679f953717732f5439762...",
  "expire_in": 2592000,
  "request_id": "abc123"
}`}
                  </pre>
                </div>
              </div>

              {/* Rota 3 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">POST</span>
                  <code className="text-xs text-slate-700">https://partner.shopeemobile.com/api/v2/auth/access_token/get</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Endpoint para renovar o access_token usando o refresh_token.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de query (assinatura):</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">timestamp</code>: Timestamp Unix</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">sign</code>: Assinatura HMAC-SHA256</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Body (JSON):</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">refresh_token</code>: Token de renovação válido</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">shop_id</code>: ID da loja Shopee</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro</li>
                  </ul>
                </div>
              </div>

              {/* Rota 4 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://partner.shopeemobile.com/api/v2/shop/get_shop_info</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Obtém informações da loja autenticada (nome, região, status).
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de query:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">timestamp</code>: Timestamp Unix</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">sign</code>: Assinatura HMAC-SHA256</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">access_token</code>: Token de acesso</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">shop_id</code>: ID da loja</li>
                  </ul>
                </div>
                <div className="mt-3 rounded-lg bg-slate-100 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Resposta:</p>
                  <pre className="mt-1 overflow-x-auto text-[0.7rem] text-slate-700">
{`{
  "shop_id": 12345,
  "shop_name": "Minha Loja",
  "region": "BR",
  "status": "NORMAL",
  "request_id": "abc123"
}`}
                  </pre>
                </div>
              </div>

              {/* Rota 5 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://partner.shopeemobile.com/api/v2/order/get_order_list</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Lista pedidos da loja com filtros de status e data.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de query:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">timestamp</code>: Timestamp Unix</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">sign</code>: Assinatura HMAC-SHA256</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">access_token</code>: Token de acesso</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">shop_id</code>: ID da loja</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">order_status</code>: Status do pedido (opcional)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">time_from</code>: Data início em timestamp (opcional)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">time_to</code>: Data fim em timestamp (opcional)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">page_size</code>: Itens por página (máx: 100)</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">cursor</code>: Cursor para paginação (opcional)</li>
                  </ul>
                </div>
              </div>

              {/* Rota 6 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">GET</span>
                  <code className="text-xs text-slate-700">https://partner.shopeemobile.com/api/v2/order/get_order_detail</code>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Descrição:</strong> Obtém detalhes completos de um pedido específico, incluindo itens, endereço e status de envio.
                </p>
                <div className="mt-2">
                  <p className="text-[0.65rem] font-semibold uppercase text-slate-500">Parâmetros de query:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>• <code className="bg-slate-200 px-1 rounded">partner_id</code>: ID do parceiro</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">timestamp</code>: Timestamp Unix</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">sign</code>: Assinatura HMAC-SHA256</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">access_token</code>: Token de acesso</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">shop_id</code>: ID da loja</li>
                    <li>• <code className="bg-slate-200 px-1 rounded">order_sn_list</code>: Lista de números de pedidos (separados por vírgula)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Rotas Internas do Chocmaster */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Rotas Internas do Chocmaster</h4>
            <div className="space-y-3">
              {[
                { method: "GET", path: "/api/v1/shopee/auth-url", desc: "Gera a URL de autorização para o usuário" },
                { method: "GET", path: "/api/v1/shopee/callback", desc: "Recebe o callback da Shopee e troca código por token" },
                { method: "GET", path: "/api/v1/shopee/tokens", desc: "Lista todos os tokens salvos" },
                { method: "DELETE", path: "/api/v1/shopee/tokens/:id", desc: "Remove/desconecta uma conta Shopee" },
                { method: "PATCH", path: "/api/v1/shopee/tokens/:id/activate", desc: "Ativa um token específico" },
              ].map((route) => (
                <div key={route.path} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3">
                  <span className={`rounded px-2 py-0.5 text-[0.6rem] font-bold ${
                    route.method === "GET" ? "bg-blue-100 text-blue-700" :
                    route.method === "DELETE" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {route.method}
                  </span>
                  <div>
                    <code className="text-xs font-semibold text-slate-800">{route.path}</code>
                    <p className="mt-0.5 text-[0.7rem] text-slate-500">{route.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variáveis de Ambiente */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Variáveis de Ambiente Necessárias</h4>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="space-y-2">
                {[
                  { var: "SHOPEE_PARTNER_ID", desc: "ID do parceiro na Shopee Open Platform" },
                  { var: "SHOPEE_PARTNER_KEY", desc: "Chave secreta do parceiro (usada para gerar assinatura HMAC)" },
                  { var: "SHOPEE_REDIRECT_URI", desc: "URL de callback exata configurada na aplicação Shopee" },
                ].map((env) => (
                  <div key={env.var} className="flex items-start gap-2">
                    <code className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      {env.var}
                    </code>
                    <p className="text-xs text-amber-700">{env.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="mb-6">
            <h4 className="mb-4 text-base font-bold text-slate-900">Informações Importantes</h4>
            <div className="space-y-3">
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold text-orange-800">⏱️ Tempo de Expiração</p>
                <p className="mt-1 text-xs text-orange-700">
                  O access_token da Shopee expira em <strong>30 dias</strong> (2592000 segundos). 
                  O sistema renova automaticamente usando o refresh_token quando necessário.
                </p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold text-orange-800">🔄 Refresh Token</p>
                <p className="mt-1 text-xs text-orange-700">
                  O refresh_token tem validade de <strong>365 dias</strong>. Diferente do Mercado Livre, 
                  o refresh_token da Shopee pode ser usado <strong>múltiplas vezes</strong> até expirar.
                </p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold text-orange-800">🔐 Assinatura HMAC-SHA256</p>
                <p className="mt-1 text-xs text-orange-700">
                  Todas as requisições requerem assinatura HMAC-SHA256 calculada com: 
                  <code className="bg-orange-100 px-1 rounded mx-1">partner_id + path + timestamp</code> 
                  usando o <strong>partner_key</strong> como chave secreta.
                </p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold text-orange-800">📍 Região</p>
                <p className="mt-1 text-xs text-orange-700">
                  O sistema está configurado para a região <strong>Brasil (BR)</strong>. 
                  A URL base é <code className="bg-orange-100 px-1 rounded">partner.shopeemobile.com</code>.
                </p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold text-orange-800">⚠️ Limitações</p>
                <p className="mt-1 text-xs text-orange-700">
                  • O código de autorização expira em <strong>5 minutos</strong><br/>
                  • Cada código só pode ser usado <strong>uma vez</strong><br/>
                  • O shop_id é obrigatório para todas as requisições autenticadas<br/>
                  • A redirect_uri deve ser exatamente igual à configurada na Shopee
                </p>
              </div>
            </div>
          </div>

          {/* Status dos Pedidos */}
          <div className="mb-8">
            <h4 className="mb-4 text-base font-bold text-slate-900">Status dos Pedidos na Shopee</h4>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2"><code className="bg-blue-100 px-1 rounded text-blue-700">UNPAID</code></td>
                    <td className="px-4 py-2 text-slate-600">Pedido aguardando pagamento</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-yellow-100 px-1 rounded text-yellow-700">READY_TO_SHIP</code></td>
                    <td className="px-4 py-2 text-slate-600">Pago, pronto para envio</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-purple-100 px-1 rounded text-purple-700">SHIPPED</code></td>
                    <td className="px-4 py-2 text-slate-600">Enviado pela transportadora</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-green-100 px-1 rounded text-green-700">COMPLETED</code></td>
                    <td className="px-4 py-2 text-slate-600">Entrega confirmada</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-red-100 px-1 rounded text-red-700">CANCELLED</code></td>
                    <td className="px-4 py-2 text-slate-600">Pedido cancelado</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="bg-orange-100 px-1 rounded text-orange-700">INVOICE_PENDING</code></td>
                    <td className="px-4 py-2 text-slate-600">Aguardando nota fiscal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Link para Documentação Oficial */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600">
              Para mais informações, consulte a documentação oficial:
            </p>
            <a
              href="https://open.shopee.com/developer-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-800"
            >
              <ExternalLink className="h-4 w-4" />
              open.shopee.com/developer-guide
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowShopeeDocs(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  const resetNovoUsuarioForm = () => {
    setNovoUsuarioNome("");
    setNovoUsuarioEmail("");
    setNovoUsuarioSenha("");
    setNovoUsuarioRole("usuario");
    setShowNovoUsuarioSenha(false);
    setUsuarioSistemaError(null);
  };

  const handleCloseCreateUsuarioDrawer = () => {
    if (creatingUsuarioSistema) return;
    setShowCreateUsuarioDrawer(false);
    resetNovoUsuarioForm();
  };

  const handleCreateUsuarioSistema = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsuarioSistemaError(null);

    if (novoUsuarioNome.trim().length < 2) {
      setUsuarioSistemaError("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    if (novoUsuarioSenha.length < 6) {
      setUsuarioSistemaError("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCreatingUsuarioSistema(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          nome: novoUsuarioNome.trim(),
          email: novoUsuarioEmail.trim(),
          senha: novoUsuarioSenha,
          role: novoUsuarioRole,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Erro ao criar usuário.");
      }

      setError(null);
      setSuccess(`Usuário "${data?.data?.nome || novoUsuarioNome.trim()}" criado com sucesso.`);
      setShowCreateUsuarioDrawer(false);
      resetNovoUsuarioForm();
      await fetchSistemaUsuarios();
    } catch (error: unknown) {
      setUsuarioSistemaError(
        getErrorMessage(error, "Ocorreu um erro ao criar o usuário."),
      );
    } finally {
      setCreatingUsuarioSistema(false);
    }
  };

  // Drawer de criação de usuário do sistema
  const createUsuarioDrawer = showCreateUsuarioDrawer && createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={handleCloseCreateUsuarioDrawer}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Criar Usuário</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Cadastre um novo usuário com acesso ao painel.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseCreateUsuarioDrawer}
            disabled={creatingUsuarioSistema}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleCreateUsuarioSistema}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {usuarioSistemaError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{usuarioSistemaError}</span>
              </div>
            )}

            <div>
              <label className={labelClassName}>Nome *</label>
              <input
                type="text"
                className={inputClassName}
                value={novoUsuarioNome}
                onChange={(e) => setNovoUsuarioNome(e.target.value)}
                placeholder="Nome completo"
                minLength={2}
                required
                disabled={creatingUsuarioSistema}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClassName}>E-mail *</label>
              <input
                type="email"
                className={inputClassName}
                value={novoUsuarioEmail}
                onChange={(e) => setNovoUsuarioEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                required
                disabled={creatingUsuarioSistema}
              />
            </div>

            <div>
              <label className={labelClassName}>Senha *</label>
              <div className="relative">
                <input
                  type={showNovoUsuarioSenha ? "text" : "password"}
                  className={`${inputClassName} pr-11`}
                  value={novoUsuarioSenha}
                  onChange={(e) => setNovoUsuarioSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  disabled={creatingUsuarioSistema}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNovoUsuarioSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNovoUsuarioSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClassName}>Nível de acesso (role) *</label>
              <select
                className={inputClassName}
                value={novoUsuarioRole}
                onChange={(e) => setNovoUsuarioRole(e.target.value)}
                required
                disabled={creatingUsuarioSistema}
              >
                <option value="usuario">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Administradores têm acesso total ao sistema. Usuários não visualizam as telas de De Para e Configurações.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={handleCloseCreateUsuarioDrawer}
              disabled={creatingUsuarioSistema}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creatingUsuarioSistema}
              className="
                inline-flex items-center gap-2
                rounded-xl bg-[#00B0F1] px-4 py-2.5
                text-sm font-semibold text-white
                shadow-sm transition-all
                hover:bg-[#008FC7]
                focus:outline-none focus:ring-4 focus:ring-[#00B0F1]/20
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {creatingUsuarioSistema ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!urlAmbiente.trim() || !login.trim() || !senha) {
      setSuccess(null);
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/cigam/usuarios/create`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ambiente,
            url_ambiente: urlAmbiente.trim(),
            login: login.trim(),
            senha,
          }),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => null)) as {
          message?: string;
        } | null;

        throw new Error(
          errorData?.message || "Erro ao salvar usuário.",
        );
      }

      setSuccess(
        "Credenciais CIGAM cadastradas com sucesso.",
      );

      setUrlAmbiente("");
      setLogin("");
      setSenha("");
      setShowPassword(false);

      await fetchUsuarios();
      onRefreshGlobal();
    } catch (error: unknown) {
      console.error(error);

      setError(
        getErrorMessage(
          error,
          "Ocorreu um erro ao criar o usuário CIGAM.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (id: string) => {
    setActivatingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/cigam/usuarios/alter-ativo/${id}`,
        {
          method: "PATCH",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          "Erro ao alterar o status do usuário.",
        );
      }

      setSuccess(
        "Ambiente ativo atualizado com sucesso.",
      );

      await fetchUsuarios();
      onRefreshGlobal();
    } catch (error: unknown) {
      console.error(error);

      setError(
        getErrorMessage(
          error,
          "Erro ao tentar ativar o usuário.",
        ),
      );
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm(
      "Deseja realmente remover esta credencial CIGAM?",
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/cigam/usuarios/${id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          "Erro ao remover o usuário.",
        );
      }

      setSuccess("Credencial removida com sucesso.");

      await fetchUsuarios();
      onRefreshGlobal();
    } catch (error: unknown) {
      console.error(error);

      setError(
        getErrorMessage(
          error,
          "Erro ao excluir usuário.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const isProcessing =
    saving ||
    deletingId !== null ||
    activatingId !== null ||
    togglingEnvio;

  const handleToggleEnvioAutomatico = async () => {
    setTogglingEnvio(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/configuracoes/envio-automatico`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ ativo: !envioAutomatico }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao alterar configuração de envio automático.");
      }

      setEnvioAutomatico(!envioAutomatico);
      setSuccess(
        `Envio automático para CIGAM ${!envioAutomatico ? 'ativado' : 'desativado'} com sucesso.`,
      );
    } catch (error: unknown) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao alterar configuração de envio automático.",
      );
    } finally {
      setTogglingEnvio(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da seção */}
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
          shadow-[0_14px_35px_-28px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95)]
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

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <Settings className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Configurações CIGAM
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Gerencie os servidores e as credenciais
                utilizados pela integração com o ERP CIGAM.
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex w-fit
              items-center gap-2
              rounded-full
              border border-slate-200
              bg-white/80
              px-3 py-1.5
              text-xs font-semibold
              text-slate-600
              shadow-sm
            "
          >
            <Server className="h-3.5 w-3.5 text-[#008FC7]" />

            <span>
              {usuarios.length}{" "}
              {usuarios.length === 1
                ? "ambiente configurado"
                : "ambientes configurados"}
            </span>
          </div>
        </div>
      </header>

      {/* Alertas */}
      {error && (
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
              Não foi possível concluir a operação
            </p>

            <p className="mt-0.5 text-sm leading-5 text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="
            flex items-start gap-3
            rounded-2xl
            border border-emerald-200
            bg-emerald-50/95
            p-4
            text-emerald-800
            shadow-[0_12px_28px_-24px_rgba(6,95,70,0.55),inset_0_1px_1px_rgba(255,255,255,0.85)]
          "
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Operação concluída
            </p>

            <p className="mt-0.5 text-sm leading-5 text-emerald-700">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Usuários do Sistema */}
      <div
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border border-slate-200/80
          bg-white/95
          p-5
          shadow-[0_20px_50px_-34px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:p-6
        "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <User className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Usuários do Sistema
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                Crie novos usuários com acesso ao painel do Chocmaster.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateUsuarioDrawer(true)}
            className="
              inline-flex shrink-0 items-center justify-center gap-2
              rounded-xl
              bg-[#00B0F1] px-4 py-2.5
              text-sm font-semibold text-white
              shadow-sm
              transition-all
              hover:bg-[#008FC7]
              focus:outline-none focus:ring-4 focus:ring-[#00B0F1]/20
            "
          >
            <Plus className="h-4 w-4" />
            Criar Usuário
          </button>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          {loadingSistemaUsuarios ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#00B0F1]/20 border-t-[#00B0F1]" />
            </div>
          ) : sistemaUsuarios.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nenhum usuário cadastrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {sistemaUsuarios.map((sistemaUsuario) => (
                <div
                  key={sistemaUsuario.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00B0F1]/10 text-xs font-bold text-[#008FC7]">
                      {sistemaUsuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {sistemaUsuario.nome}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {sistemaUsuario.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.06em] ${
                        sistemaUsuario.role === "admin"
                          ? "border border-[#00B0F1]/30 bg-[#00B0F1]/10 text-[#008FC7]"
                          : "border border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {sistemaUsuario.role === "admin" ? "Admin" : "Usuário"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.06em] ${
                        sistemaUsuario.ativo
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {sistemaUsuario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Envio Automático CIGAM */}
      <div
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border border-slate-200/80
          bg-white/95
          p-5
          shadow-[0_20px_50px_-34px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:p-6
        "
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-2xl
                border border-amber-200
                bg-amber-50
                text-[#E66F00]
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]
              "
            >
              <Zap className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Envio Automático para CIGAM
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                Quando ativado, os pedidos recebidos via webhook são automaticamente enviados para o ERP CIGAM.
                Quando desativado, os pedidos são salvos localmente mas não integrados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleEnvioAutomatico}
            disabled={togglingEnvio}
            className={`
              relative inline-flex h-10 w-[72px] shrink-0 cursor-pointer
              items-center rounded-full
              border-2 border-transparent
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-4 focus:ring-[#00B0F1]/20
              disabled:cursor-not-allowed disabled:opacity-50
              ${envioAutomatico ? 'bg-emerald-500' : 'bg-slate-300'}
            `}
          >
            <span
              className={`
                inline-block h-7 w-7 transform
                rounded-full bg-white
                shadow-lg
                transition-transform duration-200 ease-in-out
                ${envioAutomatico ? 'translate-x-9' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${envioAutomatico ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {envioAutomatico ? 'Ativado' : 'Desativado'}
          </span>
          <span className="text-xs text-slate-400">
            {envioAutomatico ? 'Pedidos serão integrados automaticamente ao CIGAM' : 'Pedidos serão salvos apenas localmente'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Ambientes configurados */}
        <section
          className="
            relative
            overflow-hidden
            rounded-[24px]
            border border-slate-200/80
            bg-white/95
            shadow-[0_20px_50px_-34px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.05)]
            lg:col-span-2
          "
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

          <div className="relative z-10">
            <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-[#00B0F1]/20
                    bg-[#00B0F1]/10
                    text-[#008FC7]
                  "
                >
                  <Server className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ambientes configurados
                  </h3>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    O ambiente marcado como ativo será utilizado
                    nas consultas e sincronizações realizadas pelo
                    integrador.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex min-h-64 flex-col items-center justify-center">
                  <div
                    className="
                      h-9 w-9
                      animate-spin
                      rounded-full
                      border-[3px]
                      border-[#00B0F1]/20
                      border-t-[#00B0F1]
                    "
                  />

                  <p className="mt-4 text-sm font-medium text-slate-600">
                    Carregando configurações
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Aguarde enquanto consultamos os ambientes.
                  </p>
                </div>
              ) : usuarios.length === 0 ? (
                <div
                  className="
                    flex min-h-64
                    flex-col items-center justify-center
                    rounded-2xl
                    border border-dashed border-slate-300
                    bg-slate-50/70
                    px-5 py-12
                    text-center
                  "
                >
                  <div
                    className="
                      flex h-14 w-14
                      items-center justify-center
                      rounded-2xl
                      border border-slate-200
                      bg-white
                      text-slate-400
                      shadow-sm
                    "
                  >
                    <Globe className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Nenhum ambiente configurado
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Utilize o formulário ao lado para cadastrar as
                    credenciais do primeiro ambiente CIGAM.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usuarios.map((usuario) => {
                    const production =
                      isProductionEnvironment(
                        usuario.ambiente,
                      );

                    const isActivating =
                      activatingId === usuario.id;

                    const isDeleting =
                      deletingId === usuario.id;

                    return (
                      <article
                        key={usuario.id}
                        className={`
                          relative
                          overflow-hidden
                          rounded-2xl
                          border
                          p-4
                          transition-all duration-200
                          sm:p-5
                          ${
                            usuario.ativo
                              ? `
                                border-[#00B0F1]/35
                                bg-gradient-to-br
                                from-[#00B0F1]/[0.08]
                                via-white
                                to-white
                                shadow-[0_14px_30px_-24px_rgba(0,176,241,0.65),inset_0_1px_1px_rgba(255,255,255,0.90)]
                              `
                              : `
                                border-slate-200
                                bg-slate-50/65
                                hover:-translate-y-0.5
                                hover:border-slate-300
                                hover:bg-white
                                hover:shadow-[0_14px_30px_-26px_rgba(2,6,23,0.55)]
                              `
                          }
                        `}
                      >
                        {usuario.ativo && (
                          <div
                            aria-hidden="true"
                            className="
                              absolute inset-y-0 left-0
                              w-1
                              bg-gradient-to-b
                              from-[#00B0F1]
                              to-[#008FC7]
                            "
                          />
                        )}

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`
                                  inline-flex items-center
                                  rounded-full
                                  border
                                  px-2.5 py-1
                                  text-[0.65rem] font-bold
                                  uppercase tracking-[0.08em]
                                  ${
                                    production
                                      ? `
                                        border-emerald-200
                                        bg-emerald-50
                                        text-emerald-700
                                      `
                                      : `
                                        border-amber-200
                                        bg-amber-50
                                        text-amber-700
                                      `
                                  }
                                `}
                              >
                                {production
                                  ? "Produção"
                                  : "Homologação"}
                              </span>

                              {usuario.ativo && (
                                <span
                                  className="
                                    inline-flex items-center gap-1.5
                                    rounded-full
                                    border border-[#00B0F1]/20
                                    bg-[#00B0F1]/10
                                    px-2.5 py-1
                                    text-[0.65rem] font-bold
                                    uppercase tracking-[0.08em]
                                    text-[#008FC7]
                                  "
                                >
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00B0F1]" />

                                  Ativo
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex min-w-0 items-start gap-2">
                                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                                <span
                                  className="
                                    min-w-0
                                    break-all
                                    text-sm font-semibold
                                    leading-5
                                    text-slate-800
                                  "
                                  title={usuario.url_ambiente}
                                >
                                  {usuario.url_ambiente}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 shrink-0 text-slate-400" />

                                <span className="text-xs text-slate-500">
                                  Login:
                                </span>

                                <span className="truncate text-xs font-semibold text-slate-700">
                                  {usuario.login}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                            {!usuario.ativo ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleAtivo(
                                    usuario.id,
                                  )
                                }
                                disabled={
                                  activatingId !== null ||
                                  deletingId !== null
                                }
                                aria-busy={isActivating}
                                className="
                                  inline-flex min-h-10
                                  flex-1 items-center justify-center gap-2
                                  rounded-xl
                                  border border-slate-300
                                  bg-white
                                  px-4 py-2
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
                                  sm:flex-none
                                "
                              >
                                {isActivating ? (
                                  <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#00B0F1]/30 border-t-[#00B0F1]" />
                                    Ativando
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Ativar ambiente
                                  </>
                                )}
                              </button>
                            ) : (
                              <div
                                className="
                                  inline-flex min-h-10
                                  flex-1 items-center justify-center gap-2
                                  rounded-xl
                                  border border-emerald-200
                                  bg-emerald-50
                                  px-4 py-2
                                  text-xs font-semibold
                                  text-emerald-700
                                  sm:flex-none
                                "
                              >
                                <Check className="h-4 w-4" />
                                Selecionado
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(usuario.id)
                              }
                              disabled={
                                deletingId !== null ||
                                activatingId !== null
                              }
                              aria-busy={isDeleting}
                              title="Remover credencial"
                              aria-label={`Remover credencial do ambiente ${usuario.ambiente}`}
                              className="
                                inline-flex h-10 w-10 shrink-0
                                items-center justify-center
                                rounded-xl
                                border border-slate-200
                                bg-white
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
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                disabled:hover:translate-y-0
                              "
                            >
                              {isDeleting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cadastro de credencial */}
        <aside className="lg:sticky lg:top-28">
          <div
            className="
              relative
              overflow-hidden
              rounded-[24px]
              border border-slate-200/80
              bg-gradient-to-br
              from-white
              to-slate-50
              shadow-[0_20px_50px_-34px_rgba(2,6,23,0.75),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.05)]
            "
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

            <div className="relative z-10">
              <div className="border-b border-slate-200/80 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex h-10 w-10 shrink-0
                      items-center justify-center
                      rounded-xl
                      border border-orange-200
                      bg-orange-50
                      text-[#E66F00]
                    "
                  >
                    <Plus className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Nova credencial
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Cadastre um servidor ou ambiente CIGAM.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleCreate}
                className="space-y-5 p-5"
              >
                <div>
                  <label
                    htmlFor="ambiente-cigam"
                    className={labelClassName}
                  >
                    Ambiente
                  </label>

                  <div className="relative">
                    <Server className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      id="ambiente-cigam"
                      value={ambiente}
                      onChange={(event) =>
                        setAmbiente(event.target.value)
                      }
                      disabled={saving}
                      className={`
                        ${inputClassName}
                        cursor-pointer
                        appearance-none
                        pl-10 pr-10
                      `}
                    >
                      <option value="homologacao">
                        Homologação
                      </option>

                      <option value="Producao">
                        Produção
                      </option>
                    </select>

                    <span
                      aria-hidden="true"
                      className="
                        pointer-events-none
                        absolute right-4 top-1/2
                        -translate-y-1/2
                        text-xs text-slate-400
                      "
                    >
                      ▼
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="url-ambiente"
                    className={labelClassName}
                  >
                    URL do ambiente
                  </label>

                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="url-ambiente"
                      name="urlAmbiente"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://servidor-cigam.com"
                      value={urlAmbiente}
                      onChange={(event) =>
                        setUrlAmbiente(
                          event.target.value,
                        )
                      }
                      disabled={saving}
                      className={`${inputClassName} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-cigam"
                    className={labelClassName}
                  >
                    Login CIGAM
                  </label>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="login-cigam"
                      name="login"
                      type="text"
                      autoComplete="username"
                      placeholder="UsuarioWS"
                      value={login}
                      onChange={(event) =>
                        setLogin(event.target.value)
                      }
                      disabled={saving}
                      className={`${inputClassName} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="senha-cigam"
                    className={labelClassName}
                  >
                    Senha CIGAM
                  </label>

                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="senha-cigam"
                      name="senha"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Digite a senha"
                      value={senha}
                      onChange={(event) =>
                        setSenha(event.target.value)
                      }
                      disabled={saving}
                      className={`${inputClassName} pl-10 pr-11`}
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (currentValue) =>
                            !currentValue,
                        )
                      }
                      disabled={saving}
                      aria-label={
                        showPassword
                          ? "Ocultar senha"
                          : "Exibir senha"
                      }
                      title={
                        showPassword
                          ? "Ocultar senha"
                          : "Exibir senha"
                      }
                      className="
                        absolute right-2 top-1/2
                        inline-flex h-8 w-8
                        -translate-y-1/2
                        items-center justify-center
                        rounded-lg
                        text-slate-400
                        transition-colors
                        hover:bg-slate-100
                        hover:text-slate-700
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#00B0F1]/20
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className="
                    rounded-xl
                    border border-amber-200
                    bg-amber-50/80
                    p-3
                  "
                >
                  <div className="flex items-start gap-2">
                    <Key className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />

                    <p className="text-[0.7rem] leading-5 text-amber-800">
                      As credenciais serão utilizadas pelo
                      integrador para autenticar as requisições
                      realizadas no ERP CIGAM.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || isProcessing}
                  aria-busy={saving}
                  className="
                    flex h-11 w-full
                    items-center justify-center gap-2
                    rounded-xl
                    border border-slate-950/20
                    bg-gradient-to-b
                    from-slate-700
                    to-slate-950
                    px-4
                    text-sm font-semibold
                    text-white
                    shadow-[0_10px_22px_-12px_rgba(15,23,42,0.85),inset_0_1px_1px_rgba(255,255,255,0.22)]
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:from-slate-600
                    hover:to-slate-900
                    hover:shadow-[0_14px_26px_-14px_rgba(15,23,42,0.95)]
                    focus:outline-none
                    focus:ring-4
                    focus:ring-[#00B0F1]/20
                    active:translate-y-0
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    disabled:hover:translate-y-0
                  "
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />

                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Cadastrar ambiente</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </aside>
      </div>

      {/* Seção de Mercado Livre */}
      <aside
        className="
          relative
          overflow-hidden
          rounded-2xl
          border border-slate-200/80
          bg-gradient-to-br
          from-white
          to-slate-50
          p-5
          shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:p-6
        "
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

        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-xl
                border border-yellow-200
                bg-yellow-50
                p-1.5
              "
            >
              <img src={logoMercadoLivre} alt="Mercado Livre" className="h-full w-full object-contain" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mercado Livre
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Conecte sua conta do Mercado Livre
              </p>
            </div>
          </div>

          {/* Auth success message */}
          {mlAuthSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">
                  Conta Mercado Livre conectada com sucesso!
                </p>
              </div>
            </div>
          )}

          {loadingMl ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-300 border-t-yellow-600" />
            </div>
          ) : activeMlToken ? (
            <div className="space-y-4">
              {/* Connected account info */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeMlToken.nickname || `ID: ${activeMlToken.user_id_ml}`}
                      </p>
                      <p className="text-xs text-emerald-600">Conexão ativa</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Ativo
                  </span>
                </div>

                {activeMlToken.expires_at && (
                  <div className="mt-3 border-t border-emerald-200 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Validade do token:</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {getTimeRemaining(activeMlToken.expires_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reconnect button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/mercado-livre/auth-url`,
                      { headers: authHeaders },
                    );
                    if (!response.ok) {
                      throw new Error("Erro ao gerar URL de autenticação.");
                    }
                    const data = await response.json();
                    if (data.data?.authUrl) {
                      window.open(data.data.authUrl, "_blank");
                    }
                  } catch (error: unknown) {
                    console.error(error);
                  }
                }}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-slate-200
                  bg-white px-4 py-3
                  text-sm font-semibold text-slate-600
                  transition-all hover:bg-slate-50
                "
              >
                <Link className="h-4 w-4" />
                Reconectar Mercado Livre
              </button>

              {/* Documentation button */}
              <button
                type="button"
                onClick={() => setShowMlDocs(true)}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-blue-200
                  bg-blue-50 px-4 py-2.5
                  text-xs font-semibold text-blue-700
                  transition-all hover:bg-blue-100
                "
              >
                <BookOpen className="h-3.5 w-3.5" />
                Documentação API
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/mercado-livre/auth-url`,
                      { headers: authHeaders },
                    );
                    if (!response.ok) {
                      throw new Error("Erro ao gerar URL de autenticação.");
                    }
                    const data = await response.json();
                    if (data.data?.authUrl) {
                      window.open(data.data.authUrl, "_blank");
                    }
                  } catch (error: unknown) {
                    console.error(error);
                  }
                }}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-yellow-300/50
                  bg-yellow-50 px-4 py-3
                  text-sm font-semibold text-yellow-700
                  transition-all hover:bg-yellow-100
                "
              >
                <Link className="h-4 w-4" />
                Conectar Mercado Livre
              </button>

              {/* Documentation button */}
              <button
                type="button"
                onClick={() => setShowMlDocs(true)}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-blue-200
                  bg-blue-50 px-4 py-2.5
                  text-xs font-semibold text-blue-700
                  transition-all hover:bg-blue-100
                "
              >
                <BookOpen className="h-3.5 w-3.5" />
                Documentação API
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Seção de Shopee */}
      <aside
        className="
          relative
          overflow-hidden
          rounded-2xl
          border border-slate-200/80
          bg-gradient-to-br
          from-white
          to-slate-50
          p-5
          shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:p-6
        "
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

        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-xl
                border border-orange-200
                bg-orange-50
                p-1.5
              "
            >
              <img src={logoShopee} alt="Shopee" className="h-full w-full object-contain" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Shopee
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Conecte sua loja Shopee
              </p>
            </div>
          </div>

          {/* Auth success message */}
          {shopeeAuthSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">
                  Conta Shopee conectada com sucesso!
                </p>
              </div>
            </div>
          )}

          {loadingShopee ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
            </div>
          ) : shopeeTokens.length > 0 ? (
            <div className="space-y-4">
              {/* Connected shop info */}
              {shopeeTokens.filter((t) => t.active).map((token) => (
                <div key={token.id} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {token.shop_name || `Loja ID: ${token.shop_id}`}
                        </p>
                        <p className="text-xs text-emerald-600">Conexão ativa</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativo
                    </span>
                  </div>

                  {token.expires_at && (
                    <div className="mt-3 border-t border-emerald-200 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Validade do token:</p>
                        <p className="text-xs font-semibold text-slate-700">
                          {getTimeRemaining(token.expires_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Reconnect button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/shopee/auth-url`,
                      { headers: authHeaders },
                    );
                    if (!response.ok) {
                      throw new Error("Erro ao gerar URL de autenticação.");
                    }
                    const data = await response.json();
                    if (data.data?.authUrl) {
                      window.open(data.data.authUrl, "_blank");
                    }
                  } catch (error: unknown) {
                    console.error(error);
                  }
                }}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-slate-200
                  bg-white px-4 py-3
                  text-sm font-semibold text-slate-600
                  transition-all hover:bg-slate-50
                "
              >
                <Link className="h-4 w-4" />
                Reconectar Shopee
              </button>

              {/* Documentation button */}
              <button
                type="button"
                onClick={() => setShowShopeeDocs(true)}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-orange-200
                  bg-orange-50 px-4 py-2.5
                  text-xs font-semibold text-orange-700
                  transition-all hover:bg-orange-100
                "
              >
                <BookOpen className="h-3.5 w-3.5" />
                Documentação API
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/shopee/auth-url`,
                      { headers: authHeaders },
                    );
                    if (!response.ok) {
                      throw new Error("Erro ao gerar URL de autenticação.");
                    }
                    const data = await response.json();
                    if (data.data?.authUrl) {
                      window.open(data.data.authUrl, "_blank");
                    }
                  } catch (error: unknown) {
                    console.error(error);
                  }
                }}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-orange-300/50
                  bg-orange-50 px-4 py-3
                  text-sm font-semibold text-orange-700
                  transition-all hover:bg-orange-100
                "
              >
                <Link className="h-4 w-4" />
                Conectar Shopee
              </button>

              {/* Documentation button */}
              <button
                type="button"
                onClick={() => setShowShopeeDocs(true)}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl border border-orange-200
                  bg-orange-50 px-4 py-2.5
                  text-xs font-semibold text-orange-700
                  transition-all hover:bg-orange-100
                "
              >
                <BookOpen className="h-3.5 w-3.5" />
                Documentação API
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Modals */}
      {mlDocsModal}
      {shopeeDocsModal}
      {createUsuarioDrawer}
    </div>
  );
};