import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthError, AuthField, AuthInput, AuthLink, AuthPageLayout, AuthSubmitButton, } from "@/components/auth/AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { safeNextPath } from "@/lib/auth/safeNextPath";
import { localeAuthPath } from "@/lib/localeRoutes";
export function LoginPage() {
    const { t, locale } = useTranslation();
    const { signIn, status } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const unconfigured = status === "unconfigured";
    async function onSubmit(e) {
        e.preventDefault();
        if (unconfigured)
            return;
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");
        setPending(true);
        setError(null);
        const res = await signIn(email, password);
        setPending(false);
        if (!res.ok) {
            setError(res.message);
            return;
        }
        const next = safeNextPath(searchParams.get("next"));
        navigate(next, { replace: true });
    }
    return (_jsxs(AuthPageLayout, { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-amber-200", children: t("auth.loginTitle") }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: t("auth.loginSubtitle") })] }), unconfigured ? (_jsx(AuthError, { message: t("auth.unconfigured") })) : null, _jsxs("form", { onSubmit: (e) => void onSubmit(e), className: "flex flex-col gap-3", children: [_jsx(AuthField, { label: t("auth.email"), children: _jsx(AuthInput, { name: "email", type: "email", autoComplete: "email", required: true, placeholder: t("auth.emailPlaceholder"), disabled: unconfigured || pending }) }), _jsx(AuthField, { label: t("auth.password"), children: _jsxs("div", { className: "relative", children: [_jsx(AuthInput, { name: "password", type: showPassword ? "text" : "password", autoComplete: "current-password", required: true, placeholder: t("auth.passwordPlaceholder"), disabled: unconfigured || pending, className: "w-full pr-10" }), _jsx("button", { type: "button", className: "absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200", onClick: () => setShowPassword((v) => !v), "aria-label": showPassword ? t("auth.hidePassword") : t("auth.showPassword"), children: showPassword ? "◉" : "○" })] }) }), _jsx(AuthError, { message: error }), _jsx(AuthSubmitButton, { pending: pending, disabled: unconfigured, children: pending ? t("common.loading") : t("auth.submitLogin") })] }), _jsxs("p", { className: "mt-5 text-center text-sm text-zinc-400", children: [t("auth.noAccount"), " ", _jsx(AuthLink, { to: localeAuthPath(locale, "register"), children: t("auth.goRegister") })] })] }));
}
