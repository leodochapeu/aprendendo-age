import { useCallback, useState } from "react";
import { listViewModeFromSearch, listViewModeStorageKey, parseListViewMode, } from "@/lib/listViewMode";
/**
 * Alterna entre grade e planilha por página (`pageKey`, ex. `"deuses"`).
 * Persiste em `localStorage` para reabrir no mesmo modo.
 * Se `search` trouxer `?view=planilha` ou `?view=grade`, esse valor vence o storage.
 *
 * @example
 * const [viewMode, setViewMode] = useListViewMode("deuses");
 */
export function useListViewMode(pageKey, search = "") {
    const storageKey = listViewModeStorageKey(pageKey);
    const [mode, setModeState] = useState(() => {
        const fromUrl = listViewModeFromSearch(search);
        if (fromUrl) {
            try {
                localStorage.setItem(storageKey, fromUrl);
            }
            catch {
                /* storage indisponível */
            }
            return fromUrl;
        }
        try {
            return parseListViewMode(localStorage.getItem(storageKey));
        }
        catch {
            return "grade";
        }
    });
    const setMode = useCallback((next) => {
        setModeState(next);
        try {
            localStorage.setItem(storageKey, next);
        }
        catch {
            /* storage indisponível */
        }
    }, [storageKey]);
    return [mode, setMode];
}
