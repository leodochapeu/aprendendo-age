import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
export function NotFoundPage() {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "py-20 text-center", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold text-amber-100", children: t("common.notFound") }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: _jsx(Link, { to: "/", className: "text-amber-200 underline-offset-2 hover:underline", children: t("common.backToHome") }) })] }));
}
