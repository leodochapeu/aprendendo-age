/** Linhas de efeito mecânico (`campo`) em tecnologias.json. */
export function normalizeCampoLines(campo) {
    if (campo == null)
        return [];
    if (Array.isArray(campo))
        return campo.map((s) => s.trim()).filter(Boolean);
    if (typeof campo !== "string" || !campo.trim())
        return [];
    return campo
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
}
export function campoSearchBlob(campo) {
    return normalizeCampoLines(campo).join(" ");
}
