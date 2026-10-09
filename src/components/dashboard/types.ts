export type SyncStatus = "pendente" | "sincronizado" | "falha";

export interface DashboardEvent {
  id: string;
  pedido_id: number;
  data_pedido: string | null;
  numero_pedido: number;
  numero_loja: string;
  total_pedido: number;
  cigam_sincronizado: boolean;
  sync_status: SyncStatus;
  error_message: string | null;
  created_at: string;
}

export interface DashboardPedido {
  id_bling: string;
  nome_cliente: string;
  total_venda: number;
  marketplace: string | null;
  status_nfe: string | null;
}

export type IntegrationName = "bling" | "mercado_livre" | "shopee" | "tray";

export interface IntegrationHealth {
  integration: IntegrationName;
  connected: boolean;
  status: "ok" | "expiring_soon" | "expired";
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  label: string | null;
}

export type PeriodDays = 7 | 30 | 90;
