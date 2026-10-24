import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Section } from "@/components/ui/Section";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  commentExcerpt,
  displayToStored,
  mentionQueryAt,
  mentionsToDisplay,
  parseComment,
  sanitizeMentionLabel,
  type CommentBlock,
  type CommentMention,
  type CommentSpan,
} from "@/lib/commentMarkup";
import { cn } from "@/lib/cn";
import { localeToHtmlLang } from "@/lib/locale";
import { localeAuthPath } from "@/lib/localeRoutes";
import { PAGE_COMMENT_PAGE_SIZE, type CommentErrorCode, type PageComment } from "@/lib/pageComments";
import {
  createPageComment,
  deletePageComment,
  fetchMyCommentActivity,
  fetchPageComments,
  reportPageComment,
  searchCommentMentions,
  togglePageCommentLike,
  updatePageComment,
  type MentionHit,
} from "@/lib/pageCommentsApi";
import { playerProfilePagePath } from "@/lib/playersApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Draft =
  | { mode: "new"; body: string; mentions: CommentMention[] }
  | { mode: "reply"; body: string; mentions: CommentMention[]; replyTo: PageComment }
  | { mode: "edit"; body: string; mentions: CommentMention[]; commentId: string };

export function MapComments({ slug, mapName }: { slug: string; mapName: string }) {
  const { t } = useTranslation();
  return <PageComments key={slug} pageKind="mapas" pageKey={slug} itemName={mapName} kindLabel={t("comments.kinds.map")} />;
}

export function PageComments({
  pageKind,
  pageKey,
  itemName,
  kindLabel,
}: {
  pageKind: string;
  pageKey: string;
  itemName: string;
  kindLabel: string;
}) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const { status, user, profile } = useAuth();
  const loggedIn = status === "authenticated" && Boolean(user);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<PageComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_COMMENT_PAGE_SIZE));

  const firstLoad = useRef(true);
  const itemIds = items.map((item) => item.id).join(",");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }
    let cancel = false;
    const run = () => {
      void fetchPageComments(pageKind, pageKey, page, null).then((result) => {
        if (cancel) return;
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
  }, [pageKind, pageKey, page]);

  useEffect(() => {
    if (!user?.id || !itemIds) return;
    let cancel = false;
    void fetchMyCommentActivity(itemIds.split(","), user.id).then((flags) => {
      if (cancel || !flags) return;
      const liked = new Set(flags.liked);
      const reported = new Set(flags.reported);
      setItems((current) =>
        current.map((item) => ({
          ...item,
          likedByMe: liked.has(item.id),
          reportedByMe: reported.has(item.id),
        })),
      );
    });
    return () => {
      cancel = true;
    };
  }, [user?.id, itemIds]);

  function openDraft(next: Draft) {
    setDraft(next);
    setConfirmDeleteId(null);
    window.setTimeout(() => composerRef.current?.scrollIntoView({ block: "nearest" }), 0);
  }

  function fail(reason: "unconfigured" | "save" | CommentErrorCode) {
    if (reason === "unconfigured") showToast(t("notifications.errors.unconfigured"), "error");
    else if (reason === "save") showToast(t("comments.errors.save"), "error");
    else showToast(t(`comments.errors.${reason}`), "error");
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
    if (!draft || !user || sending) return;
    const body = displayToStored(draft.body, draft.mentions).trim();
    if (body.length < 2) {
      showToast(t("comments.errors.comment_too_short"), "error");
      return;
    }
    setSending(true);
    const result =
      draft.mode === "edit"
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

  async function remove(id: string) {
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

  async function like(comment: PageComment) {
    if (!user) {
      showToast(t("comments.loginToAct"), "error");
      return;
    }
    const result = await togglePageCommentLike(comment.id, user.id, comment.likedByMe);
    if (!result.ok) {
      fail(result.reason);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === comment.id
          ? {
              ...item,
              likedByMe: !comment.likedByMe,
              likeCount: Math.max(0, item.likeCount + (comment.likedByMe ? -1 : 1)),
            }
          : item,
      ),
    );
  }

  async function report(comment: PageComment) {
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

  return (
    <Section title={t("comments.title")} className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {loaded ? <p className="text-xs text-zinc-500">{t("comments.count", { count: total })}</p> : <span />}
        {loggedIn ? (
          <button
            type="button"
            className="rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25"
            onClick={() => (draft?.mode === "new" ? setDraft(null) : openDraft({ mode: "new", body: "", mentions: [] }))}
          >
            {draft?.mode === "new" ? t("comments.cancel") : t("comments.new")}
          </button>
        ) : (
          <Link
            to={localeAuthPath(locale, "login")}
            className="rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25"
          >
            {t("comments.loginToPost")}
          </Link>
        )}
      </div>

      {draft ? (
        <div ref={composerRef} className="mb-5">
          <CommentComposer
            key={draft.mode === "edit" ? draft.commentId : draft.mode === "reply" ? draft.replyTo.id : "new"}
            itemName={itemName}
            kindLabel={kindLabel}
            draft={draft}
            sending={sending}
            onChange={(body, mentions) => setDraft({ ...draft, body, mentions })}
            onCancel={() => setDraft(null)}
            onSubmit={() => void publish()}
          />
        </div>
      ) : null}

      {loaded && error ? <p className="text-sm text-red-200">{t("comments.loadError")}</p> : null}
      {loaded && !error && items.length === 0 ? <p className="text-sm text-zinc-400">{t("comments.empty")}</p> : null}

      <ul className="space-y-3">
        {items.map((comment) => (
          <li key={comment.id}>
            <CommentCard
              comment={comment}
              localeTag={localeToHtmlLang(locale)}
              locale={locale}
              mine={user?.id === comment.createdBy}
              confirming={confirmDeleteId === comment.id}
              onReply={() => {
                if (!user) {
                  showToast(t("comments.loginToAct"), "error");
                  return;
                }
                openDraft({ mode: "reply", body: "", mentions: [], replyTo: comment });
              }}
              onEdit={() => {
                const shown = mentionsToDisplay(comment.body);
                openDraft({ mode: "edit", body: shown.text, mentions: shown.mentions, commentId: comment.id });
              }}
              onLike={() => void like(comment)}
              onReport={() => void report(comment)}
              onAskDelete={() => setConfirmDeleteId(comment.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onDelete={() => void remove(comment.id)}
            />
          </li>
        ))}
      </ul>

      {loaded && total > PAGE_COMMENT_PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 enabled:hover:border-white/30 disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            {t("comments.previous")}
          </button>
          <p className="text-xs text-zinc-500">{t("comments.page", { current: page + 1, total: pageCount })}</p>
          <button
            type="button"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 enabled:hover:border-white/30 disabled:opacity-40"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("comments.next")}
          </button>
        </div>
      ) : null}
    </Section>
  );
}

function CommentComposer({
  itemName,
  kindLabel,
  draft,
  sending,
  onChange,
  onCancel,
  onSubmit,
}: {
  itemName: string;
  kindLabel: string;
  draft: Draft;
  sending: boolean;
  onChange: (body: string, mentions: CommentMention[]) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const fieldId = useId();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<MentionHit[]>([]);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancel = false;
    const timer = window.setTimeout(() => {
      void searchCommentMentions(mentionQuery).then((hits) => {
        if (!cancel) setSuggestions(hits);
      });
    }, 220);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [mentionQuery]);

  function syncMention(value: string, caret: number) {
    const found = mentionQueryAt(value, caret);
    if (!found || found.query.length < 2) {
      setMentionQuery(null);
      setMentionStart(null);
      return;
    }
    setMentionQuery(found.query);
    setMentionStart(found.start);
  }

  function updateBody(value: string, caret: number) {
    onChange(value, draft.mentions);
    syncMention(value, caret);
  }

  function wrap(before: string, after: string) {
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

  function pickMention(hit: MentionHit) {
    const el = areaRef.current;
    const caret = el?.selectionStart ?? draft.body.length;
    const start = mentionStart ?? caret;
    const label = sanitizeMentionLabel(hit.label);
    if (!label) return;
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

  return (
    <form
      className="rounded-xl border border-white/10 bg-black/25 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="text-xs font-semibold tracking-wide text-zinc-400">{t("comments.formTitle")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <LockedField label={t("comments.kind")} value={kindLabel} />
        <LockedField label={t("comments.item")} value={itemName} />
      </div>
      {draft.mode === "reply" ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <p className="text-xs font-semibold text-amber-100">{t("comments.quote")}</p>
          <p className="mt-1 text-xs text-zinc-400">
            <span className="text-zinc-200">{draft.replyTo.authorName}</span>
            {" · "}
            {commentExcerpt(draft.replyTo.body)}
          </p>
        </div>
      ) : null}
      <label htmlFor={fieldId} className="mt-3 block text-xs font-semibold text-zinc-400">
        {draft.mode === "edit" ? t("comments.editing") : t("comments.post")}
      </label>
      <div className="mt-1 overflow-hidden rounded-lg border border-white/10 bg-zinc-950/70">
        <div className="flex gap-1 border-b border-white/10 px-2 py-1">
          <ToolButton label={t("comments.bold")} onClick={() => wrap("**", "**")}>
            <span className="font-bold">B</span>
          </ToolButton>
          <ToolButton label={t("comments.italic")} onClick={() => wrap("*", "*")}>
            <span className="italic">I</span>
          </ToolButton>
          <ToolButton label={t("comments.heading")} onClick={heading}>
            H
          </ToolButton>
        </div>
        <textarea
          id={fieldId}
          ref={areaRef}
          value={draft.body}
          maxLength={4000}
          rows={5}
          placeholder={t("comments.placeholder")}
          className="w-full resize-y bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          onChange={(event) => updateBody(event.target.value, event.target.selectionStart)}
          onClick={(event) => syncMention(event.currentTarget.value, event.currentTarget.selectionStart)}
          onKeyUp={(event) => syncMention(event.currentTarget.value, event.currentTarget.selectionStart)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setSuggestions([]);
              setMentionStart(null);
            }
            if (event.key === "Enter" && suggestions.length > 0 && mentionStart != null) {
              event.preventDefault();
              const first = suggestions[0];
              if (first) pickMention(first);
            }
          }}
        />
      </div>
      {suggestions.length > 0 ? (
        <ul className="mt-1 overflow-hidden rounded-lg border border-white/10 bg-zinc-950" role="listbox">
          {suggestions.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pickMention(hit)}
              >
                @{hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">{t("comments.mentionHint")}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200" onClick={onCancel}>
          {t("comments.cancel")}
        </button>
        <button
          type="submit"
          disabled={sending || draft.body.trim().length < 2}
          className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 enabled:hover:bg-amber-400 disabled:opacity-50"
        >
          {sending ? t("comments.sending") : draft.mode === "edit" ? t("comments.save") : t("comments.publish")}
        </button>
      </div>
    </form>
  );
}

function CommentCard({
  comment,
  localeTag,
  locale,
  mine,
  confirming,
  onReply,
  onEdit,
  onLike,
  onReport,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  comment: PageComment;
  localeTag: string;
  locale: "pt" | "en";
  mine: boolean;
  confirming: boolean;
  onReply: () => void;
  onEdit: () => void;
  onLike: () => void;
  onReport: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(comment.createdAt));
  const blocks = parseComment(comment.body);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <div className="flex flex-col md:flex-row">
        <div className="min-w-0 flex-1 px-4 py-3">
          <p className="text-xs text-zinc-500">
            <Link to={playerProfilePagePath(comment.createdBy, locale)} className="font-semibold text-amber-100 hover:underline">
              {comment.authorName}
            </Link>
            <span> · {when}</span>
            {comment.updatedAt ? <span> · {t("comments.edited")}</span> : null}
          </p>
          {comment.replyAuthorName ? (
            <blockquote className="mt-3 border-l-2 border-amber-500/40 pl-3 text-xs text-zinc-400">
              <p className="font-semibold text-amber-100/90">{t("comments.quote")}</p>
              <p className="mt-1">
                {comment.replyAuthorName}
                {comment.replyExcerpt ? ` · ${comment.replyExcerpt}` : ""}
              </p>
            </blockquote>
          ) : null}
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-200">
            {blocks.map((block, index) => (
              <CommentBlockView key={index} block={block} locale={locale} />
            ))}
          </div>
        </div>
        <aside className="flex items-center gap-3 border-t border-white/10 px-4 py-3 md:w-40 md:flex-col md:items-center md:border-l md:border-t-0 md:text-center">
          <AuthorAvatar name={comment.authorName} logo={comment.authorLogo} />
          <p className="text-xs font-semibold text-zinc-200">{comment.authorName}</p>
        </aside>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2">
        <button
          type="button"
          aria-pressed={comment.likedByMe}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            comment.likedByMe ? "border-amber-400/60 bg-amber-500/15 text-amber-100" : "border-white/15 text-zinc-400 hover:text-zinc-200",
          )}
          onClick={onLike}
        >
          {t("comments.like", { count: comment.likeCount })}
        </button>
        <button type="button" className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200" onClick={onReply}>
          {t("comments.reply")}
        </button>
        {mine ? (
          <>
            <button type="button" className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200" onClick={onEdit}>
              {t("comments.edit")}
            </button>
            {confirming ? (
              <>
                <button type="button" className="rounded-full border border-red-400/50 px-2.5 py-1 text-xs text-red-200" onClick={onDelete}>
                  {t("comments.confirmDelete")}
                </button>
                <button type="button" className="px-2 text-xs text-zinc-500" onClick={onCancelDelete}>
                  {t("comments.cancel")}
                </button>
              </>
            ) : (
              <button type="button" className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200" onClick={onAskDelete}>
                {t("comments.delete")}
              </button>
            )}
          </>
        ) : comment.reportedByMe ? (
          <span className="px-1 text-xs text-zinc-500">{t("comments.reportedDone")}</span>
        ) : (
          <button type="button" className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200" onClick={onReport}>
            {t("comments.report")}
          </button>
        )}
      </div>
    </article>
  );
}

function CommentBlockView({ block, locale }: { block: CommentBlock; locale: "pt" | "en" }) {
  if (block.type === "blank") return <div className="h-2" />;
  const content = block.spans.map((span, index) => <SpanView key={index} span={span} locale={locale} />);
  if (block.type === "heading") return <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-amber-50">{content}</h3>;
  return <p>{content}</p>;
}

function SpanView({ span, locale }: { span: CommentSpan; locale: "pt" | "en" }) {
  if (span.type === "bold") return <strong className="font-semibold text-zinc-50">{span.text}</strong>;
  if (span.type === "italic") return <em>{span.text}</em>;
  if (span.type === "mention") {
    return (
      <Link to={playerProfilePagePath(span.id, locale)} className="font-semibold text-amber-200 hover:underline">
        @{span.label}
      </Link>
    );
  }
  return <span>{span.text}</span>;
}

function AuthorAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) return <img src={logo} alt="" className="size-12 rounded-full object-cover" />;
  return (
    <span className="flex size-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-amber-100">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500">{label}</span>
      <input readOnly value={value} className="mt-1 w-full cursor-default rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300" />
    </label>
  );
}

function scheduleAfterPaint(run: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => run(), { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 1);
  return () => window.clearTimeout(id);
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/10" onClick={onClick}>
      {children}
    </button>
  );
}
