export const LIST_VIEW_MODE_STORAGE_PREFIX = "aprendendo-age:list-view:";
/** Query que abre a listagem já num modo (`/unidades?view=planilha`). */
export const LIST_VIEW_MODE_PARAM = "view";
export function listViewModeStorageKey(pageKey) {
    return `${LIST_VIEW_MODE_STORAGE_PREFIX}${pageKey}`;
}
export function parseListViewMode(raw) {
    return raw === "planilha" ? "planilha" : "grade";
}
/** Lê `?view=planilha` ou `?view=grade`. Qualquer outro valor é ignorado. */
export function listViewModeFromSearch(search) {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const raw = params.get(LIST_VIEW_MODE_PARAM);
    if (raw === "planilha" || raw === "grade")
        return raw;
    return null;
}
/** Acrescenta ou substitui `view` numa path, preservando a query que já existir. */
export function withListViewMode(path, mode) {
    const q = path.indexOf("?");
    const base = q === -1 ? path : path.slice(0, q);
    const params = new URLSearchParams(q === -1 ? "" : path.slice(q + 1));
    params.set(LIST_VIEW_MODE_PARAM, mode);
    const search = params.toString();
    return search ? `${base}?${search}` : base;
}
