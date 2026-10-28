import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { TOUR_STEPS, type TourStep } from "../components/tour/tourSteps";

// Guardado por usuário: quem já viu (ou pulou) o tour não o recebe de novo
// automaticamente, mas pode reabri-lo pelo menu.
const TOUR_DONE_STORAGE_PREFIX = "chocmaster:tour-concluido:";

interface TourContextType {
  active: boolean;
  steps: TourStep[];
  index: number;
  /** Rota do tour da página em andamento; null no tour completo. */
  scope: string | null;
  /** Sem rota: tour completo. Com rota: só os passos daquela tela. */
  start: (route?: string) => void;
  hasPageTour: (route: string) => boolean;
  next: () => void;
  prev: () => void;
  finish: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

function readDone(userId: string) {
  try {
    return localStorage.getItem(TOUR_DONE_STORAGE_PREFIX + userId) === "true";
  } catch {
    return false;
  }
}

function writeDone(userId: string) {
  try {
    localStorage.setItem(TOUR_DONE_STORAGE_PREFIX + userId, "true");
  } catch {
    // Sem storage o tour apenas volta a abrir no próximo acesso.
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [scope, setScope] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const allowedSteps = useMemo(() => TOUR_STEPS.filter((step) => !step.adminOnly || isAdmin), [isAdmin]);

  // Tour completo: visão geral (sem os passos detalhados). Tour da página:
  // todos os passos daquela rota, incluindo os detalhados.
  const steps = useMemo(
    () => (scope ? allowedSteps.filter((step) => step.route === scope) : allowedSteps.filter((step) => !step.pageOnly)),
    [allowedSteps, scope],
  );

  // Primeiro acesso: abre o tour completo assim que o usuário é carregado.
  useEffect(() => {
    if (user?.id && !readDone(user.id)) {
      setScope(null);
      setIndex(0);
      setActive(true);
    }
  }, [user?.id]);

  const start = useCallback((route?: string) => {
    setScope(route ?? null);
    setIndex(0);
    setActive(true);
  }, []);

  const hasPageTour = useCallback(
    (route: string) => allowedSteps.some((step) => step.route === route),
    [allowedSteps],
  );

  const finish = useCallback(() => {
    setActive(false);
    if (!scope && user?.id) writeDone(user.id);
  }, [scope, user?.id]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) {
      finish();
    } else {
      setIndex(index + 1);
    }
  }, [index, steps.length, finish]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  return (
    <TourContext.Provider value={{ active, steps, index, scope, start, hasPageTour, next, prev, finish }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
