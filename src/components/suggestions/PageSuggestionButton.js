import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canSuggestPageChange } from "@/lib/auth/constants";
import { cn } from "@/lib/cn";
import { PAGE_SUGGESTION_SYSTEM, PAGE_SUGGESTION_TAGS } from "@/lib/pageSuggestions";
import { createPageSuggestion } from "@/lib/pageSuggestionsApi";
const fieldClass = "mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";
export function PageSuggestionButton({ className }) {
    const { t } = useTranslation();
    const { status, profile, profileLoadState, user } = useAuth();
    const [open, setOpen] = useState(false);
    const [pageTitle, setPageTitle] = useState("");
    const visible = status === "authenticated" && profileLoadState === "ready" && canSuggestPageChange(profile?.role);
    if (!visible)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", title: t("suggestions.open"), "aria-label": t("suggestions.open"), onClick: () => {
                    setPageTitle(document.querySelector("h1")?.textContent?.trim() ?? "");
                    setOpen(true);
                }, className: cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/50 text-amber-100/90 transition hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25", className), children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: [_jsx("path", { d: "M12 20h9", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), _jsx("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })] }) }), open && user ? (_jsx(SuggestionDialog, { pageTitle: pageTitle, authorName: profile?.displayName?.trim() || t("suggestions.anonymousAuthor"), createdBy: user.id, onClose: () => setOpen(false) })) : null] }));
}
function SuggestionDialog({ pageTitle, authorName, createdBy, onClose, }) {
    const { t } = useTranslation();
    const { pathname, search } = useLocation();
    const { showToast } = useToast();
    const [section, setSection] = useState("");
    const [body, setBody] = useState("");
    const [tag, setTag] = useState("suggestion");
    const [sending, setSending] = useState(false);
    const pagePath = `${pathname}${search}`.slice(0, 500);
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event) => {
            if (event.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);
    async function submit() {
        const text = body.trim();
        if (!text || sending)
            return;
        setSending(true);
        const result = await createPageSuggestion({
            pagePath,
            pageTitle: pageTitle || null,
            section,
            body: text,
            tag,
            authorName,
            createdBy,
        });
        setSending(false);
        if (!result.ok) {
            showToast(t("suggestions.saveError"));
            return;
        }
        showToast(t("suggestions.sent"));
        onClose();
    }
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-[80]", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/70", "aria-label": t("notifications.close"), onClick: onClose }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center p-4", children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "page-suggestion-title", className: "flex max-h-[min(88vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4", children: [_jsxs("div", { children: [_jsx("h2", { id: "page-suggestion-title", className: "font-[family-name:var(--font-display)] text-xl font-semibold text-amber-100", children: t("suggestions.title") }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: pageTitle || pagePath })] }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10", children: t("notifications.close") })] }), _jsxs("form", { className: "min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4", onSubmit: (event) => {
                                event.preventDefault();
                                void submit();
                            }, children: [_jsxs("label", { className: "block text-sm text-zinc-300", children: [t("suggestions.section"), _jsx("input", { value: section, onChange: (event) => setSection(event.target.value), maxLength: 200, placeholder: t("suggestions.sectionHint"), className: fieldClass })] }), _jsxs("fieldset", { children: [_jsx("legend", { className: "text-sm text-zinc-300", children: t("suggestions.tag") }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: PAGE_SUGGESTION_TAGS.map((item) => (_jsx("button", { type: "button", "aria-pressed": tag === item, onClick: () => setTag(item), className: cn("rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition", tag === item ? "border-amber-400/70 bg-amber-500/20 text-amber-100" : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-zinc-200"), children: t(`suggestions.tags.${item}`) }, item))) })] }), _jsxs("label", { className: "block text-sm text-zinc-300", children: [t("suggestions.body"), _jsx("textarea", { value: body, onChange: (event) => setBody(event.target.value), required: true, maxLength: 4000, rows: 6, className: fieldClass })] }), _jsxs("p", { className: "text-xs text-zinc-500", children: [t("suggestions.system"), ": ", PAGE_SUGGESTION_SYSTEM] }), _jsx("button", { type: "submit", disabled: sending || body.trim().length === 0, className: "rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50", children: sending ? t("suggestions.sending") : t("suggestions.submit") })] })] }) })] }), document.body);
}
