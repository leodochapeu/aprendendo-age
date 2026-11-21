import { deuses } from "@/data/catalog";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
import { START_GOD_NAME_ALIASES, resolveStartGodPortraitItems } from "@/lib/startGodPortraits";
const deusByNome = new Map(deuses.map((d) => [d.nome, d]));
export function canonicalStartGodName(label) {
    return START_GOD_NAME_ALIASES[label] ?? label;
}
export function startHasGod(s, canonicalName) {
    return s.god.some((g) => canonicalStartGodName(g) === canonicalName);
}
export function matchesStartFilter(s, filterKey) {
    if (!filterKey)
        return true;
    if (filterKey.startsWith("pantheon:")) {
        return s.pantheon === filterKey.slice("pantheon:".length);
    }
    if (filterKey.startsWith("god:")) {
        return startHasGod(s, filterKey.slice("god:".length));
    }
    return true;
}
export function buildStartFilterOptions(starts, panteoes) {
    const pantheonNames = new Set();
    const godNames = new Set();
    for (const s of starts) {
        if (s.pantheon)
            pantheonNames.add(s.pantheon);
        for (const g of s.god)
            godNames.add(canonicalStartGodName(g));
    }
    const panteaoByNome = new Map(panteoes.map((p) => [p.nome, p]));
    const pantheons = [...pantheonNames]
        .sort((a, b) => a.localeCompare(b, "pt"))
        .map((nome) => {
        const panteao = panteaoByNome.get(nome);
        return {
            key: `pantheon:${nome}`,
            kind: "pantheon",
            label: nome,
            iconSrc: panteao ? getPantheonWatermarkUrl(panteao) : undefined,
            tint: pantheonCardTint(nome),
        };
    });
    const gods = [...godNames]
        .sort((a, b) => a.localeCompare(b, "pt"))
        .map((nome) => {
        const portrait = resolveStartGodPortraitItems([nome])[0];
        const deus = deusByNome.get(nome);
        const panteaoNome = deus?.panteao?.[0]?.nome;
        return {
            key: `god:${nome}`,
            kind: "god",
            label: nome,
            iconSrc: portrait?.src ?? undefined,
            tint: panteaoNome ? pantheonCardTint(panteaoNome) : undefined,
        };
    });
    return [...pantheons, ...gods];
}
