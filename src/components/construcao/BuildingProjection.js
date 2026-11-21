import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense, useMemo, useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { buildingVariants, variantModelUrl } from "@/lib/buildingVariants";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
const BuildingViewer = lazy(() => import("@/components/unidade/UnidadeModelViewer").then((mod) => ({ default: mod.UnidadeModelViewer })));
/** Graus acima da horizontal. Perto de 30° lê como isométrica sem virar vista de cima. */
const BUILDING_PITCH = 28;
const EMPTY_PANTHEONS = [];
const BUTTON = "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40";
function pressedClass(pressed) {
    return pressed
        ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/60"
        : "border-aom-border bg-black/25 hover:border-amber-400/40 hover:bg-amber-500/10";
}
function catalogKey(ingles) {
    return (ingles ?? "").toLowerCase().replace(/[^a-z]/g, "");
}
export function BuildingProjection({ buildingId, fallbackUrl, defaultPantheonId, visuals, activeVisual, onVisual, }) {
    const { t, locale } = useTranslation();
    const { panteaoById, tecnologias } = useCatalog();
    const entry = buildingVariants(buildingId);
    const pantheons = entry?.pantheons ?? EMPTY_PANTHEONS;
    const initialPantheon = pantheons.includes(defaultPantheonId ?? -1) ? defaultPantheonId : (pantheons[0] ?? 0);
    const [pantheonId, setPantheonId] = useState(initialPantheon);
    const [upgrade, setUpgrade] = useState(null);
    const byCatalog = useMemo(() => {
        const map = new Map();
        for (const tech of tecnologias) {
            const key = catalogKey(tech.ingles);
            if (!key || map.has(key))
                continue;
            map.set(key, { nome: tech.nome, icon: tech.icon ? resolveTokenIconSrc(tech.icon) : undefined });
        }
        return map;
    }, [tecnologias]);
    const upgrades = (entry?.upgrades ?? [])
        .filter((item) => item.pantheons.includes(pantheonId))
        .sort((a, b) => a.rank - b.rank || a.tag.localeCompare(b.tag));
    const activeUpgrade = upgrades.some((item) => item.tag === upgrade) ? upgrade : null;
    const url = variantModelUrl(entry, pantheonId, activeUpgrade, fallbackUrl);
    const upgradeView = (item) => {
        const info = item.catalog ? byCatalog.get(catalogKey(item.catalog)) : undefined;
        const label = info?.nome ?? item.label?.[locale] ?? item.tag;
        const icon = info?.icon ?? (item.icon ? resolveTokenIconSrc(item.icon) : undefined);
        const pressed = activeUpgrade === item.tag;
        return (_jsx("button", { type: "button", title: label, "aria-label": label, "aria-pressed": pressed, onClick: () => setUpgrade(pressed ? null : item.tag), className: `${BUTTON} ${pressedClass(pressed)}`, children: icon ? (_jsx("img", { src: icon, alt: "", className: "h-7 w-7 object-contain" })) : (_jsx("span", { className: "px-1 text-[10px] leading-tight text-amber-100/90", children: label })) }, `${item.tag}-${item.catalog ?? item.pantheons.join("-")}`));
    };
    const visualButtons = visuals?.length ? (_jsx("div", { className: "mb-3 flex flex-wrap justify-end gap-1.5", children: visuals.map((item) => {
            const pressed = activeVisual === item.id;
            return (_jsx("button", { type: "button", title: item.label, "aria-label": item.label, "aria-pressed": pressed, onClick: () => onVisual?.(item.id), className: `${BUTTON} ${pressedClass(pressed)}`, children: item.icon ? (_jsx("img", { src: item.icon, alt: "", className: "h-7 w-7 object-contain" })) : (_jsx("span", { className: "px-1 text-[10px] leading-tight text-amber-100/90", children: item.label })) }, item.id));
        }) })) : null;
    return (_jsxs("div", { children: [visualButtons, entry && !visuals?.length ? (_jsxs("div", { className: "mb-3 flex items-start gap-3", children: [_jsx("div", { className: "flex min-w-0 flex-1 flex-wrap gap-1.5", children: upgrades.map(upgradeView) }), _jsx("div", { className: "ml-auto flex shrink-0 flex-wrap justify-end gap-1.5", children: pantheons.map((id) => {
                            const pantheon = panteaoById.get(id);
                            const label = pantheon?.nome ?? String(id);
                            const icon = pantheon ? getPantheonWatermarkUrl(pantheon) : undefined;
                            const pressed = pantheonId === id;
                            return (_jsx("button", { type: "button", title: label, "aria-label": label, "aria-pressed": pressed, onClick: () => setPantheonId(id), className: `${BUTTON} ${pressedClass(pressed)}`, children: icon ? _jsx("img", { src: icon, alt: "", className: "h-7 w-7 object-contain" }) : _jsx("span", { className: "px-1 text-[10px]", children: label }) }, id));
                        }) })] })) : null, url ? (_jsx(Suspense, { fallback: _jsx("p", { className: "text-zinc-500", children: t("common.loading") }), children: _jsx(BuildingViewer, { urls: [url], pitch: BUILDING_PITCH }) })) : null] }));
}
