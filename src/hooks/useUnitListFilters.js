import { useCallback, useState } from "react";
import { emptyUnitListFilters, parseUnitListFilters } from "@/lib/unidadeFilters";
const STORAGE_KEY = "aprendendo-age:unit-filters";
function readStoredFilters() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? parseUnitListFilters(raw) : emptyUnitListFilters();
    }
    catch {
        return emptyUnitListFilters();
    }
}
/**
 * Filtros do modal de Unidades. Ficam na sessão para sobreviver ao detalhe
 * e ao botão «← Unidades».
 */
export function useUnitListFilters() {
    const [filters, setFilters] = useState(readStoredFilters);
    const setUnitFilters = useCallback((next) => {
        setFilters(next);
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        catch {
            /* sessionStorage indisponível */
        }
    }, []);
    return [filters, setUnitFilters];
}
