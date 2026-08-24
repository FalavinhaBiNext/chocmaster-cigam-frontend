import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MercadoLivreCallbackPage } from "./pages/MercadoLivreCallbackPage";
import { ShopeeCallbackPage } from "./pages/ShopeeCallbackPage";
import { AppProvider } from "./contexts/AppContext";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { DeParaPage } from "./pages/DeParaPage";
import { MapeadosPage } from "./pages/MapeadosPage";
import { EventosPage } from "./pages/EventosPage";
import { NfePage } from "./pages/NfePage";
import { PedidosPage } from "./pages/PedidosPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/mercado-livre/callback" element={<MercadoLivreCallbackPage />} />
      <Route path="/shopee/callback" element={<ShopeeCallbackPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppProvider>
              <AppLayout />
            </AppProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="de-para" element={<DeParaPage />} />
        <Route path="mapeados" element={<MapeadosPage />} />
        <Route path="eventos" element={<EventosPage />} />
        <Route path="nfe" element={<NfePage />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
    </Routes>
  );
}
