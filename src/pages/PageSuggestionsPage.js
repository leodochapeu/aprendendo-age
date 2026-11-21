import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { cn } from "@/lib/cn";
import { PAGE_SUGGESTION_TAGS } from "@/lib/pageSuggestions";
import { fetchPageSuggestions } from "@/lib/pageSuggestionsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export function SuggestionsPanel() {
    const { t, locale } = useTranslation();
    const configured = isSupabaseConfigured();
    const localeTag = localeToHtmlLang(locale);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(configured);
    const [error, setError] = useState(false);
    const [tag, setTag] = useState("all");
    useEffect(() => {
        if (!configured) {
            setLoading(false);
            return;
        }
        let cancel = false;
        setLoading(true);
        void fetchPageSuggestions().then((result) => {
            if (cancel)
                return;
            if (!result.ok)
                setError(true);
            else
                setItems(result.data);
            setLoading(false);
        });
        return () => {
            cancel = true;
        };
    }, [configured]);
    const visible = tag === "all" ? items : items.filter((item) => item.tag === tag);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4 flex flex-wrap gap-2", children: [_jsx(FilterChip, { active: tag === "all", onClick: () => setTag("all"), children: t("suggestions.allTags") }), PAGE_SUGGESTION_TAGS.map((item) => (_jsx(FilterChip, { active: tag === item, onClick: () => setTag(item), children: t(`suggestions.tags.${item}`) }, item)))] }), loading ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") }) : null, !loading && error ? _jsx("p", { className: "text-sm text-red-200", children: t("suggestions.loadError") }) : null, !loading && !error && visible.length === 0 ? _jsx("p", { className: "text-sm text-zinc-400", children: t("suggestions.empty") }) : null, _jsx("ul", { className: "divide-y divide-white/10", children: visible.map((item) => (_jsxs("li", { className: "py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-zinc-500", children: [_jsx("span", { className: "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold tracking-wide text-amber-100", children: t(`suggestions.tags.${item.tag}`) }), _jsx("span", { children: item.system }), _jsx("span", { children: new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt)) }), _jsx("span", { children: item.authorName })] }), _jsx("p", { className: "mt-2 text-sm text-zinc-200", children: _jsx(Link, { to: item.pagePath, className: "text-amber-200 underline-offset-2 hover:underline", children: item.pageTitle || item.pagePath }) }), item.section ? _jsx("p", { className: "mt-1 text-xs text-zinc-400", children: item.section }) : null, _jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300", children: item.body })] }, item.id))) })] }));
}
function FilterChip({ active, onClick, children }) {
    return (_jsx("button", { type: "button", "aria-pressed": active, onClick: onClick, className: cn("rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition", active ? "border-amber-400/70 bg-amber-500/20 text-amber-100" : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-zinc-200"), children: children }));
}
