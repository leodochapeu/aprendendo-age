import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Section } from "@/components/ui/Section";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { commentExcerpt, displayToStored, mentionQueryAt, mentionsToDisplay, parseComment, sanitizeMentionLabel, } from "@/lib/commentMarkup";
import { cn } from "@/lib/cn";
import { COMMENTS_ENABLED } from "@/lib/commentsFeature";
import { localeToHtmlLang } from "@/lib/locale";
import { localeAuthPath } from "@/lib/localeRoutes";
import { PAGE_COMMENT_PAGE_SIZE } from "@/lib/pageComments";
import { createPageComment, deletePageComment, fetchMyCommentActivity, commentPageForId, fetchPageComments, reportPageComment, searchCommentMentions, togglePageCommentLike, updatePageComment, } from "@/lib/pageCommentsApi";
import { playerProfilePagePath } from "@/lib/playersApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export function MapComments({ slug, mapName }) {
    const { t } = useTranslation();
    return _jsx(PageComments, { pageKind: "mapas", pageKey: slug, itemName: mapName, kindLabel: t("comments.kinds.map") }, slug);
}
export function PageComments(props) {
    if (!COMMENTS_ENABLED)
        return null;
    return _jsx(PageCommentsPanel, { ...props });
}
function PageCommentsPanel({ pageKind, pageKey, itemName, kindLabel }) {
    const { t, locale } = useTranslation();
    const { showToast } = useToast();
    const { status, user, profile } = useAuth();
    const loggedIn = status === "authenticated" && Boolean(user);
    const [searchParams] = useSearchParams();
    const focusId = searchParams.get("comentario");
    const [page, setPage] = useState(0);
    const [pageReady, setPageReady] = useState(!focusId);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [draft, setDraft] = useState(null);
    const [sending, setSending] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const composerRef = useRef(null);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_COMMENT_PAGE_SIZE));
    const firstLoad = useRef(true);
    const itemIds = items.map((item) => item.id).join(",");
    useEffect(() => {
        if (!focusId) {
            setPageReady(true);
            return;
        }
        let cancel = false;
        void commentPageForId(pageKind, pageKey, focusId).then((index) => {
            if (cancel)
                return;
            if (index != null)
                setPage(index);
            setPageReady(true);
        });
        return () => {
            cancel = true;
        };
    }, [focusId, pageKind, pageKey]);
    useEffect(() => {
        if (!focusId || !loaded)
            return;
        document.getElementById(`comentario-${focusId}`)?.scrollIntoView({ block: "center" });
    }, [focusId, loaded, itemIds]);
    useEffect(() => {
        if (!pageReady)
            return;
        if (!isSupabaseConfigured()) {
            setLoaded(true);
            return;
        }
        let cancel = false;
        const run = () => {
            void fetchPageComments(pageKind, pageKey, page, null).then((result) => {
                if (cancel)
                    return;
                if (!result.ok) {
                    setError(true);
                    setLoaded(true);
                    return;
                }
                const lastPage = Math.max(0, Math.ceil(result.data.total / PAGE_COMMENT_PAGE_SIZE) - 1);
                if (page > lastPage) {
                    setPage(lastPage);
                    return;
                }
                setError(false);
                setItems(result.data.items);
                setTotal(result.data.total);
                setLoaded(true);
            });
        };
        if (firstLoad.current) {
            firstLoad.current = false;
            const cancelSchedule = scheduleAfterPaint(run);
            return () => {
                cancel = true;
                cancelSchedule();
            };
        }
        run();
        return () => {
            cancel = true;
        };
    }, [pageKind, pageKey, page, pageReady]);
    useEffect(() => {
        if (!user?.id || !itemIds)
            return;
        let cancel = false;
        void fetchMyCommentActivity(itemIds.split(","), user.id).then((flags) => {
            if (cancel || !flags)
                return;
            const liked = new Set(flags.liked);
            const reported = new Set(flags.reported);
            setItems((current) => current.map((item) => ({
                ...item,
                likedByMe: liked.has(item.id),
                reportedByMe: reported.has(item.id),
            })));
        });
        return () => {
            cancel = true;
        };
    }, [user?.id, itemIds]);
    function openDraft(next) {
        setDraft(next);
        setConfirmDeleteId(null);
        window.setTimeout(() => composerRef.current?.scrollIntoView({ block: "nearest" }), 0);
    }
    function fail(reason) {
        if (reason === "unconfigured")
            showToast(t("notifications.errors.unconfigured"), "error");
        else if (reason === "save")
            showToast(t("comments.errors.save"), "error");
        else
            showToast(t(`comments.errors.${reason}`), "error");
    }
    async function reload(nextPage = page) {
        const result = await fetchPageComments(pageKind, pageKey, nextPage, user?.id ?? null);
        if (!result.ok) {
            setError(true);
            return;
        }
        setError(false);
        setItems(result.data.items);
        setTotal(result.data.total);
        setPage(nextPage);
    }
    async function publish() {
        if (!draft || !user || sending)
            return;
        const body = displayToStored(draft.body, draft.mentions).trim();
        if (body.length < 2) {
            showToast(t("comments.errors.comment_too_short"), "error");
            return;
        }
        setSending(true);
        const result = draft.mode === "edit"
            ? await updatePageComment(draft.commentId, body)
            : await createPageComment({
                pageKind,
                pageKey,
                pageTitle: itemName,
                body,
                replyTo: draft.mode === "reply" ? draft.replyTo.id : null,
                createdBy: user.id,
            });
        setSending(false);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setDraft(null);
        showToast(draft.mode === "edit" ? t("comments.updated") : t("comments.published"));
        if (draft.mode === "edit") {
            await reload(page);
            return;
        }
        const nextTotal = total + 1;
        await reload(Math.max(0, Math.ceil(nextTotal / PAGE_COMMENT_PAGE_SIZE) - 1));
    }
    async function remove(id) {
        setSending(true);
        const result = await deletePageComment(id);
        setSending(false);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setConfirmDeleteId(null);
        showToast(t("comments.deleted"));
        const nextTotal = Math.max(0, total - 1);
        const lastPage = Math.max(0, Math.ceil(nextTotal / PAGE_COMMENT_PAGE_SIZE) - 1);
        await reload(Math.min(page, lastPage));
    }
    async function like(comment) {
        if (!user) {
            showToast(t("comments.loginToAct"), "error");
            return;
        }
        const result = await togglePageCommentLike(comment.id, user.id, comment.likedByMe);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setItems((current) => current.map((item) => item.id === comment.id
            ? {
                ...item,
                likedByMe: !comment.likedByMe,
                likeCount: Math.max(0, item.likeCount + (comment.likedByMe ? -1 : 1)),
            }
            : item));
    }
    async function report(comment) {
        if (!user) {
            showToast(t("comments.loginToAct"), "error");
            return;
        }
        const name = profile?.aomstatsAlias?.trim() || profile?.displayName?.trim() || t("comments.anonymousAuthor");
        const result = await reportPageComment(comment.id, user.id, name);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setItems((current) => current.map((item) => (item.id === comment.id ? { ...item, reportedByMe: true } : item)));
        showToast(t("comments.reported"));
    }
    return (_jsxs(Section, { title: t("comments.title"), className: "mt-6", children: [_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [loaded ? _jsx("p", { className: "text-xs text-zinc-500", children: t("comments.count", { count: total }) }) : _jsx("span", {}), loggedIn ? (_jsx("button", { type: "button", className: "rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25", onClick: () => (draft?.mode === "new" ? setDraft(null) : openDraft({ mode: "new", body: "", mentions: [] })), children: draft?.mode === "new" ? t("comments.cancel") : t("comments.new") })) : (_jsx(Link, { to: localeAuthPath(locale, "login"), className: "rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25", children: t("comments.loginToPost") }))] }), draft ? (_jsx("div", { ref: composerRef, className: "mb-5", children: _jsx(CommentComposer, { itemName: itemName, kindLabel: kindLabel, draft: draft, sending: sending, onChange: (body, mentions) => setDraft({ ...draft, body, mentions }), onCancel: () => setDraft(null), onSubmit: () => void publish() }, draft.mode === "edit" ? draft.commentId : draft.mode === "reply" ? draft.replyTo.id : "new") })) : null, loaded && error ? _jsx("p", { className: "text-sm text-red-200", children: t("comments.loadError") }) : null, loaded && !error && items.length === 0 ? _jsx("p", { className: "text-sm text-zinc-400", children: t("comments.empty") }) : null, _jsx("ul", { className: "space-y-3", children: items.map((comment) => (_jsx("li", { children: _jsx(CommentCard, { comment: comment, localeTag: localeToHtmlLang(locale), locale: locale, focused: comment.id === focusId, mine: user?.id === comment.createdBy, confirming: confirmDeleteId === comment.id, onReply: () => {
                            if (!user) {
                                showToast(t("comments.loginToAct"), "error");
                                return;
                            }
                            openDraft({ mode: "reply", body: "", mentions: [], replyTo: comment });
                        }, onEdit: () => {
                            const shown = mentionsToDisplay(comment.body);
                            openDraft({ mode: "edit", body: shown.text, mentions: shown.mentions, commentId: comment.id });
                        }, onLike: () => void like(comment), onReport: () => void report(comment), onAskDelete: () => setConfirmDeleteId(comment.id), onCancelDelete: () => setConfirmDeleteId(null), onDelete: () => void remove(comment.id) }) }, comment.id))) }), loaded && total > PAGE_COMMENT_PAGE_SIZE ? (_jsxs("div", { className: "mt-4 flex items-center justify-between gap-3", children: [_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 enabled:hover:border-white/30 disabled:opacity-40", disabled: page === 0, onClick: () => setPage((current) => Math.max(0, current - 1)), children: t("comments.previous") }), _jsx("p", { className: "text-xs text-zinc-500", children: t("comments.page", { current: page + 1, total: pageCount }) }), _jsx("button", { type: "button", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 enabled:hover:border-white/30 disabled:opacity-40", disabled: page + 1 >= pageCount, onClick: () => setPage((current) => current + 1), children: t("comments.next") })] })) : null] }));
}
function CommentComposer({ itemName, kindLabel, draft, sending, onChange, onCancel, onSubmit, }) {
    const { t } = useTranslation();
    const fieldId = useId();
    const areaRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [mentionStart, setMentionStart] = useState(null);
    const [mentionQuery, setMentionQuery] = useState(null);
    useEffect(() => {
        if (!mentionQuery || mentionQuery.length < 2) {
            setSuggestions([]);
            return;
        }
        let cancel = false;
        const timer = window.setTimeout(() => {
            void searchCommentMentions(mentionQuery).then((hits) => {
                if (!cancel)
                    setSuggestions(hits);
            });
        }, 220);
        return () => {
            cancel = true;
            window.clearTimeout(timer);
        };
    }, [mentionQuery]);
    function syncMention(value, caret) {
        const found = mentionQueryAt(value, caret);
        if (!found || found.query.length < 2) {
            setMentionQuery(null);
            setMentionStart(null);
            return;
        }
        setMentionQuery(found.query);
        setMentionStart(found.start);
    }
    function updateBody(value, caret) {
        onChange(value, draft.mentions);
        syncMention(value, caret);
    }
    function wrap(before, after) {
        const el = areaRef.current;
        const value = draft.body;
        const start = el?.selectionStart ?? value.length;
        const end = el?.selectionEnd ?? value.length;
        const selected = value.slice(start, end) || t("comments.sample");
        const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
        onChange(next, draft.mentions);
        const cursor = start + before.length + selected.length + after.length;
        window.requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(cursor, cursor);
        });
    }
    function heading() {
        const el = areaRef.current;
        const value = draft.body;
        const start = el?.selectionStart ?? value.length;
        const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const next = `${value.slice(0, lineStart)}# ${value.slice(lineStart)}`;
        onChange(next, draft.mentions);
        window.requestAnimationFrame(() => {
            el?.focus();
            const cursor = start + 2;
            el?.setSelectionRange(cursor, cursor);
        });
    }
    function pickMention(hit) {
        const el = areaRef.current;
        const caret = el?.selectionStart ?? draft.body.length;
        const start = mentionStart ?? caret;
        const label = sanitizeMentionLabel(hit.label);
        if (!label)
            return;
        const visible = `@${label} `;
        const next = `${draft.body.slice(0, start)}${visible}${draft.body.slice(caret)}`;
        const mentions = draft.mentions.some((item) => item.id === hit.id)
            ? draft.mentions
            : [...draft.mentions, { id: hit.id, label }];
        setMentionQuery(null);
        setMentionStart(null);
        setSuggestions([]);
        onChange(next, mentions);
        const cursor = start + visible.length;
        window.requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(cursor, cursor);
        });
    }
    return (_jsxs("form", { className: "rounded-xl border border-white/10 bg-black/25 p-3", onSubmit: (event) => {
            event.preventDefault();
            onSubmit();
        }, children: [_jsx("p", { className: "text-xs font-semibold tracking-wide text-zinc-400", children: t("comments.formTitle") }), _jsxs("div", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: [_jsx(LockedField, { label: t("comments.kind"), value: kindLabel }), _jsx(LockedField, { label: t("comments.item"), value: itemName })] }), draft.mode === "reply" ? (_jsxs("div", { className: "mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2", children: [_jsx("p", { className: "text-xs font-semibold text-amber-100", children: t("comments.quote") }), _jsxs("p", { className: "mt-1 text-xs text-zinc-400", children: [_jsx("span", { className: "text-zinc-200", children: draft.replyTo.authorName }), " · ", commentExcerpt(draft.replyTo.body)] })] })) : null, _jsx("label", { htmlFor: fieldId, className: "mt-3 block text-xs font-semibold text-zinc-400", children: draft.mode === "edit" ? t("comments.editing") : t("comments.post") }), _jsxs("div", { className: "mt-1 overflow-hidden rounded-lg border border-white/10 bg-zinc-950/70", children: [_jsxs("div", { className: "flex gap-1 border-b border-white/10 px-2 py-1", children: [_jsx(ToolButton, { label: t("comments.bold"), onClick: () => wrap("**", "**"), children: _jsx("span", { className: "font-bold", children: "B" }) }), _jsx(ToolButton, { label: t("comments.italic"), onClick: () => wrap("*", "*"), children: _jsx("span", { className: "italic", children: "I" }) }), _jsx(ToolButton, { label: t("comments.heading"), onClick: heading, children: "H" })] }), _jsx("textarea", { id: fieldId, ref: areaRef, value: draft.body, maxLength: 4000, rows: 5, placeholder: t("comments.placeholder"), className: "w-full resize-y bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600", onChange: (event) => updateBody(event.target.value, event.target.selectionStart), onClick: (event) => syncMention(event.currentTarget.value, event.currentTarget.selectionStart), onKeyUp: (event) => syncMention(event.currentTarget.value, event.currentTarget.selectionStart), onKeyDown: (event) => {
                            if (event.key === "Escape") {
                                setSuggestions([]);
                                setMentionStart(null);
                            }
                            if (event.key === "Enter" && suggestions.length > 0 && mentionStart != null) {
                                event.preventDefault();
                                const first = suggestions[0];
                                if (first)
                                    pickMention(first);
                            }
                        } })] }), suggestions.length > 0 ? (_jsx("ul", { className: "mt-1 overflow-hidden rounded-lg border border-white/10 bg-zinc-950", role: "listbox", children: suggestions.map((hit) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5", onMouseDown: (event) => event.preventDefault(), onClick: () => pickMention(hit), children: ["@", hit.label] }) }, hit.id))) })) : null, _jsx("p", { className: "mt-2 text-xs text-zinc-500", children: t("comments.mentionHint") }), _jsxs("div", { className: "mt-3 flex justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200", onClick: onCancel, children: t("comments.cancel") }), _jsx("button", { type: "submit", disabled: sending || draft.body.trim().length < 2, className: "rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 enabled:hover:bg-amber-400 disabled:opacity-50", children: sending ? t("comments.sending") : draft.mode === "edit" ? t("comments.save") : t("comments.publish") })] })] }));
}
function CommentCard({ comment, localeTag, locale, focused, mine, confirming, onReply, onEdit, onLike, onReport, onAskDelete, onCancelDelete, onDelete, }) {
    const { t } = useTranslation();
    const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(comment.createdAt));
    const blocks = parseComment(comment.body);
    return (_jsxs("article", { id: `comentario-${comment.id}`, className: cn("overflow-hidden rounded-xl border border-white/10 bg-black/20", focused && "ring-1 ring-amber-400/70"), children: [_jsxs("div", { className: "flex flex-col md:flex-row", children: [_jsxs("div", { className: "min-w-0 flex-1 px-4 py-3", children: [_jsxs("p", { className: "text-xs text-zinc-500", children: [_jsx(Link, { to: playerProfilePagePath(comment.createdBy, locale), className: "font-semibold text-amber-100 hover:underline", children: comment.authorName }), _jsxs("span", { children: [" \u00B7 ", when] }), comment.updatedAt ? _jsxs("span", { children: [" \u00B7 ", t("comments.edited")] }) : null] }), comment.replyAuthorName ? (_jsxs("blockquote", { className: "mt-3 border-l-2 border-amber-500/40 pl-3 text-xs text-zinc-400", children: [_jsx("p", { className: "font-semibold text-amber-100/90", children: t("comments.quote") }), _jsxs("p", { className: "mt-1", children: [comment.replyAuthorName, comment.replyExcerpt ? ` · ${comment.replyExcerpt}` : ""] })] })) : null, _jsx("div", { className: "mt-3 space-y-2 text-sm leading-relaxed text-zinc-200", children: blocks.map((block, index) => (_jsx(CommentBlockView, { block: block, locale: locale }, index))) })] }), _jsxs("aside", { className: "flex items-center gap-3 border-t border-white/10 px-4 py-3 md:w-40 md:flex-col md:items-center md:border-l md:border-t-0 md:text-center", children: [_jsx(AuthorAvatar, { name: comment.authorName, logo: comment.authorLogo }), _jsx("p", { className: "text-xs font-semibold text-zinc-200", children: comment.authorName })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2", children: [_jsx("button", { type: "button", "aria-pressed": comment.likedByMe, className: cn("rounded-full border px-2.5 py-1 text-xs", comment.likedByMe ? "border-amber-400/60 bg-amber-500/15 text-amber-100" : "border-white/15 text-zinc-400 hover:text-zinc-200"), onClick: onLike, children: t("comments.like", { count: comment.likeCount }) }), _jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200", onClick: onReply, children: t("comments.reply") }), mine ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200", onClick: onEdit, children: t("comments.edit") }), confirming ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "rounded-full border border-red-400/50 px-2.5 py-1 text-xs text-red-200", onClick: onDelete, children: t("comments.confirmDelete") }), _jsx("button", { type: "button", className: "px-2 text-xs text-zinc-500", onClick: onCancelDelete, children: t("comments.cancel") })] })) : (_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200", onClick: onAskDelete, children: t("comments.delete") }))] })) : comment.reportedByMe ? (_jsx("span", { className: "px-1 text-xs text-zinc-500", children: t("comments.reportedDone") })) : (_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200", onClick: onReport, children: t("comments.report") }))] })] }));
}
function CommentBlockView({ block, locale }) {
    if (block.type === "blank")
        return _jsx("div", { className: "h-2" });
    const content = block.spans.map((span, index) => _jsx(SpanView, { span: span, locale: locale }, index));
    if (block.type === "heading")
        return _jsx("h3", { className: "font-[family-name:var(--font-display)] text-base font-semibold text-amber-50", children: content });
    return _jsx("p", { children: content });
}
function SpanView({ span, locale }) {
    if (span.type === "bold")
        return _jsx("strong", { className: "font-semibold text-zinc-50", children: span.text });
    if (span.type === "italic")
        return _jsx("em", { children: span.text });
    if (span.type === "mention") {
        return (_jsxs(Link, { to: playerProfilePagePath(span.id, locale), className: "font-semibold text-amber-200 hover:underline", children: ["@", span.label] }));
    }
    return _jsx("span", { children: span.text });
}
function AuthorAvatar({ name, logo }) {
    if (logo)
        return _jsx("img", { src: logo, alt: "", className: "size-12 rounded-full object-cover" });
    return (_jsx("span", { className: "flex size-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-amber-100", children: name.slice(0, 1).toUpperCase() }));
}
function LockedField({ label, value }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-zinc-500", children: label }), _jsx("input", { readOnly: true, value: value, className: "mt-1 w-full cursor-default rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300" })] }));
}
function scheduleAfterPaint(run) {
    if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(() => run(), { timeout: 1200 });
        return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 1);
    return () => window.clearTimeout(id);
}
function ToolButton({ label, onClick, children }) {
    return (_jsx("button", { type: "button", title: label, "aria-label": label, className: "rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/10", onClick: onClick, children: children }));
}
