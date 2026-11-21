import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { playerClanLogoUrl, playerClanPagePath, playerClanTag, } from "@/lib/playersApi";
const LOGO_SIZE = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
};
export function PlayerClanLink({ player, size = "sm", showTag = false, className, onNavigate, }) {
    const { t } = useTranslation();
    const tag = playerClanTag(player);
    const logoUrl = playerClanLogoUrl(player);
    const path = playerClanPagePath(player);
    if (!tag && !logoUrl) {
        return _jsx("span", { className: cn("text-sm text-zinc-600", className), children: "\u2014" });
    }
    const logoBox = (_jsx("div", { className: cn("relative shrink-0 overflow-hidden rounded-lg border border-zinc-600/70 bg-zinc-950 shadow-inner shadow-black/40", LOGO_SIZE[size]), children: logoUrl ? (_jsx("img", { src: logoUrl, alt: "", className: "size-full object-cover", width: 36, height: 36 })) : (_jsx("div", { className: "flex size-full items-center justify-center bg-zinc-900 font-mono text-[9px] font-bold uppercase text-zinc-400", children: tag?.slice(0, 3) })) }));
    const content = (_jsxs("span", { className: cn("inline-flex items-center gap-2", className), children: [logoBox, showTag && tag ? (_jsx("span", { className: "font-mono text-xs font-semibold text-sky-400/95", children: tag })) : null] }));
    if (!path)
        return content;
    return (_jsx(Link, { to: path, title: t("pages.players.openClanPage", { tag: tag ?? "" }), onClick: onNavigate, className: "inline-flex rounded-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950", children: content }));
}
