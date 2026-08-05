import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, AlertCircle } from "lucide-react";
import Background from '../assets/FundoLoginChocmaster.jpg'
import Logo from '../assets/LogoSFundoBlack.png'
import logoBling from '../assets/LogoBlingBlack.png'
import logoCigam from '../assets/LogoCigamBlack.png'
import LogoChoc from '../assets/LogoChocBlack.png'

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, senha);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center bg-cover bg-center bg-no-repeat"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-[0.45]"
        style={{
          backgroundImage: `url(${Background})`,
        }}
      />
      {/* Vinheta branca nas bordas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.35) 18%, transparent 38%, transparent 62%, rgba(255,255,255,0.05) 82%, rgba(255,255,255,0.25) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">


        <div
  className="
    relative
    overflow-hidden
    rounded-2xl
    border border-white/70
    bg-gradient-to-br from-white/95 to-slate-100/90
    p-8
    shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(15,23,42,0.10)]
    ring-1 ring-slate-900/5
  "
>
  {/* Borda interna em alto-relevo */}
  <div
    aria-hidden="true"
    className="
      pointer-events-none
      absolute inset-1.5
      rounded-[0.8rem]
      border border-black/10
      shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(15,23,42,0.10)]
    "
  />

  {/* Conteúdo do card */}
  <div className="relative z-10">
    <div className="mb-8 flex flex-col items-center justify-center text-center">
      <img
        src={Logo}
        alt="Logo Chocmaster"
        className="h-32 w-auto object-contain"
      />

      <p className="text-3xl font-bold font-sans tracking-wide text-slate-800">
        Acesso ao Integrador
      </p>

      <p className="mt-1 text-base font-light text-slate-600">
        Bling{" "}
        <span className="font-medium text-slate-400">
          {"< >"}
        </span>{" "}
        ERP CIGAM
      </p>
    </div>

    {error && (
      <div className="mb-6 flex items-center space-x-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-red-200">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold text-slate-700"
        >
          Email corporativo
        </label>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full
              rounded-lg
              border border-slate-300
              bg-white/90
              py-2.5 pl-10 pr-3
              text-sm text-slate-800
              shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]
              placeholder:text-slate-400
              transition
              focus:border-indigo-500
              focus:outline-none
              focus:ring-4
              focus:ring-indigo-500/10
            "
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="senha"
          className="mb-2 block text-xs font-semibold text-slate-700"
        >
          Senha
        </label>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            id="senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="
              w-full
              rounded-lg
              border border-slate-300
              bg-white/90
              py-2.5 pl-10 pr-3
              text-sm text-slate-800
              shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]
              placeholder:text-slate-400
              transition
              focus:border-indigo-500
              focus:outline-none
              focus:ring-4
              focus:ring-indigo-500/10
            "
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <button
          type="submit"
          disabled={loading}
          className="
            flex w-2/3
            cursor-pointer
            items-center justify-center gap-2
            rounded-full
            bg-gradient-to-b from-slate-700 to-slate-950
            py-2.5
            text-sm font-semibold text-white
            shadow-[0_8px_18px_-8px_rgba(15,23,42,0.75),inset_0_1px_1px_rgba(255,255,255,0.25)]
            transition
            duration-200
            hover:-translate-y-0.5
            hover:from-slate-600
            hover:to-slate-900
            hover:shadow-[0_12px_22px_-10px_rgba(15,23,42,0.8)]
            focus:outline-none
            focus:ring-4
            focus:ring-slate-500/20
            disabled:cursor-not-allowed
            disabled:opacity-60
            disabled:hover:translate-y-0
          "
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "Entrar"
          )}
        </button>
      </div>
    </form>

    <div className="mt-6 flex items-center justify-center gap-8 border-t border-slate-200/80 pt-6">
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

      <img
        src={LogoChoc}
        alt="Logo Chocmaster"
        className="h-9 w-auto object-contain"
      />
    </div>

    <div className="mt-8 flex items-center justify-center">
      <p className="text-xs text-slate-500">
        Desenvolvido com{" "}
        <span className="font-medium text-slate-400">
          {"< >"}
        </span>{" "}
        por{" "}
        <span className="font-semibold text-slate-900 transition-colors hover:text-[#00B0F1]">
          Hubnext
        </span>
      </p>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}
