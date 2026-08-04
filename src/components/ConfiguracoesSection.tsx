import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Plus,
  Key,
  Check,
  Globe,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";

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

export const ConfiguracoesSection: React.FC<ConfiguracoesSectionProps> = ({
  API_BASE_URL,
  onRefreshGlobal,
}) => {
  const [usuarios, setUsuarios] = useState<UsuarioCigam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Form State
  const [ambiente, setAmbiente] = useState("homologacao");
  const [urlAmbiente, setUrlAmbiente] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cigam/usuarios/find-all`);
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários CIGAM");
      }
      const data = await response.json();
      setUsuarios(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível carregar os usuários CIGAM configurados.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlAmbiente || !login || !senha) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cigam/usuarios/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambiente,
          url_ambiente: urlAmbiente,
          login,
          senha,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar usuário");
      }

      setSuccess("Credenciais CIGAM salvas com sucesso!");
      setUrlAmbiente("");
      setLogin("");
      setSenha("");
      setShowPassword(false);
      await fetchUsuarios();
      onRefreshGlobal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao criar o usuário CIGAM.");
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
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao alterar o status do usuário");
      }

      setSuccess("Status do ambiente atualizado com sucesso!");
      await fetchUsuarios();
      onRefreshGlobal();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao tentar ativar o usuário.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover esta credencial CIGAM?")) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cigam/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover o usuário");
      }

      setSuccess("Credencial removida com sucesso!");
      await fetchUsuarios();
      onRefreshGlobal();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao excluir usuário.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {error && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 flex items-center space-x-3 text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-center space-x-3 text-emerald-200">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Ambientes CIGAM Configurados
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Estes são os servidores e credenciais cadastrados para a integração. O ambiente marcado como Ativo será usado para realizar consultas e sincronizações no CIGAM.
            </p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500">
                  Carregando configurações...
                </span>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">
                  Nenhum usuário CIGAM configurado
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Use o formulário ao lado para adicionar o primeiro ambiente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {usuarios.map((user) => (
                  <div
                    key={user.id}
                    className={`relative p-5 border rounded-2xl transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      user.ativo
                        ? "bg-slate-900/85 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                        : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            user.ambiente.toLowerCase() === "producao" || user.ambiente.toLowerCase() === "produção"
                              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                              : "bg-amber-950/40 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {user.ambiente.toLowerCase() === "producao" || user.ambiente.toLowerCase() === "produção"
                            ? "Produção"
                            : "Homologação"}
                        </span>
                        {user.ativo && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-950/50 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                            Ativo para Requisições
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-xs md:max-w-md">
                            {user.url_ambiente}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Login: {user.login}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      {!user.ativo ? (
                        <button
                          onClick={() => handleToggleAtivo(user.id)}
                          disabled={activatingId !== null}
                          className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-750 transition cursor-pointer"
                        >
                          {activatingId === user.id
                            ? "Ativando..."
                            : "Ativar Base"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 px-3 py-1.5 border border-transparent">
                          Ambiente Selecionado
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId !== null}
                        className="p-2 bg-slate-900 hover:bg-red-950/30 hover:border-red-500/30 hover:text-red-400 border border-slate-800 text-slate-400 rounded-xl transition cursor-pointer"
                        title="Remover credencial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add User Column */}
        <div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FF8301]" />
              Nova Credencial CIGAM
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Adicione credenciais para um novo servidor ou ambiente CIGAM.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Ambiente
                </label>
                <select
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="homologacao">Homologação</option>
                  <option value="Producao">Produção</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  URL do Ambiente
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    placeholder="https://servidor-cigam.suaempresa.com"
                    value={urlAmbiente}
                    onChange={(e) => setUrlAmbiente(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Login CIGAM
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="UsuarioWS"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Senha CIGAM
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white text-sm font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Ambiente</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
