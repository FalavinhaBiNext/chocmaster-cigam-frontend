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
  start: () => void;
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

  const isAdmin = user?.role === "admin";
  const steps = useMemo(() => TOUR_STEPS.filter((step) => !step.adminOnly || isAdmin), [isAdmin]);

  // Primeiro acesso: abre o tour assim que o usuário é carregado.
  useEffect(() => {
    if (user?.id && !readDone(user.id)) {
      setIndex(0);
      setActive(true);
    }
  }, [user?.id]);

  const start = useCallback(() => {
    setIndex(0);
    setActive(true);
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    if (user?.id) writeDone(user.id);
  }, [user?.id]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) {
      finish();
    } else {
      setIndex(index + 1);
    }
  }, [index, steps.length, finish]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  return (
    <TourContext.Provider value={{ active, steps, index, start, next, prev, finish }}>
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
