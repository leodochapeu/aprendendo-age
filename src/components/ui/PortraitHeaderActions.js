import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
const cardClassInteractive = "group shrink-0 cursor-pointer rounded-xl border border-aom-border bg-zinc-900/60 shadow-sm shadow-black/30 transition hover:border-amber-400/50 hover:ring-1 hover:ring-amber-400/30";
const cardClassStatic = "shrink-0 rounded-lg border border-aom-border/80 bg-zinc-900/50";
const sizeImgClass = {
    md: "h-16 w-16 rounded-xl object-contain p-1.5 sm:h-20 sm:w-20",
    sm: "h-11 w-11 rounded-lg object-contain p-1 sm:h-12 sm:w-12",
    xs: "h-8 w-8 rounded-md object-contain p-0.5",
};
const sizeFallbackClass = {
    md: "flex h-16 w-16 items-center justify-center rounded-xl p-1.5 text-center text-xs font-semibold leading-tight text-zinc-400 sm:h-20 sm:w-20",
    sm: "flex h-11 w-11 items-center justify-center rounded-lg p-1 text-center text-[10px] font-semibold leading-tight text-zinc-400 sm:h-12 sm:w-12",
    xs: "flex h-8 w-8 items-center justify-center rounded-md p-0.5 text-center text-[9px] font-semibold leading-tight text-zinc-400",
};
export function PortraitHeaderActions({ items, linkState, className, size = "md", justify = "end", linked = true, hoverHighlight = true, }) {
    if (items.length === 0)
        return null;
    const justifyCls = justify === "center" ? "justify-center" : justify === "start" ? "justify-start" : "justify-end";
    const gapCls = size === "xs" ? "gap-1" : size === "sm" ? "gap-1.5" : "gap-2";
    const itemShellClass = size === "xs"
        ? hoverHighlight
            ? cn(cardClassInteractive, "rounded-lg")
            : cardClassStatic
        : hoverHighlight
            ? cardClassInteractive
            : cn(cardClassStatic, size === "md" ? "rounded-xl" : "rounded-lg");
    return (_jsx("div", { className: cn("flex w-full min-w-0 flex-row flex-wrap items-center", justifyCls, gapCls, className), children: items.map((item) => {
            const inner = item.src ? (_jsx("img", { src: item.src, alt: "", className: sizeImgClass[size] })) : (_jsx("div", { className: sizeFallbackClass[size], children: item.nome.slice(0, 3) }));
            if (!linked) {
                return (_jsx("span", { title: item.nome, className: cn(itemShellClass, "inline-block"), children: inner }, item.key));
            }
            return (_jsx(Link, { to: item.to, state: linkState, title: item.nome, "aria-label": `Ver página de ${item.nome}`, className: itemShellClass, children: inner }, item.key));
        }) }));
}
