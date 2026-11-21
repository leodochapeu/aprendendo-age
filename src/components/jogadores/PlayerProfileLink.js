import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { playerDisplayLabel, playerProfilePagePath } from "@/lib/playersApi";
export function PlayerProfileLink({ player, children, className, onNavigate }) {
    const { t, locale } = useTranslation();
    const label = playerDisplayLabel(player);
    const path = playerProfilePagePath(player.id, locale);
    return (_jsx(Link, { to: path, title: t("pages.players.openPlayerProfile", { name: label }), onClick: onNavigate, className: cn("rounded-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950", className), children: children }));
}
