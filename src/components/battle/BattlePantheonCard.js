import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getPantheonHeroBackgroundUrl, getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
import { cssUrl } from "@/lib/watermarkImageStyle";
/**
 * Card de seleção de facção: no hover/foco a capa `hero_background` ganha protagonismo.
 */
export function BattlePantheonCard({ to, title, subtitle, pantheonId, pantheonName, heroBackground, icon, }) {
    const { t } = useTranslation();
    const cover = getPantheonHeroBackgroundUrl({ hero_background: heroBackground });
    const watermark = getPantheonWatermarkUrl({ id: pantheonId, icon });
    const tint = pantheonCardTint(pantheonName);
    return (_jsxs(Link, { to: to, className: cn("group relative block min-h-44 overflow-hidden rounded-2xl border border-aom-border bg-zinc-950", "shadow-lg shadow-black/40 transition duration-300", "hover:border-amber-400/55 hover:shadow-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40"), children: [cover ? (_jsx("div", { "aria-hidden": true, className: cn("absolute inset-0 bg-cover bg-center transition duration-500 ease-out", "opacity-25 scale-105 group-hover:opacity-80 group-hover:scale-100 group-focus-visible:opacity-80"), style: { backgroundImage: cssUrl(cover) } })) : null, _jsx("div", { "aria-hidden": true, className: "absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/35 transition group-hover:from-zinc-950/90 group-hover:via-zinc-950/45 group-hover:to-transparent" }), tint ? (_jsx("div", { "aria-hidden": true, className: "absolute inset-0 mix-blend-soft-light transition group-hover:opacity-90", style: { backgroundColor: tint } })) : null, watermark ? (_jsx("img", { src: watermark, alt: "", "aria-hidden": true, className: "pointer-events-none absolute -right-2 bottom-0 h-[90%] w-auto max-w-[55%] object-contain opacity-25 transition duration-500 group-hover:opacity-55 group-hover:scale-105" })) : null, _jsxs("div", { className: "relative z-10 flex h-full min-h-44 flex-col justify-end p-5", children: [_jsx("p", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-amber-50 drop-shadow", children: title }), subtitle ? (_jsx("p", { className: "mt-1 line-clamp-2 text-sm text-zinc-300/90 transition group-hover:text-zinc-100", children: subtitle })) : null, _jsx("span", { className: "mt-3 inline-flex w-fit rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200 opacity-80 transition group-hover:opacity-100", children: t("pages.battle.selectPantheon") })] })] }));
}
