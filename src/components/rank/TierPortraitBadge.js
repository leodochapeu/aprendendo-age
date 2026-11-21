import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getRankRrBounds, TIER_ACHIEVEMENT_THEME, } from "@/lib/rankClassification";
const TIER_PORTRAIT_MEDAL = {
    bronze: "border-amber-600/45 bg-gradient-to-br from-amber-950/90 via-amber-900/35 to-zinc-950/95 ring-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.25)]",
    prata: "border-zinc-500/45 bg-gradient-to-br from-zinc-900/90 via-zinc-800/35 to-zinc-950/95 ring-zinc-400/35 shadow-[0_0_10px_rgba(161,161,170,0.2)]",
    ouro: "border-amber-500/45 bg-gradient-to-br from-amber-950/90 via-yellow-900/30 to-zinc-950/95 ring-amber-400/35 shadow-[0_0_10px_rgba(234,179,8,0.22)]",
    esmeralda: "border-emerald-600/45 bg-gradient-to-br from-emerald-950/90 via-emerald-900/30 to-zinc-950/95 ring-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.22)]",
    diamante: "border-sky-500/45 bg-gradient-to-br from-sky-950/90 via-sky-900/30 to-zinc-950/95 ring-sky-400/35 shadow-[0_0_10px_rgba(56,189,248,0.28)]",
};
export function TierPortraitBadge({ cls, tierPortrait, rr, className, size = "md", tooltipAlign = "end", tooltipPlacement = "below", }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const bounds = getRankRrBounds(rr);
    const rrLabel = bounds.max != null
        ? t("pages.players.tierTooltipRrRange", { min: bounds.min, max: bounds.max })
        : t("pages.players.tierTooltipRrMinOnly", { min: bounds.min });
    const sizeClass = size === "sm"
        ? "h-8 w-8 sm:h-9 sm:w-9"
        : "h-9 w-9 sm:h-10 sm:w-10";
    const tooltipAlignClass = tooltipAlign === "center"
        ? "left-1/2 -translate-x-1/2"
        : tooltipAlign === "start"
            ? "left-0"
            : "right-0";
    const tooltipPlacementClass = tooltipPlacement === "above"
        ? "bottom-full mb-2"
        : "top-full mt-2";
    return (_jsxs("div", { className: cn("group/tier relative shrink-0", className), children: [_jsx("button", { type: "button", "aria-label": `${cls.subcategoryLabel}: ${rrLabel}`, "aria-expanded": open, onClick: () => setOpen((v) => !v), onBlur: () => setOpen(false), className: cn("flex items-center justify-center rounded-full border p-1 ring-2 ring-inset transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50", sizeClass, TIER_PORTRAIT_MEDAL[cls.tierId]), children: _jsx("img", { src: tierPortrait, alt: "", className: "h-full w-full object-contain", width: 36, height: 36 }) }), _jsxs("div", { role: "tooltip", className: cn("pointer-events-none absolute z-30 w-48 rounded-xl border border-zinc-700/80 bg-zinc-950/95 px-3 py-2.5 text-left shadow-xl shadow-black/50 backdrop-blur-sm", tooltipAlignClass, tooltipPlacementClass, "opacity-0 transition duration-150", "group-hover/tier:opacity-100 group-focus-within/tier:opacity-100", open && "opacity-100"), children: [_jsx("p", { className: cn("text-[11px] font-semibold uppercase tracking-wide", TIER_ACHIEVEMENT_THEME[cls.tierId].titleRankClass), children: cls.subcategoryLabel }), _jsx("p", { className: "mt-1 text-[10px] leading-snug text-zinc-300", children: cls.categoryLabel }), _jsx("p", { className: "mt-2 text-[10px] font-medium tabular-nums text-zinc-400", children: rrLabel }), _jsx("p", { className: "mt-1 text-[10px] leading-snug text-zinc-500", children: cls.hintCategory })] })] }));
}
