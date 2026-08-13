import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Key,
  Plus,
  Server,
  Settings,
  Trash2,
  User,
  Zap,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

interface UsuarioCigam {
  id: string;
  ambiente: string;
  login: string;
  senha?: string;
  url_ambiente: string;
  ativo: boolean;
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
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );
  const [activatingId, setActivatingId] = useState<
    string | null
  >(null);

  const [ambiente, setAmbiente] = useState("homologacao");
  const [urlAmbiente, setUrlAmbiente] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

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
    </div>
  );
};