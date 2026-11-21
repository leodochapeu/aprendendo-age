import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/lib/cn";
/** Lista em célula com “Mostrar mais…” / “Mostrar menos…” (fechada por padrão). */
export function SpreadsheetExpandableStack({ items, className, moreLabel = () => "Mostrar mais…", lessLabel = "Mostrar menos…", }) {
    const [expanded, setExpanded] = useState(false);
    if (items.length === 0)
        return null;
    return (_jsxs("div", { className: cn("flex flex-col gap-0.5", className), children: [expanded ? items : null, _jsx("button", { type: "button", onClick: () => setExpanded((v) => !v), className: "w-fit text-left text-xs text-amber-300/90 underline-offset-2 hover:text-amber-200 hover:underline", children: expanded ? lessLabel : moreLabel(items.length) })] }));
}
