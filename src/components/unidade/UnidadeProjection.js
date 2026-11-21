import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { UnidadeModelViewer } from "@/components/unidade/UnidadeModelViewer";
import tokenAssetMap from "@/data/token_asset_map.json";
import { useCatalog } from "@/hooks/useCatalog";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { useTranslation } from "@/hooks/useTranslation";
import { unitIdleVfx } from "@/lib/unitIdleVfx";
import { projectionUrls, toggleTechTag, unitTechVisual } from "@/lib/unitModelTechs";
function catalogKey(ingles) {
    return (ingles ?? "").toLowerCase().replace(/[^a-z]/g, "");
}
function iconKey(token) {
    let core = token.toLowerCase();
    if (core.startsWith("aomr_"))
        core = core.slice(5);
    if (core.endsWith("_icon"))
        core = core.slice(0, -5);
    return core.replace(/[^a-z]/g, "");
}
const iconByTag = new Map();
for (const [token, src] of Object.entries(tokenAssetMap)) {
    if (typeof src !== "string")
        continue;
    const tag = iconKey(token);
    if (!tag || iconByTag.has(tag))
        continue;
    const label = token
        .replace(/^aomr_/, "")
        .replace(/_icon$/, "")
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    iconByTag.set(tag, { src, label });
}
/** Voadores: Pégaso, Ícaro, Fênix, Pássaro de Estínfalo, Qinglong, Yinglong, Zhuque e Onmoraki. */
const HOVER_UNITS = new Set([8, 28, 70, 132, 172, 174, 175, 206]);
const STANCE_BUTTON = "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40";
export function UnidadeProjection({ unitId, fallbackUrl, hero = false }) {
    const { tecnologias } = useCatalog();
    const { t } = useTranslation();
    const visual = unitTechVisual(unitId);
    const [selected, setSelected] = useState([]);
    const [stance, setStance] = useState("hack");
    const [sex, setSex] = useState("male");
    useEffect(() => {
        setSelected([]);
        setStance("hack");
        setSex("male");
    }, [unitId]);
    const urls = projectionUrls(visual, selected, fallbackUrl, stance, sex);
    const hackIcon = resolveTokenIconSrc("hackdamage");
    const pierceIcon = resolveTokenIconSrc("piercedamage");
    const vfx = useMemo(() => unitIdleVfx(unitId), [unitId]);
    const byCatalog = useMemo(() => {
        const map = new Map();
        const put = (key, nome, icon, prefer) => {
            if (!key)
                return;
            if (map.has(key) && !prefer)
                return;
            map.set(key, { nome, icon });
        };
        for (const tech of tecnologias) {
            const icon = tech.icon ? resolveTokenIconSrc(tech.icon) : undefined;
            const prefer = tech.panteoes === "Geral";
            put(catalogKey(tech.ingles), tech.nome, icon, prefer);
            put(iconKey(tech.icon), tech.nome, icon, prefer);
        }
        return map;
    }, [tecnologias]);
    const onToggle = (group, tag) => {
        if (!visual)
            return;
        setSelected((current) => toggleTechTag(visual.groups, current, group.id, tag));
    };
    return (_jsxs("div", { children: [visual ? (_jsxs("div", { className: "mb-3 flex items-start gap-3", children: [_jsx("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-3", children: visual.groups.map((group) => (_jsx("div", { className: "flex flex-wrap gap-1.5", children: [...group.options].sort((a, b) => a.rank - b.rank || a.tag.localeCompare(b.tag)).map((option) => {
                                const info = byCatalog.get(option.tag) ?? byCatalog.get(option.catalog);
                                const fallback = iconByTag.get(option.tag);
                                const pressed = selected.includes(option.tag);
                                const label = info?.nome ?? fallback?.label ?? option.tag;
                                const icon = info?.icon ?? fallback?.src;
                                return (_jsx("button", { type: "button", title: label, "aria-label": label, "aria-pressed": pressed, onClick: () => onToggle(group, option.tag), className: `inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${pressed
                                        ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/60"
                                        : "border-aom-border bg-black/25 hover:border-amber-400/40 hover:bg-amber-500/10"}`, children: icon ? (_jsx("img", { src: icon, alt: "", className: "h-7 w-7 object-contain" })) : (_jsx("span", { className: "px-1 text-[10px] leading-tight text-amber-100/90", children: label })) }, option.tag));
                            }) }, group.id))) }), visual.stance || visual.sex ? (_jsxs("div", { className: "ml-auto flex shrink-0 gap-1.5", children: [visual.stance
                                ? [
                                    ["hack", hackIcon, t("spreadsheet.unidades.hackDamage")],
                                    ["pierce", pierceIcon, t("spreadsheet.unidades.pierceDamage")],
                                ].map(([mode, icon, label]) => (_jsx("button", { type: "button", title: label, "aria-label": label, "aria-pressed": stance === mode, onClick: () => setStance(mode), className: `${STANCE_BUTTON} ${stance === mode
                                        ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/60"
                                        : "border-aom-border bg-black/25 hover:border-amber-400/40 hover:bg-amber-500/10"}`, children: icon ? _jsx("img", { src: icon, alt: "", className: "h-7 w-7 object-contain" }) : null }, mode)))
                                : null, visual.sex
                                ? [
                                    ["male", "♂", t("common.male")],
                                    ["female", "♀", t("common.female")],
                                ].map(([mode, mark, label]) => (_jsx("button", { type: "button", title: label, "aria-label": label, "aria-pressed": sex === mode, onClick: () => setSex(mode), className: `${STANCE_BUTTON} text-lg leading-none ${sex === mode
                                        ? "border-amber-400/70 bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/60"
                                        : "border-aom-border bg-black/25 text-zinc-200 hover:border-amber-400/40 hover:bg-amber-500/10"}`, children: mark }, mode)))
                                : null] })) : null] })) : null, _jsx(UnidadeModelViewer, { urls: urls, hero: hero, hover: HOVER_UNITS.has(unitId), vfx: vfx })] }));
}
