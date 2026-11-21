const ORDER = ["economico", "ofensivo", "defensivo", "utilidade"];
export const TECNOLOGIA_TIPO_DEFS = {
    economico: {
        kind: "economico",
        label: "Econômico",
        emoji: "💰",
        description: "Beneficia a coleta de recursos, taxa ou melhoria na economia.",
        shellClass: "border-emerald-600/55 bg-emerald-950/60 text-emerald-100",
    },
    ofensivo: {
        kind: "ofensivo",
        label: "Ofensivo",
        emoji: "⚔",
        description: "Melhora diretamente a força de combate, aumentando dano ou multiplicadores.",
        shellClass: "border-red-600/55 bg-red-950/55 text-red-100",
    },
    defensivo: {
        kind: "defensivo",
        label: "Defensivo",
        emoji: "🛡",
        description: "Melhora a capacidade de defesa, seja vida ou armaduras.",
        shellClass: "border-amber-700/55 bg-amber-950/50 text-amber-100",
    },
    utilidade: {
        kind: "utilidade",
        label: "Utilidade",
        emoji: "🔧",
        description: "Melhora de alguma forma, seja em atributos, descontos ou adicionando alguma passiva nova.",
        shellClass: "border-sky-600/50 bg-sky-950/45 text-sky-100",
    },
};
export function parseTecnologiaTipos(raw) {
    if (!raw?.trim())
        return [];
    const n = raw.normalize("NFD").replace(/\p{M}/gu, "");
    const found = [];
    if (/Econ.mico/i.test(n))
        found.push("economico");
    if (/Ofensivo/i.test(n))
        found.push("ofensivo");
    if (/Defensivo/i.test(n))
        found.push("defensivo");
    if (/Utilidade/i.test(n))
        found.push("utilidade");
    return ORDER.filter((k) => found.includes(k));
}
export function hasTecnologiaTipo(raw) {
    return parseTecnologiaTipos(raw).length > 0;
}
