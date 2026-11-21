import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export function BackLink({ to, children }) {
    return (_jsxs(Link, { to: to, className: "mb-6 inline-flex items-center gap-2 text-sm font-medium text-amber-200/90 hover:text-amber-50", children: [_jsx("span", { "aria-hidden": true, children: "\u2190" }), children] }));
}
