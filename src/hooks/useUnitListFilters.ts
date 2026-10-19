import { useCallback, useState } from "react";

import { emptyUnitListFilters, parseUnitListFilters, type UnitListFilters } from "@/lib/unidadeFilters";

const STORAGE_KEY = "aprendendo-age:unit-filters";

function readStoredFilters(): UnitListFilters {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? parseUnitListFilters(raw) : emptyUnitListFilters();
  } catch {
    return emptyUnitListFilters();
  }
}

/**
 * Filtros do modal de Unidades. Ficam na sessão para sobreviver ao detalhe
 * e ao botão «← Unidades».
 */
export function useUnitListFilters(): [UnitListFilters, (next: UnitListFilters) => void] {
  const [filters, setFilters] = useState<UnitListFilters>(readStoredFilters);

  const setUnitFilters = useCallback((next: UnitListFilters) => {
    setFilters(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* sessionStorage indisponível */
    }
  }, []);

  return [filters, setUnitFilters];
}
