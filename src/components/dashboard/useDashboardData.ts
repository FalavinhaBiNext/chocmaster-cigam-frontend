import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";
import type { DashboardEvent, DashboardPedido, IntegrationHealth } from "./types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface DashboardData {
  events: DashboardEvent[];
  pedidos: DashboardPedido[];
  integrations: IntegrationHealth[];
}

const EMPTY: DashboardData = { events: [], pedidos: [], integrations: [] };

async function getJson<T>(url: string, headers: HeadersInit): Promise<T> {
  const response = await fetch(url, { headers });
  const result = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `Falha ao carregar ${url}`);
  }
  return result.data as T;
}

/**
 * Carrega de uma vez os dados do dashboard. Em uma recarga, os dados
 * anteriores continuam na tela (refreshing=true) em vez de piscar um skeleton.
 */
export function useDashboardData() {
  const { token } = useAuth();
  const headers = useMemo<HeadersInit>(
    () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
    [token],
  );

  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const [events, pedidos, integrations] = await Promise.all([
        getJson<DashboardEvent[]>(`${API_BASE_URL}/events`, headers),
        getJson<DashboardPedido[]>(`${API_BASE_URL}/pedidos`, headers),
        getJson<IntegrationHealth[]>(`${API_BASE_URL}/integrations/health`, headers).catch(() => []),
      ]);
      setData({ events: events ?? [], pedidos: pedidos ?? [], integrations: integrations ?? [] });
      setUpdatedAt(new Date());
    } catch (err: unknown) {
      console.error(err);
      setError("Não foi possível carregar os dados do dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [headers]);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { ...data, loading, refreshing, error, updatedAt, refresh };
}
