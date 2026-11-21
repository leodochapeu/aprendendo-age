import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
/**
 * Etiqueta compacta (ex.: subtítulo em cards). Estilo base tipo badge âmbar.
 */
export function AppTag({ className, children, variant = "amber", ...props }) {
    return (_jsx("span", { className: cn("inline-flex max-w-full shrink-0 items-center rounded px-1.5 py-0.5", variant === "amber" &&
            "border border-amber-600/50 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90", variant === "rich" &&
            "border border-amber-700/45 bg-amber-950/40 text-sm font-medium normal-case tracking-normal text-amber-200/90", className), ...props, children: children }));
}
