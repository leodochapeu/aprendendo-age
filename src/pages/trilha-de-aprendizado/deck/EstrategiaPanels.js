import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { localeSectionPath } from "@/lib/localeRoutes";
import { PLAYSTYLE_BUILD_MODES } from "@/lib/playstyleBuild";
import { rushTurtleBoomarImg } from "../trilhaAssets";
import { chapterKicker } from "./chapters";
import { LessonSection, PullQuote, Shot, VideoFrame } from "./ui";
const PROF_AJAX_VIDEO = "https://www.youtube.com/embed/-N9ntWXsKWs";
const ARCHETYPE_COPY = {
    rush: {
        title: "pages.trilha.rush.rushTitle",
        desc: "pages.trilha.rush.rushDesc",
        pros: "pages.trilha.rush.rushPros",
        cons: "pages.trilha.rush.rushCons",
        alt: "pages.trilha.rush.rushIllustrationAlt",
    },
    turtle: {
        title: "pages.trilha.rush.turtleTitle",
        desc: "pages.trilha.rush.turtleDesc",
        pros: "pages.trilha.rush.turtlePros",
        cons: "pages.trilha.rush.turtleCons",
        alt: "pages.trilha.rush.turtleIllustrationAlt",
    },
    eco: {
        title: "pages.trilha.rush.ecoTitle",
        desc: "pages.trilha.rush.ecoDesc",
        pros: "pages.trilha.rush.ecoPros",
        cons: "pages.trilha.rush.ecoCons",
        alt: "pages.trilha.rush.ecoIllustrationAlt",
    },
};
function isMajorGod(hierarquia) {
    const h = hierarquia?.toLowerCase();
    return h === "maior" || h === "major";
}
function scoreLabel(n, t) {
    switch (n) {
        case 5:
            return t("pages.trilha.rush.scoreExcellent");
        case 4:
            return t("pages.trilha.rush.scoreGreat");
        case 3:
            return t("pages.trilha.rush.scoreGood");
        case 2:
            return t("pages.trilha.rush.scoreBad");
        case 1:
            return t("pages.trilha.rush.scoreTerrible");
        default:
            return String(n);
    }
}
export function EstrategiaPanel() {
    const { t } = useTranslation();
    return (_jsxs(LessonSection, { id: "estrategia", kicker: chapterKicker(t, "estrategia"), title: t("pages.trilha.rush.title"), lede: t("pages.trilha.rush.intro"), children: [_jsx("ul", { className: "grid gap-4 md:grid-cols-3", children: [
                    ["pages.trilha.rush.playAggressive", "Modo_Aggro.webp"],
                    ["pages.trilha.rush.playEconomic", "Modo_Eco.webp"],
                    ["pages.trilha.rush.playDefensive", "Modo_Turtle.webp"],
                ].map(([key, file]) => (_jsxs("li", { className: "flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5", children: [_jsx("img", { src: rushTurtleBoomarImg(file), alt: "", className: "h-16 w-16 rounded-2xl object-cover" }), _jsx("p", { className: "text-lg font-medium leading-snug text-zinc-50 md:text-xl", children: t(key) })] }, file))) }), _jsx("p", { className: "mt-8 max-w-3xl text-lg leading-relaxed text-zinc-100 md:text-xl", children: t("pages.trilha.rush.rockPaperScissors") }), _jsx("p", { className: "mt-4 max-w-3xl text-xl font-medium leading-relaxed text-amber-100 md:text-2xl", children: t("pages.trilha.rush.summary") }), _jsx("div", { className: "mt-10 grid gap-5 lg:grid-cols-3", children: PLAYSTYLE_BUILD_MODES.map((mode) => {
                    const copy = ARCHETYPE_COPY[mode.id];
                    return (_jsxs("article", { className: cn("flex flex-col rounded-3xl border p-6 md:p-7", mode.cardClass), children: [_jsx("img", { src: rushTurtleBoomarImg(mode.img), alt: t(copy.alt), className: "h-28 w-28 rounded-2xl object-cover" }), _jsx("h3", { className: cn("mt-6 font-[family-name:var(--font-display)] text-3xl", mode.titleClass), children: t(copy.title) }), _jsx("p", { className: "mt-3 text-lg leading-relaxed text-zinc-100", children: t(copy.desc) }), _jsxs("p", { className: "mt-6 text-lg leading-relaxed text-zinc-100", children: [_jsx("span", { className: "font-semibold text-emerald-300", children: t("pages.trilha.rush.prosLabel") }), " ", t(copy.pros)] }), _jsxs("p", { className: "mt-2 text-lg leading-relaxed text-zinc-100", children: [_jsx("span", { className: "font-semibold text-rose-300", children: t("pages.trilha.rush.consLabel") }), " ", t(copy.cons)] })] }, mode.id));
                }) }), _jsx("div", { className: "mt-10", children: _jsxs(PullQuote, { tone: "amber", icon: _jsx("span", { className: "text-3xl", children: "\uD83D\uDCA1" }), children: [_jsx("p", { className: "font-semibold", children: t("pages.trilha.rush.tipTitle") }), _jsx("p", { children: t("pages.trilha.rush.tipP1") }), _jsx("p", { children: t("pages.trilha.rush.tipP2") }), _jsx("p", { children: t("pages.trilha.rush.tipP3") })] }) }), _jsx(Shot, { src: rushTurtleBoomarImg("Contra - RTS Estratégia.webp"), alt: t("pages.trilha.rush.counterDiagramAlt"), className: "mx-auto mt-10 max-w-xl" }), _jsx("p", { className: "mt-10 max-w-3xl text-lg text-zinc-100 md:text-xl", children: t("pages.trilha.rush.watchVideo") }), _jsxs("div", { className: "mt-4 max-w-4xl", children: [_jsx(VideoFrame, { src: PROF_AJAX_VIDEO, title: t("pages.trilha.rush.ajaxRef") }), _jsxs("p", { className: "mt-4 text-lg text-zinc-300", children: [_jsx("span", { className: "font-semibold text-zinc-100", children: t("pages.trilha.rush.referenceLabel") }), " Professor Ajax"] })] })] }));
}
export function EstrategiaRankingPanel() {
    const { t, locale } = useTranslation();
    const { deuses, deusSlugById } = useCatalog();
    const [modeId, setModeId] = useState("rush");
    const mode = PLAYSTYLE_BUILD_MODES.find((item) => item.id === modeId) ?? PLAYSTYLE_BUILD_MODES[0];
    const top10 = useMemo(() => {
        return deuses
            .filter((deus) => isMajorGod(deus.hierarquia) && typeof deus[mode.statKey] === "number")
            .sort((a, b) => b[mode.statKey] - a[mode.statKey] ||
            a.nome.localeCompare(b.nome, locale === "en" ? "en" : "pt"))
            .slice(0, 10);
    }, [deuses, locale, mode.statKey]);
    return (_jsxs(LessonSection, { id: "estrategia-ranking", kicker: chapterKicker(t, "estrategia"), title: t("pages.trilha.rush.top10Title"), lede: _jsxs(_Fragment, { children: [t("pages.trilha.rush.top10Desc"), " ", _jsx(Link, { to: localeSectionPath(locale, "deuses"), className: "font-semibold text-amber-200 underline decoration-amber-400/50 underline-offset-4 hover:text-amber-50", children: t("nav.gods") }), "."] }), children: [_jsx("div", { className: "flex flex-wrap gap-2", role: "tablist", "aria-label": t("pages.trilha.rush.archetypeRanking"), children: PLAYSTYLE_BUILD_MODES.map((item) => {
                    const active = item.id === modeId;
                    return (_jsxs("button", { type: "button", role: "tab", "aria-selected": active, onClick: () => setModeId(item.id), className: cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base font-medium transition", active ? item.tabActive : item.tabIdle), children: [_jsx("img", { src: rushTurtleBoomarImg(item.img), alt: "", className: "h-7 w-7 rounded-md object-cover" }), t(item.id === "rush"
                                ? "pages.trilha.rush.modeRushShort"
                                : item.id === "turtle"
                                    ? "pages.trilha.rush.modeTurtleShort"
                                    : "pages.trilha.rush.modeEcoShort")] }, item.id));
                }) }), _jsx("p", { className: "mt-4 text-base text-zinc-300", children: t("pages.trilha.rush.sortedBy", {
                    mode: t(mode.id === "rush"
                        ? "pages.trilha.rush.modeRushShort"
                        : mode.id === "turtle"
                            ? "pages.trilha.rush.modeTurtleShort"
                            : "pages.trilha.rush.modeEcoShort"),
                }) }), _jsx("ol", { className: "mt-6 space-y-3", role: "tabpanel", "aria-label": t("pages.trilha.rush.top10Panel", {
                    mode: t(mode.id === "rush"
                        ? "pages.trilha.rush.modeRush"
                        : mode.id === "turtle"
                            ? "pages.trilha.rush.modeTurtle"
                            : "pages.trilha.rush.modeEco"),
                }), children: top10.map((deus, index) => {
                    const score = deus[mode.statKey];
                    const portrait = getDeusAssetUrl(deus);
                    const rank = index + 1;
                    return (_jsx("li", { children: _jsxs(Link, { to: localeSectionPath(locale, "deuses", deusSlugById.get(deus.id) ?? deus.id), className: cn("flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-amber-300/40 hover:bg-white/[0.06]", rank <= 3 && `ring-1 ${mode.ring}`), children: [_jsx("span", { className: "w-8 font-[family-name:var(--font-display)] text-2xl text-amber-100", children: rank }), portrait ? (_jsx("img", { src: portrait, alt: "", className: "h-14 w-14 rounded-xl object-cover" })) : (_jsx("span", { className: "flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500", children: "?" })), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-lg font-medium text-zinc-50", children: deus.nome }), _jsxs("span", { className: cn("mt-1 block text-base", mode.accent), children: [score, "/5 \u00B7 ", scoreLabel(score, t)] })] })] }) }, deus.id));
                }) })] }));
}
