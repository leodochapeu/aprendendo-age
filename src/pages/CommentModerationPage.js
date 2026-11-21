import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CommunityVideoRequestsPanel } from "@/components/moderation/CommunityVideoRequestsPanel";
import { RecentCommentsPanel } from "@/components/moderation/RecentCommentsPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { SuggestionsPanel } from "@/pages/PageSuggestionsPage";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canSuggestPageChange } from "@/lib/auth/constants";
import { COMMENTS_ENABLED } from "@/lib/commentsFeature";
import { commentExcerpt } from "@/lib/commentMarkup";
import { cn } from "@/lib/cn";
import { deleteTopicPost, dismissTopicReport, fetchTopicReports } from "@/lib/communityTopicsApi";
import { localeToHtmlLang } from "@/lib/locale";
import { localeCommunityTopicsPath, localeSectionPath } from "@/lib/localeRoutes";
import {} from "@/lib/pageComments";
import { deletePageComment, dismissCommentReport, fetchCommentReports } from "@/lib/pageCommentsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const TABS = ["reports", "suggestions", "comments", "videos"];
const KINDS = new Set([
    "panteoes",
    "deuses",
    "eras",
    "poderes",
    "construcoes",
    "unidades",
    "aldeoes",
    "mapas",
    "reliquias",
    "tecnologias",
    "starts",
]);
export function CommentModerationPage() {
    const { t, locale } = useTranslation();
    const { showToast } = useToast();
    const { status, profile, profileLoadState } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const configured = isSupabaseConfigured();
    const localeTag = localeToHtmlLang(locale);
    const allowed = status === "authenticated" && profileLoadState === "ready" && canSuggestPageChange(profile?.role);
    const authPending = status === "loading" || (status === "authenticated" && profileLoadState !== "ready");
    const isAdmin = profile?.role === "admin";
    const requested = searchParams.get("tab");
    const visibleTabs = TABS.filter((item) => COMMENTS_ENABLED || (item !== "reports" && item !== "comments"));
    const tab = (() => {
        if (requested === "suggestions" || requested === "videos")
            return requested;
        if (COMMENTS_ENABLED && requested === "comments")
            return "comments";
        return COMMENTS_ENABLED ? "reports" : "suggestions";
    })();
    const description = !allowed
        ? undefined
        : tab === "suggestions"
            ? isAdmin
                ? t("suggestions.listDescriptionAdmin")
                : t("suggestions.listDescriptionOwn")
            : tab === "comments"
                ? t("comments.recentDescription")
                : tab === "videos"
                    ? t("comments.videoRequestsDescription")
                    : t("comments.moderationDescription");
    const [items, setItems] = useState([]);
    const [topicReports, setTopicReports] = useState([]);
    const [loading, setLoading] = useState(configured);
    const [error, setError] = useState(false);
    const [busyId, setBusyId] = useState(null);
    useEffect(() => {
        if (!allowed || tab !== "reports") {
            if (!allowed)
                setLoading(false);
            return;
        }
        let cancel = false;
        setLoading(true);
        void Promise.all([fetchCommentReports(), fetchTopicReports()]).then(([comments, topics]) => {
            if (cancel)
                return;
            if (!comments.ok)
                setError(true);
            else
                setItems(comments.data);
            if (topics.ok)
                setTopicReports(topics.data);
            setLoading(false);
        });
        return () => {
            cancel = true;
        };
    }, [allowed, tab]);
    async function refresh() {
        const result = await fetchCommentReports();
        if (!result.ok) {
            setError(true);
            return;
        }
        setError(false);
        setItems(result.data);
    }
    async function dismiss(id) {
        setBusyId(id);
        const result = await dismissCommentReport(id);
        setBusyId(null);
        if (!result.ok) {
            showToast(t("comments.errors.save"), "error");
            return;
        }
        setItems((current) => current.filter((item) => item.id !== id));
    }
    async function removeComment(report) {
        setBusyId(report.id);
        const result = await deletePageComment(report.commentId);
        setBusyId(null);
        if (!result.ok) {
            showToast(t("comments.errors.save"), "error");
            return;
        }
        showToast(t("comments.deleted"));
        await refresh();
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl", children: [_jsx(PageHeader, { title: t("comments.moderationTitle"), description: description }), !configured ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.errors.unconfigured") }) : null, configured && authPending ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") }) : null, configured && !authPending && !allowed ? _jsx("p", { className: "text-sm text-zinc-400", children: t("comments.moderationForbidden") }) : null, allowed ? (_jsx("div", { role: "tablist", "aria-label": t("comments.moderationTabsLabel"), className: "mb-6 flex flex-wrap gap-2 border-b border-aom-border/60 pb-3", children: visibleTabs.map((item) => {
                    const active = tab === item;
                    return (_jsx("button", { type: "button", role: "tab", "aria-selected": active, className: cn("rounded-lg px-4 py-2 text-sm font-medium transition", active ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35" : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"), onClick: () => setSearchParams(item === "reports" ? {} : { tab: item }, { replace: true }), children: t(`comments.moderationTabs.${item}`) }, item));
                }) })) : null, allowed && tab === "suggestions" ? _jsx(SuggestionsPanel, {}) : null, allowed && tab === "comments" ? _jsx(RecentCommentsPanel, {}) : null, allowed && tab === "videos" ? _jsx(CommunityVideoRequestsPanel, {}) : null, allowed && tab === "reports" ? (_jsxs(_Fragment, { children: [loading ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") }) : null, !loading && error ? _jsx("p", { className: "text-sm text-red-200", children: t("comments.loadError") }) : null, !loading && !error && items.length === 0 && topicReports.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-400", children: t("comments.moderationEmpty") })) : null, _jsx("ul", { className: "divide-y divide-white/10", children: items.map((item) => {
                            const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt));
                            const href = KINDS.has(item.pageKind)
                                ? localeSectionPath(locale, item.pageKind, item.pageKey)
                                : null;
                            return (_jsxs("li", { className: "py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-zinc-500", children: [_jsx("span", { className: "rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 font-semibold text-red-100", children: t("comments.report") }), _jsx("span", { children: when }), _jsx("span", { children: t("comments.reportedBy", { name: item.reporterName }) })] }), _jsxs("p", { className: "mt-2 text-sm text-zinc-200", children: [href ? (_jsx(Link, { to: href, className: "text-amber-200 underline-offset-2 hover:underline", children: item.pageTitle })) : (item.pageTitle), _jsxs("span", { className: "text-zinc-500", children: [" \u00B7 ", item.authorName] })] }), _jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300", children: commentExcerpt(item.body, 400) }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: busyId === item.id, className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 disabled:opacity-50", onClick: () => void dismiss(item.id), children: t("comments.dismiss") }), _jsx("button", { type: "button", disabled: busyId === item.id, className: "rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-200 disabled:opacity-50", onClick: () => void removeComment(item), children: t("comments.remove") })] })] }, item.id));
                        }) }), topicReports.length > 0 ? _jsx("h2", { className: "mb-2 mt-8 text-sm font-semibold text-amber-100", children: t("topics.title") }) : null, _jsx("ul", { className: "divide-y divide-white/10", children: topicReports.map((item) => {
                            const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt));
                            return (_jsxs("li", { className: "py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-zinc-500", children: [_jsx("span", { className: "rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 font-semibold text-red-100", children: t("comments.report") }), _jsx("span", { children: when }), _jsx("span", { children: t("comments.reportedBy", { name: item.reporterName }) })] }), _jsxs("p", { className: "mt-2 text-sm text-zinc-200", children: [_jsx(Link, { to: localeCommunityTopicsPath(locale, item.topicSlug), className: "text-amber-200 underline-offset-2 hover:underline", children: item.topicTitle }), _jsxs("span", { className: "text-zinc-500", children: [" \u00B7 ", item.authorName] })] }), _jsx("p", { className: "mt-2 text-sm leading-relaxed text-zinc-300", children: commentExcerpt(item.body, 400) }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: busyId === item.id, className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-50", onClick: () => {
                                                    setBusyId(item.id);
                                                    void dismissTopicReport(item.id).then((result) => {
                                                        setBusyId(null);
                                                        if (!result.ok)
                                                            showToast(t("comments.errors.save"), "error");
                                                        else
                                                            setTopicReports((current) => current.filter((report) => report.id !== item.id));
                                                    });
                                                }, children: t("comments.dismiss") }), _jsx("button", { type: "button", disabled: busyId === item.id, className: "rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-200 disabled:opacity-50", onClick: () => {
                                                    setBusyId(item.id);
                                                    void deleteTopicPost(item.postId).then((result) => {
                                                        setBusyId(null);
                                                        if (!result.ok)
                                                            showToast(t("comments.errors.save"), "error");
                                                        else {
                                                            showToast(t("comments.deleted"));
                                                            setTopicReports((current) => current.filter((report) => report.postId !== item.postId));
                                                        }
                                                    });
                                                }, children: t("comments.remove") })] })] }, item.id));
                        }) })] })) : null] }));
}
