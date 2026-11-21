import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { playerDisplayLabel } from "@/lib/playersApi";
import { getRankClassification, rankRomanMedallionClass, rankRomanStepFromRr, TIER_ACHIEVEMENT_THEME, } from "@/lib/rankClassification";
const GRID_SCRIM = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M40 0L40 80M0 40L80 40'/%3E%3C/g%3E%3C/svg%3E\")";
/** Resumo do jogador na pista — uma linha, estilo do tier. */
export function RacePlayerMiniCard({ player, className }) {
    const cls = getRankClassification(player.rr);
    const theme = TIER_ACHIEVEMENT_THEME[cls.tierId];
    const label = playerDisplayLabel(player);
    const roman = rankRomanStepFromRr(player.rr);
    const clanTag = player.aomstatsClan?.trim();
    return (_jsxs("div", { className: cn("pointer-events-none relative w-max max-w-[calc(50vw-1.25rem)] overflow-hidden rounded-lg border border-aom-border/55 px-2 py-1.5 shadow-lg shadow-black/50 sm:max-w-[min(16rem,calc(50vw-2rem))] sm:rounded-xl sm:px-3 sm:py-2 lg:max-w-[min(20rem,calc(100vw-8rem))]", theme.surfaceClass, className), "aria-hidden": true, children: [_jsx("div", { className: "pointer-events-none absolute inset-0 opacity-[0.07]", style: { backgroundImage: GRID_SCRIM } }), _jsxs("div", { className: "relative flex min-w-0 items-center gap-1.5 sm:gap-2", children: [clanTag ? (_jsx("span", { className: "shrink-0 rounded-md border border-zinc-500/45 bg-black/25 px-1 py-0.5 font-mono text-[9px] font-semibold text-zinc-100 sm:px-1.5 sm:text-[10px]", title: clanTag, children: clanTag })) : null, _jsx("p", { className: "min-w-0 truncate font-[family-name:var(--font-display)] text-xs font-semibold leading-none text-zinc-50 sm:text-sm", children: label }), _jsx("span", { className: cn("shrink-0 text-xs font-semibold tabular-nums leading-none sm:text-sm", theme.stepAccent), children: player.rr }), _jsx("span", { className: cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold shadow-inner sm:h-7 sm:w-7 sm:text-[11px]", rankRomanMedallionClass(cls.tierId)), children: roman })] })] }));
}
