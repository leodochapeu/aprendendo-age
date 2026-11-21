import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
function logoInitials(tag) {
    const t = tag.replace(/[^a-zA-Z0-9]/g, "");
    if (t.length <= 2)
        return t.toUpperCase() || "?";
    return (t.slice(0, 1) + t.slice(-1)).toUpperCase();
}
const SIZE_CLASS = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    hero: "h-28 w-28 sm:h-36 sm:w-36",
};
export function ClanLogo({ tag, logoSrc, logoComingSoonLabel, size = "sm", className, }) {
    const box = SIZE_CLASS[size];
    if (logoSrc) {
        return (_jsx("div", { className: cn("relative shrink-0 overflow-hidden rounded-2xl border border-zinc-600/80 bg-transparent shadow-inner shadow-black/40", box, className), "aria-hidden": true, children: _jsx("img", { src: logoSrc, alt: "", className: "size-full object-cover" }) }));
    }
    return (_jsx("div", { className: cn("flex shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-600/90 bg-zinc-950/80 font-mono font-semibold uppercase tracking-tight text-zinc-500 shadow-inner shadow-black/30", size === "hero" ? "text-lg" : "text-xs", box, className), title: logoComingSoonLabel, "aria-hidden": true, children: logoInitials(tag) }));
}
