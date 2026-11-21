import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
const flagClassName = "h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/25";
function BrazilFlag({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 20 14", className: cn(flagClassName, className), "aria-hidden": true, children: [_jsx("rect", { width: "20", height: "14", fill: "#009C3B" }), _jsx("polygon", { points: "10,1.4 18.4,7 10,12.6 1.6,7", fill: "#FFDF00" }), _jsx("circle", { cx: "10", cy: "7", r: "2.35", fill: "#002776" }), _jsx("path", { d: "M8.1 7.35c1.15-.85 2.5-1.05 3.85-.5", fill: "none", stroke: "#fff", strokeWidth: "0.45", strokeLinecap: "round" })] }));
}
function UnitedStatesFlag({ className }) {
    const stripeH = 14 / 13;
    return (_jsxs("svg", { viewBox: "0 0 20 14", className: cn(flagClassName, className), "aria-hidden": true, children: [_jsx("rect", { width: "20", height: "14", fill: "#BF0A30" }), Array.from({ length: 6 }, (_, index) => (_jsx("rect", { y: (index * 2 + 1) * stripeH, width: "20", height: stripeH, fill: "#fff" }, index))), _jsx("rect", { width: "8", height: stripeH * 7, fill: "#3C3B6E" }), [0, 1, 2, 3, 4].flatMap((row) => [0, 1, 2, 3].map((col) => (_jsx("circle", { cx: 1.15 + col * 1.85 + (row % 2) * 0.9, cy: 0.85 + row * 1.35, r: "0.28", fill: "#fff" }, `${row}-${col}`))))] }));
}
export function LocaleFlag({ locale, className }) {
    if (locale === "en")
        return _jsx(UnitedStatesFlag, { className: className });
    return _jsx(BrazilFlag, { className: className });
}
