import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { NotionText } from "@/components/ui/NotionText";
import { buildAvaliacaoLabel, buildAvaliacaoScoreClassName, PLAYSTYLE_BUILD_MODES, } from "@/lib/playstyleBuild";
import { cn } from "@/lib/cn";
function PlaystyleScoreBar({ score, barClass }) {
    return (_jsx("div", { className: "flex justify-center gap-0.5", "aria-hidden": true, children: [1, 2, 3, 4, 5].map((i) => (_jsx("span", { className: cn("h-1.5 w-3 rounded-full sm:h-2 sm:w-3.5", i <= score ? barClass : "bg-zinc-800/90") }, i))) }));
}
import { rushTurtleBoomarImg } from "@/pages/trilha-de-aprendizado/trilhaAssets";
function PlaystyleBuildCard({ mode, score, }) {
    const hasScore = score != null && !Number.isNaN(score);
    return (_jsxs("article", { className: cn("flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center sm:px-4 sm:py-4", mode.cardClass, hasScore && score >= 4 && `ring-1 ${mode.ring}`), children: [_jsx("img", { src: rushTurtleBoomarImg(mode.img), alt: "", className: "h-11 w-11 rounded-lg border border-zinc-800/80 object-contain sm:h-14 sm:w-14" }), _jsx("h3", { className: cn("font-[family-name:var(--font-display)] text-xs font-semibold leading-tight sm:text-sm", mode.titleClass), children: mode.short }), hasScore ? (_jsxs(_Fragment, { children: [_jsx(PlaystyleScoreBar, { score: score, barClass: mode.bar }), _jsxs("p", { className: cn("text-xs font-medium tabular-nums", mode.accent), children: [score, "/5"] }), _jsx("p", { className: buildAvaliacaoScoreClassName(score), children: buildAvaliacaoLabel(score) })] })) : (_jsx("p", { className: "text-xs font-medium text-zinc-500", children: "\u2014" }))] }));
}
export function DeusBuildAvaliacaoCards({ rush, turtle, eco, foco }) {
    const scores = { rush, turtle, eco };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4", children: PLAYSTYLE_BUILD_MODES.map((mode) => (_jsx(PlaystyleBuildCard, { mode: mode, score: scores[mode.statKey] }, mode.id))) }), _jsxs("p", { className: "mt-3 text-xs text-zinc-500", children: ["Escala 1\u20135 (5 = melhor para o arqu\u00E9tipo).", " ", _jsx(Link, { to: "/trilha-de-aprendizado#estrategia-ranking", className: "text-amber-200/90 underline-offset-2 hover:text-amber-50 hover:underline", children: "Ver ranking na trilha" }), "."] }), foco ? (_jsxs("p", { className: "mt-4 text-sm", children: [_jsx("span", { className: "text-zinc-500", children: "Foco: " }), _jsx(NotionText, { text: foco })] })) : null] }));
}
