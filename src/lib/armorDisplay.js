/** Exibe valor de armadura com sufixo % (o catálogo costuma guardar só o número). */
export function formatArmorPercent(value) {
    if (value == null || value === "")
        return "—";
    const t = String(value).trim();
    if (t === "" || t === "—" || t === "-")
        return "—";
    if (t.endsWith("%"))
        return t;
    return `${t}%`;
}
