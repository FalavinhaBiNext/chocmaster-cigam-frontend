import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  parseRangeParam,
  resolveRange,
  serializeRangeParam,
  type DateRangePreset,
  type DateRangeValue,
} from "./dateRange";

const PARAM = "periodo";

/**
 * Período da tela guardado em ?periodo= — recarregar ou compartilhar o link
 * mantém o filtro. Valor ausente ou inválido usa o padrão da tela. Os demais
 * parâmetros da URL (ex.: ?filtro=falhas) são preservados, e a troca usa
 * `replace` para não encher o histórico do navegador.
 */
export function useDateRangeParam(defaultPreset: DateRangePreset) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(PARAM);

  const range = useMemo<DateRangeValue>(
    () => parseRangeParam(raw) ?? resolveRange(defaultPreset),
    [raw, defaultPreset],
  );

  const setRange = useCallback(
    (next: DateRangeValue) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          const value = serializeRangeParam(next);
          if (value === defaultPreset) params.delete(PARAM);
          else params.set(PARAM, value);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultPreset],
  );

  return [range, setRange] as const;
}
