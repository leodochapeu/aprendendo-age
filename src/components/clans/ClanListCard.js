import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ClanLogo } from "@/components/clans/ClanLogo";
import { useTranslation } from "@/hooks/useTranslation";
import { getClanLogoUrl } from "@/lib/clanAssetUrl";
import { clanSlugFromTag } from "@/lib/clanSlug";
import { getClanTheme } from "@/lib/clanTheme";
import { cn } from "@/lib/cn";
export function ClanListCard({ clan }) {
    const { t } = useTranslation();
    const slug = clanSlugFromTag(clan.tag);
    const theme = getClanTheme(slug);
    const logoSrc = getClanLogoUrl(clan);
    return (_jsxs(Link, { to: `/clans/${slug}`, className: cn("group relative isolate flex min-h-[7.5rem] overflow-hidden rounded-2xl border bg-zinc-950/80 shadow-lg shadow-black/40 transition duration-300", "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950", theme.accentBorder), children: [_jsx("div", { className: cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-95 transition-opacity group-hover:opacity-100", theme.heroGradient), "aria-hidden": true }), _jsx("div", { className: "pointer-events-none absolute -right-6 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60", style: { background: theme.heroGlow }, "aria-hidden": true }), logoSrc ? (_jsx("div", { className: "pointer-events-none absolute right-2 bottom-2 h-24 w-24 overflow-hidden rounded-2xl opacity-[0.14] transition-opacity group-hover:opacity-[0.22] sm:right-3 sm:bottom-3 sm:h-28 sm:w-28", "aria-hidden": true, children: _jsx("img", { src: logoSrc, alt: "", className: "size-full object-cover" }) })) : null, _jsxs("div", { className: "relative flex w-full items-center gap-4 py-4 pl-5 pr-4 sm:gap-5 sm:py-5 sm:pl-6 sm:pr-5", children: [_jsxs("div", { className: "relative ml-0.5 shrink-0 sm:ml-1", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 scale-110 rounded-2xl blur-xl opacity-70", style: { background: theme.heroGlow }, "aria-hidden": true }), _jsx(ClanLogo, { tag: clan.tag, logoSrc: logoSrc, size: "md", className: cn("relative border-2 shadow-lg", theme.accentBorder), logoComingSoonLabel: t("pages.clans.logoComingSoon", { name: clan.name }) })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("span", { className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest", theme.badgeBg), children: clan.tag }), _jsx("p", { className: "mt-2 truncate font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-zinc-50 sm:text-lg", children: clan.name }), _jsx("p", { className: cn("mt-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100", theme.accentText), children: t("pages.clans.viewClan") })] })] })] }));
}
export function ClanListGrid({ clans }) {
    const { t } = useTranslation();
    return (_jsx("ul", { className: "grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 xl:grid-cols-3", "aria-label": t("pages.clans.listAria"), children: clans.map((clan) => (_jsx("li", { children: _jsx(ClanListCard, { clan: clan }) }, clan.id))) }));
}
