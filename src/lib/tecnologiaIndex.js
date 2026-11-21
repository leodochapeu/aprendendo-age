function splitCsvNames(s) {
    return String(s ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}
/** Mapa Notion UUID → índice em `tecnologias.json` (ordem PT canônica). */
export function buildTecnologiaNotionIdIndexMap(tecnologias, construcoes, deuses) {
    const map = new Map();
    function register(notionId, nome) {
        if (!notionId || map.has(notionId))
            return;
        if (nome) {
            const idx = tecnologias.findIndex((t) => t.nome === nome);
            if (idx >= 0) {
                map.set(notionId, idx);
                return;
            }
        }
    }
    for (const c of construcoes) {
        const ids = c.tecnologias_ids ?? (c.tecnologias_id != null ? [c.tecnologias_id] : []);
        const names = splitCsvNames(c.tecnologias);
        ids.forEach((id, i) => register(id, names[i]));
    }
    for (const d of deuses) {
        for (const ref of d.tecnologias ?? []) {
            if (typeof ref.id === "string")
                register(ref.id, ref.nome);
        }
    }
    return map;
}
export function resolveTecnologiaIndex(tecnologias, notionIdByIndex, ref) {
    if (typeof ref.id === "string") {
        const byNotion = notionIdByIndex.get(ref.id);
        if (byNotion != null)
            return byNotion;
    }
    return tecnologias.findIndex((t) => t.nome === ref.nome);
}
