import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Link2,
  Activity,
  FileText,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";

import Logo from "../assets/LogoSFundoBlack.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/de-para", label: "De Para", icon: ArrowLeftRight },
  { to: "/mapeados", label: "Mapeados", icon: Link2 },
  { to: "/eventos", label: "Eventos", icon: Activity },
  { to: "/nfe", label: "NF-e CIGAM", icon: FileText },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const { activeEnv, handleSelectEnvironment } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[70] flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-slate-100 lg:hidden"
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-[60] flex h-full flex-col
          border-r border-white/60
          bg-white/[0.92]
          shadow-[10px_0_35px_-20px_rgba(2,6,23,0.45)]
          backdrop-blur-xl
          transition-all duration-300
          ${mobileOpen ? "w-[260px] translate-x-0" : "-translate-x-full w-[260px]"}
          lg:translate-x-0
          ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"}
        `}
      >
        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute top-8 -right-3 z-[61] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800 lg:flex"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Logo */}
        <div className={`flex items-center gap-3 border-b border-slate-100 px-5 py-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <img src={Logo} alt="Logo" className="h-10 w-auto shrink-0" />
          <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900">
              CHOCMASTER
              <span className="mx-1.5 font-light text-slate-300">|</span>
              CIGAM
            </h1>
            <p className="mt-0.5 truncate text-[0.65rem] text-slate-400 italic">
              Integrador CIGAM
            </p>
          </div>
        </div>

        {/* Environment selector */}
        <div
          className={`mx-4 mt-4 flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => handleSelectEnvironment("homologacao")}
            aria-pressed={activeEnv === "homologacao"}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-[0.65rem] font-semibold transition-all duration-200 ${
              activeEnv === "homologacao"
                ? "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_5px_12px_-6px_rgba(217,119,6,0.80),inset_0_1px_1px_rgba(255,255,255,0.30)]"
                : "cursor-pointer text-slate-500 hover:bg-white/70 hover:text-slate-800"
            }`}
          >
            Homologação
          </button>
          <button
            type="button"
            onClick={() => handleSelectEnvironment("producao")}
            aria-pressed={activeEnv === "producao"}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-[0.65rem] font-semibold transition-all duration-200 ${
              activeEnv === "producao"
                ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_5px_12px_-6px_rgba(16,185,129,0.80),inset_0_1px_1px_rgba(255,255,255,0.30)]"
                : "cursor-pointer text-slate-500 hover:bg-white/70 hover:text-slate-800"
            }`}
          >
            Produção
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-[#00B0F1]/10 text-[#008FC7] shadow-[inset_0_0_0_1px_rgba(0,176,241,0.18)]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-100 p-4">
          <div className={`mb-3 flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00B0F1]/10 text-[0.65rem] font-bold text-[#008FC7]">
              {user?.nome?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.nome || "Usuário"}
              </p>
              <p className="truncate text-[0.65rem] text-slate-400">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Sair" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
