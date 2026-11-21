import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AomStatsSyncModal } from "@/components/aomstats/AomStatsSyncModal";
import { AuthError, AuthField, AuthInput, AuthLink, AuthPageLayout, AuthSubmitButton, } from "@/components/auth/AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { localeAuthPath } from "@/lib/localeRoutes";
export function RegisterPage() {
    const { t, locale } = useTranslation();
    const { signUp, syncAomStats, status } = useAuth();
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [pendingAomSync, setPendingAomSync] = useState(null);
    const unconfigured = status === "unconfigured";
    async function onSubmit(e) {
        e.preventDefault();
        if (unconfigured)
            return;
        const form = new FormData(e.currentTarget);
        const nickname = String(form.get("nickname") ?? "");
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");
        setPending(true);
        setError(null);
        const res = await signUp(nickname, email, password);
        if (res.ok === false) {
            setPending(false);
            setError(res.message);
            return;
        }
        if (pendingAomSync) {
            const syncRes = await syncAomStats(pendingAomSync);
            if (syncRes.ok === false) {
                setPending(false);
                setError(syncRes.message);
                navigate(localeAuthPath(locale, "profile"), { replace: true });
                return;
            }
        }
        setPending(false);
        navigate(localeAuthPath(locale, "profile"), { replace: true });
    }
    return (_jsxs(_Fragment, { children: [_jsxs(AuthPageLayout, { className: "max-w-md", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-amber-200", children: t("auth.registerTitle") }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: t("auth.registerSubtitle") })] }), unconfigured ? _jsx(AuthError, { message: t("auth.unconfigured") }) : null, _jsxs("form", { onSubmit: (e) => void onSubmit(e), className: "flex flex-col gap-3", children: [_jsx(AuthField, { label: t("auth.nickname"), children: _jsx(AuthInput, { name: "nickname", type: "text", autoComplete: "nickname", required: true, value: nickname, onChange: (e) => setNickname(e.target.value), placeholder: t("auth.nicknamePlaceholder"), disabled: unconfigured || pending }) }), _jsx(AuthField, { label: t("auth.email"), children: _jsx(AuthInput, { name: "email", type: "email", autoComplete: "email", required: true, placeholder: t("auth.emailPlaceholder"), disabled: unconfigured || pending }) }), _jsx(AuthField, { label: t("auth.password"), children: _jsxs("div", { className: "relative", children: [_jsx(AuthInput, { name: "password", type: showPassword ? "text" : "password", autoComplete: "new-password", required: true, minLength: 6, placeholder: t("auth.passwordPlaceholder"), disabled: unconfigured || pending, className: "w-full pr-10" }), _jsx("button", { type: "button", className: "absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200", onClick: () => setShowPassword((v) => !v), "aria-label": showPassword ? t("auth.hidePassword") : t("auth.showPassword"), children: showPassword ? "◉" : "○" })] }) }), _jsxs("div", { className: "rounded-xl border border-aom-border/60 bg-zinc-900/40 p-3", children: [_jsx("button", { type: "button", disabled: unconfigured || pending, onClick: () => setSyncModalOpen(true), className: cn("w-full rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-semibold text-amber-200/95", "transition hover:border-amber-500/45 hover:bg-zinc-800/90 disabled:cursor-not-allowed disabled:opacity-50"), children: t("auth.aomstatsSyncButton") }), pendingAomSync ? (_jsx("p", { className: "mt-2 text-center text-xs text-emerald-300/90", children: t("auth.aomstatsLinked", { name: pendingAomSync.aomstatsAlias }) })) : (_jsx("p", { className: "mt-2 text-center text-xs text-zinc-500", children: t("auth.aomstatsNotLinked") }))] }), _jsx(AuthError, { message: error }), _jsx(AuthSubmitButton, { pending: pending, disabled: unconfigured, children: pending ? t("common.loading") : t("auth.submitRegister") })] }), _jsxs("p", { className: "mt-5 text-center text-sm text-zinc-400", children: [t("auth.hasAccount"), " ", _jsx(AuthLink, { to: localeAuthPath(locale, "login"), children: t("auth.goLogin") })] })] }), _jsx(AomStatsSyncModal, { open: syncModalOpen, onClose: () => setSyncModalOpen(false), initialSearchText: nickname.trim(), onConfirm: async (payload) => {
                    setPendingAomSync(payload);
                } })] }));
}
