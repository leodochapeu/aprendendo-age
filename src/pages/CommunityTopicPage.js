import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { TopicCategoryBadge } from "@/components/community/TopicCategoryBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canSuggestPageChange } from "@/lib/auth/constants";
import { commentExcerpt, displayToStored, mentionQueryAt, mentionsToDisplay, parseComment, sanitizeMentionLabel, } from "@/lib/commentMarkup";
import { cn } from "@/lib/cn";
import { TOPIC_POST_PAGE_SIZE } from "@/lib/communityTopics";
import { createTopicPost, deleteTopicPost, fetchCommunityTopic, fetchTopicPosts, topicPostPageForId, reportTopicPost, setCommunityTopicStatus, toggleTopicPostLike, updateTopicPost, } from "@/lib/communityTopicsApi";
import { searchCommentMentions } from "@/lib/pageCommentsApi";
import { localeToHtmlLang } from "@/lib/locale";
import { localeAuthPath, localeCommunityTopicsPath } from "@/lib/localeRoutes";
import { playerProfilePagePath } from "@/lib/playersApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export function CommunityTopicPage() {
    const { t, locale } = useTranslation();
    const { showToast } = useToast();
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const focusId = searchParams.get("comentario");
    const { status, user, profile, profileLoadState } = useAuth();
    const loggedIn = status === "authenticated" && Boolean(user);
    const canModerate = profileLoadState === "ready" && canSuggestPageChange(profile?.role);
    const localeTag = localeToHtmlLang(locale);
    const [topic, setTopic] = useState(undefined);
    const [page, setPage] = useState(0);
    const [pageReady, setPageReady] = useState(!focusId);
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [draft, setDraft] = useState(null);
    const [sending, setSending] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [statusMode, setStatusMode] = useState(null);
    const pageCount = Math.max(1, Math.ceil(total / TOPIC_POST_PAGE_SIZE));
    useEffect(() => {
        if (!slug || !isSupabaseConfigured()) {
            setTopic(null);
            return;
        }
        let cancel = false;
        void fetchCommunityTopic(slug).then((result) => {
            if (cancel)
                return;
            setTopic(result.ok ? result.data : null);
        });
        return () => {
            cancel = true;
        };
    }, [slug]);
    useEffect(() => {
        if (!focusId) {
            setPageReady(true);
            return;
        }
        if (!topic?.id)
            return;
        let cancel = false;
        void topicPostPageForId(topic.id, focusId).then((index) => {
            if (cancel)
                return;
            if (index != null)
                setPage(index);
            setPageReady(true);
        });
        return () => {
            cancel = true;
        };
    }, [topic?.id, focusId]);
    useEffect(() => {
        if (!focusId || !loaded)
            return;
        document.getElementById(`comentario-${focusId}`)?.scrollIntoView({ block: "center" });
    }, [focusId, loaded, posts]);
    useEffect(() => {
        if (!topic?.id || !pageReady)
            return;
        let cancel = false;
        void fetchTopicPosts(topic.id, page, user?.id ?? null).then((result) => {
            if (cancel)
                return;
            if (!result.ok) {
                setError(true);
                setLoaded(true);
                return;
            }
            const last = Math.max(0, Math.ceil(result.data.total / TOPIC_POST_PAGE_SIZE) - 1);
            if (page > last) {
                setPage(last);
                return;
            }
            setError(false);
            setPosts(result.data.items);
            setTotal(result.data.total);
            setLoaded(true);
        });
        return () => {
            cancel = true;
        };
    }, [topic?.id, page, pageReady, user?.id]);
    function fail(reason) {
        if (reason === "unconfigured")
            showToast(t("notifications.errors.unconfigured"), "error");
        else if (reason === "save")
            showToast(t("topics.errors.save"), "error");
        else if (reason.startsWith("comment_"))
            showToast(t(`comments.errors.${reason}`), "error");
        else
            showToast(t(`topics.errors.${reason}`), "error");
    }
    async function reloadPosts(nextPage = page) {
        if (!topic)
            return;
        const result = await fetchTopicPosts(topic.id, nextPage, user?.id ?? null);
        if (!result.ok) {
            setError(true);
            return;
        }
        setError(false);
        setPosts(result.data.items);
        setTotal(result.data.total);
        setPage(nextPage);
        setLoaded(true);
    }
    async function publish() {
        if (!draft || !user || !topic || sending)
            return;
        const body = displayToStored(draft.body, draft.mentions).trim();
        if (body.length < 2) {
            fail("comment_too_short");
            return;
        }
        setSending(true);
        const result = draft.mode === "edit" && draft.postId
            ? await updateTopicPost(draft.postId, body)
            : await createTopicPost({
                topicId: topic.id,
                body,
                replyTo: draft.mode === "reply" ? draft.replyTo?.id ?? null : null,
                createdBy: user.id,
            });
        setSending(false);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        const wasEdit = draft.mode === "edit";
        setDraft(null);
        showToast(wasEdit ? t("comments.updated") : t("comments.published"));
        if (wasEdit) {
            await reloadPosts(page);
            return;
        }
        await reloadPosts(Math.max(0, Math.ceil((total + 1) / TOPIC_POST_PAGE_SIZE) - 1));
        const fresh = slug ? await fetchCommunityTopic(slug) : null;
        if (fresh?.ok && fresh.data)
            setTopic(fresh.data);
    }
    async function remove(id) {
        setSending(true);
        const result = await deleteTopicPost(id);
        setSending(false);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setConfirmDeleteId(null);
        showToast(t("comments.deleted"));
        const nextTotal = Math.max(0, total - 1);
        await reloadPosts(Math.min(page, Math.max(0, Math.ceil(nextTotal / TOPIC_POST_PAGE_SIZE) - 1)));
    }
    async function like(post) {
        if (!user) {
            showToast(t("comments.loginToAct"), "error");
            return;
        }
        const result = await toggleTopicPostLike(post.id, user.id, post.likedByMe);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setPosts((current) => current.map((item) => item.id === post.id
            ? { ...item, likedByMe: !post.likedByMe, likeCount: Math.max(0, item.likeCount + (post.likedByMe ? -1 : 1)) }
            : item));
    }
    async function report(post) {
        if (!user) {
            showToast(t("comments.loginToAct"), "error");
            return;
        }
        const name = profile?.aomstatsAlias?.trim() || profile?.displayName?.trim() || t("comments.anonymousAuthor");
        const result = await reportTopicPost(post.id, user.id, name);
        if (!result.ok) {
            fail(result.reason);
            return;
        }
        setPosts((current) => current.map((item) => (item.id === post.id ? { ...item, reportedByMe: true } : item)));
        showToast(t("comments.reported"));
    }
    if (topic === undefined)
        return _jsx("p", { className: "text-sm text-zinc-500", children: t("notifications.loading") });
    if (!topic) {
        return (_jsxs("div", { children: [_jsx(Link, { to: localeCommunityTopicsPath(locale), className: "text-sm text-amber-200 hover:underline", children: t("topics.back") }), _jsx("p", { className: "mt-4 text-zinc-400", children: t("topics.notFound") })] }));
    }
    const closed = topic.status !== "open";
    return (_jsxs("div", { className: "mx-auto max-w-3xl", children: [_jsx(Link, { to: localeCommunityTopicsPath(locale), className: "text-sm text-amber-200/90 hover:text-amber-100", children: t("topics.back") }), _jsxs("header", { className: "mt-4 overflow-hidden rounded-3xl border border-amber-500/20 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.14),transparent_60%)] px-6 py-7", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(TopicCategoryBadge, { category: topic.category, label: t(`topics.categories.${topic.category}`) }), closed ? (_jsx("span", { className: "rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200", children: t(`topics.status.${topic.status}`) })) : null] }), _jsx("h1", { className: "mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-amber-50 sm:text-4xl", children: topic.title }), _jsxs("p", { className: "mt-2 text-sm text-zinc-400", children: [topic.authorName, " \u00B7 ", new Intl.DateTimeFormat(localeTag, { dateStyle: "medium", timeStyle: "short" }).format(new Date(topic.createdAt))] }), closed && topic.statusReason ? _jsx("p", { className: "mt-4 max-w-2xl text-sm leading-relaxed text-zinc-200", children: topic.statusReason }) : null, canModerate ? (_jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [topic.status !== "locked" ? (_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-200", onClick: () => setStatusMode("locked"), children: t("topics.lock") })) : null, topic.status !== "archived" ? (_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-200", onClick: () => setStatusMode("archived"), children: t("topics.archive") })) : null, closed ? (_jsx("button", { type: "button", className: "rounded-full border border-amber-400/40 px-3 py-1.5 text-xs text-amber-100", onClick: () => setStatusMode("open"), children: t("topics.reopen") })) : null] })) : null] }), _jsxs("ol", { className: "relative mt-8 space-y-6 border-l border-amber-500/25 pl-6", children: [loaded && error ? _jsx("p", { className: "text-sm text-red-200", children: t("topics.loadError") }) : null, posts.map((post) => (_jsx("li", { children: _jsx(TopicMessage, { post: post, locale: locale, localeTag: localeTag, focused: post.id === focusId, mine: user?.id === post.createdBy, confirming: confirmDeleteId === post.id, onReply: () => {
                                if (!loggedIn) {
                                    showToast(t("comments.loginToAct"), "error");
                                    return;
                                }
                                if (closed) {
                                    showToast(t("topics.errors.topic_closed"), "error");
                                    return;
                                }
                                setDraft({ mode: "reply", body: "", mentions: [], replyTo: post });
                            }, onEdit: () => {
                                const shown = mentionsToDisplay(post.body);
                                setDraft({ mode: "edit", body: shown.text, mentions: shown.mentions, postId: post.id });
                            }, onLike: () => void like(post), onReport: () => void report(post), onAskDelete: () => setConfirmDeleteId(post.id), onCancelDelete: () => setConfirmDeleteId(null), onDelete: () => void remove(post.id) }) }, post.id)))] }), loaded && total > TOPIC_POST_PAGE_SIZE ? (_jsxs("div", { className: "mt-6 flex items-center justify-between gap-3", children: [_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40", disabled: page === 0, onClick: () => setPage((current) => Math.max(0, current - 1)), children: t("comments.previous") }), _jsx("p", { className: "text-xs text-zinc-500", children: t("comments.page", { current: page + 1, total: pageCount }) }), _jsx("button", { type: "button", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40", disabled: page + 1 >= pageCount, onClick: () => setPage((current) => current + 1), children: t("comments.next") })] })) : null, _jsx("div", { className: "mt-8", children: closed ? (_jsx("p", { className: "rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-400", children: t(`topics.closedNote.${topic.status}`) })) : loggedIn ? (draft ? (_jsx(TopicComposer, { draft: draft, sending: sending, onChange: (body, mentions) => setDraft({ ...draft, body, mentions }), onCancel: () => setDraft(null), onSubmit: () => void publish() })) : (_jsx("button", { type: "button", className: "rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300", onClick: () => setDraft({ mode: "new", body: "", mentions: [] }), children: t("topics.replyInTopic") }))) : (_jsx(Link, { to: localeAuthPath(locale, "login"), className: "inline-flex rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950", children: t("comments.loginToPost") })) }), statusMode ? (_jsx(StatusDialog, { mode: statusMode, sending: sending, onClose: () => setStatusMode(null), onConfirm: async (reason) => {
                    setSending(true);
                    const result = await setCommunityTopicStatus(topic.id, statusMode, reason);
                    setSending(false);
                    if (!result.ok) {
                        fail(result.reason);
                        return;
                    }
                    setTopic({ ...topic, status: statusMode, statusReason: statusMode === "open" ? null : reason.trim() || null });
                    setStatusMode(null);
                    showToast(t("topics.statusSaved"));
                } })) : null] }));
}
function TopicMessage({ post, locale, localeTag, focused, mine, confirming, onReply, onEdit, onLike, onReport, onAskDelete, onCancelDelete, onDelete, }) {
    const { t } = useTranslation();
    const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(post.createdAt));
    return (_jsxs("article", { id: `comentario-${post.id}`, className: cn("relative rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-4", focused && "ring-1 ring-amber-400/70"), children: [_jsx("span", { className: "absolute -left-[31px] top-5 size-3 rounded-full border border-amber-300/70 bg-zinc-950", "aria-hidden": true }), _jsxs("div", { className: "flex items-center gap-3", children: [post.authorLogo ? (_jsx("img", { src: post.authorLogo, alt: "", className: "size-9 rounded-full object-cover" })) : (_jsx("span", { className: "flex size-9 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-100", children: post.authorName.slice(0, 1).toUpperCase() })), _jsxs("div", { children: [_jsx(Link, { to: playerProfilePagePath(post.createdBy, locale), className: "text-sm font-semibold text-amber-100 hover:underline", children: post.authorName }), _jsxs("p", { className: "text-xs text-zinc-500", children: [when, post.updatedAt ? ` · ${t("comments.edited")}` : ""] })] })] }), post.replyAuthorName ? (_jsxs("blockquote", { className: "mt-3 border-l-2 border-amber-500/40 pl-3 text-xs text-zinc-400", children: [_jsx("span", { className: "font-semibold text-amber-100/90", children: t("comments.quote") }), _jsxs("p", { className: "mt-1", children: [post.replyAuthorName, post.replyExcerpt ? ` · ${post.replyExcerpt}` : ""] })] })) : null, _jsx("div", { className: "mt-3 space-y-2 text-sm leading-relaxed text-zinc-200", children: parseComment(post.body).map((block, index) => (_jsx(BlockView, { block: block, locale: locale }, index))) }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", "aria-pressed": post.likedByMe, className: cn("rounded-full border px-2.5 py-1 text-xs", post.likedByMe ? "border-amber-400/60 text-amber-100" : "border-white/15 text-zinc-400"), onClick: onLike, children: t("comments.like", { count: post.likeCount }) }), _jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400", onClick: onReply, children: t("comments.reply") }), mine ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400", onClick: onEdit, children: t("comments.edit") }), confirming ? (_jsx("button", { type: "button", className: "rounded-full border border-red-400/50 px-2.5 py-1 text-xs text-red-200", onClick: onDelete, children: t("comments.confirmDelete") })) : (_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400", onClick: onAskDelete, children: t("comments.delete") })), confirming ? (_jsx("button", { type: "button", className: "px-2 text-xs text-zinc-500", onClick: onCancelDelete, children: t("comments.cancel") })) : null] })) : post.reportedByMe ? (_jsx("span", { className: "px-1 text-xs text-zinc-500", children: t("comments.reportedDone") })) : (_jsx("button", { type: "button", className: "rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400", onClick: onReport, children: t("comments.report") }))] })] }));
}
function TopicComposer({ draft, sending, onChange, onCancel, onSubmit, }) {
    const { t } = useTranslation();
    const fieldId = useId();
    const areaRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState(null);
    const [mentionStart, setMentionStart] = useState(null);
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
    function wrap(before, after) {
        const el = areaRef.current;
        const value = draft.body;
        const start = el?.selectionStart ?? value.length;
        const end = el?.selectionEnd ?? value.length;
        const selected = value.slice(start, end) || t("comments.sample");
        const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
        onChange(next, draft.mentions);
    }
    function pick(hit) {
        const el = areaRef.current;
        const caret = el?.selectionStart ?? draft.body.length;
        const start = mentionStart ?? caret;
        const label = sanitizeMentionLabel(hit.label);
        if (!label)
            return;
        const visible = `@${label} `;
        const next = `${draft.body.slice(0, start)}${visible}${draft.body.slice(caret)}`;
        const mentions = draft.mentions.some((item) => item.id === hit.id) ? draft.mentions : [...draft.mentions, { id: hit.id, label }];
        setMentionQuery(null);
        setSuggestions([]);
        onChange(next, mentions);
    }
    return (_jsxs("form", { className: "rounded-3xl border border-amber-500/20 bg-black/40 p-4", onSubmit: (event) => {
            event.preventDefault();
            onSubmit();
        }, children: [draft.mode === "reply" && draft.replyTo ? (_jsxs("p", { className: "mb-3 text-xs text-zinc-400", children: [_jsx("span", { className: "font-semibold text-amber-100", children: t("comments.quote") }), ` · ${draft.replyTo.authorName} · ${commentExcerpt(draft.replyTo.body)}`] })) : null, _jsxs("div", { className: "mb-2 flex gap-1", children: [_jsx(Tool, { label: t("comments.bold"), onClick: () => wrap("**", "**"), children: "B" }), _jsx(Tool, { label: t("comments.italic"), onClick: () => wrap("*", "*"), children: "I" }), _jsx(Tool, { label: t("comments.heading"), onClick: () => wrap("# ", ""), children: "H" })] }), _jsx("textarea", { id: fieldId, ref: areaRef, value: draft.body, rows: 4, maxLength: 4000, placeholder: t("topics.replyPlaceholder"), className: "w-full resize-y bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600", onChange: (event) => {
                    onChange(event.target.value, draft.mentions);
                    syncMention(event.target.value, event.target.selectionStart);
                }, onKeyDown: (event) => {
                    if (event.key === "Enter" && suggestions[0] && mentionStart != null) {
                        event.preventDefault();
                        pick(suggestions[0]);
                    }
                } }), suggestions.length > 0 ? (_jsx("ul", { className: "mt-1 overflow-hidden rounded-xl border border-white/10 bg-zinc-950", children: suggestions.map((hit) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5", onMouseDown: (event) => event.preventDefault(), onClick: () => pick(hit), children: ["@", hit.label] }) }, hit.id))) })) : null, _jsxs("div", { className: "mt-3 flex justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded-full px-3 py-1.5 text-xs text-zinc-400", onClick: onCancel, children: t("comments.cancel") }), _jsx("button", { type: "submit", disabled: sending || draft.body.trim().length < 2, className: "rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-50", children: sending ? t("comments.sending") : draft.mode === "edit" ? t("comments.save") : t("comments.publish") })] })] }));
}
function StatusDialog({ mode, sending, onClose, onConfirm, }) {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");
    return (_jsx("div", { className: "fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4", onClick: onClose, children: _jsxs("form", { className: "w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-5", onClick: (event) => event.stopPropagation(), onSubmit: (event) => {
                event.preventDefault();
                onConfirm(reason);
            }, children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-xl text-amber-50", children: t(`topics.statusPrompt.${mode}`) }), mode !== "open" ? (_jsx("textarea", { value: reason, rows: 3, maxLength: 280, placeholder: t("topics.reasonPlaceholder"), onChange: (event) => setReason(event.target.value), className: "mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none" })) : null, _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded-full px-3 py-1.5 text-sm text-zinc-400", onClick: onClose, children: t("comments.cancel") }), _jsx("button", { type: "submit", disabled: sending, className: "rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 disabled:opacity-50", children: t("topics.confirmStatus") })] })] }) }));
}
function BlockView({ block, locale }) {
    if (block.type === "blank")
        return _jsx("div", { className: "h-2" });
    const content = block.spans.map((span, index) => _jsx(SpanView, { span: span, locale: locale }, index));
    if (block.type === "heading")
        return _jsx("h3", { className: "text-base font-semibold text-amber-50", children: content });
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
function Tool({ label, onClick, children }) {
    return (_jsx("button", { type: "button", title: label, "aria-label": label, className: "rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/10", onClick: onClick, children: children }));
}
