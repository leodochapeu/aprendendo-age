import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
/** Container da planilha — largura total, sem margem extra inferior (scroll fica no card). */
export function SpreadsheetPageWidth({ children, className }) {
    return _jsx("div", { className: cn("w-full min-w-0 pb-4", className), children: children });
}
