import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { TopicCategoryBadge } from "@/components/community/TopicCategoryBadge";
import { SearchField } from "@/components/ui/SearchField";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { displayToStored } from "@/lib/commentMarkup";
import { cn } from "@/lib/cn";
import {
  TOPIC_CATEGORIES,
  TOPIC_PAGE_SIZE,
  type CommunityTopic,
  type SimilarTopic,
  type TopicCategory,
  type TopicErrorCode,
} from "@/lib/communityTopics";
import { createCommunityTopic, fetchCommunityTopics, findSimilarCommunityTopics } from "@/lib/communityTopicsApi";
import { localeToHtmlLang } from "@/lib/locale";
import { localeAuthPath, localeCommunityTopicsPath } from "@/lib/localeRoutes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function CommunityTopicsPage() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const { status, user } = useAuth();
  const loggedIn = status === "authenticated" && Boolean(user);
  const localeTag = localeToHtmlLang(locale);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<TopicCategory | "all">("all");
  const [items, setItems] = useState<CommunityTopic[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const pageCount = Math.max(1, Math.ceil(total / TOPIC_PAGE_SIZE));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, category]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }
    let cancel = false;
    void fetchCommunityTopics({ page, query: debouncedQuery, category }).then((result) => {
      if (cancel) return;
      if (!result.ok) {
        setError(true);
        setLoaded(true);
        return;
      }
      const last = Math.max(0, Math.ceil(result.data.total / TOPIC_PAGE_SIZE) - 1);
      if (page > last) {
        setPage(last);
        return;
      }
      setError(false);
      setItems(result.data.items);
      setTotal(result.data.total);
      setLoaded(true);
    });
    return () => {
      cancel = true;
    };
  }, [page, debouncedQuery, category]);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.16),transparent_55%),linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.92))] px-6 py-8 shadow-lg shadow-black/30 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">{t("topics.kicker")}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-amber-50 sm:text-4xl">
              {t("topics.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">{t("topics.description")}</p>
          </div>
          {loggedIn ? (
            <button
              type="button"
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
              onClick={() => setCreating(true)}
            >
              {t("topics.create")}
            </button>
          ) : (
            <Link
              to={localeAuthPath(locale, "login")}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
            >
              {t("topics.loginToCreate")}
            </Link>
          )}
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          id="topic-search"
          value={query}
          onChange={setQuery}
          placeholder={t("topics.search")}
          className="relative min-w-0 flex-1"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
          {t("topics.allCategories")}
        </FilterChip>
        {TOPIC_CATEGORIES.map((item) => (
          <TopicCategoryBadge
            key={item}
            category={item}
            label={t(`topics.categories.${item}`)}
            selected={category === item}
            onClick={() => setCategory(item)}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loaded && error ? <p className="text-sm text-red-200">{t("topics.loadError")}</p> : null}
        {loaded && !error && items.length === 0 ? (
          <p className="text-sm text-zinc-400">{debouncedQuery || category !== "all" ? t("topics.empty") : t("topics.emptyAll")}</p>
        ) : null}
        {items.map((topic) => (
          <TopicRow key={topic.id} topic={topic} locale={locale} localeTag={localeTag} />
        ))}
      </div>

      {loaded && total > TOPIC_PAGE_SIZE ? (
        <div className="mt-6 flex items-center justify-between gap-3">
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

      {creating ? (
        <CreateTopicDialog
          onClose={() => setCreating(false)}
          onCreated={(slug) => {
            setCreating(false);
            showToast(t("topics.created"));
          }}
          fail={(reason) => {
            if (reason === "unconfigured") showToast(t("notifications.errors.unconfigured"), "error");
            else if (reason === "save" || reason.startsWith("comment_")) {
              showToast(reason.startsWith("comment_") ? t(`comments.errors.${reason}`) : t("topics.errors.save"), "error");
            } else showToast(t(`topics.errors.${reason}`), "error");
          }}
        />
      ) : null}
    </div>
  );
}

function TopicRow({ topic, locale, localeTag }: { topic: CommunityTopic; locale: "pt" | "en"; localeTag: string }) {
  const { t } = useTranslation();
  const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(topic.lastPostAt));
  const closed = topic.status !== "open";
  return (
    <Link
      to={localeCommunityTopicsPath(locale, topic.slug)}
      className={cn(
        "group block rounded-2xl border px-5 py-4 transition",
        closed
          ? "border-white/10 bg-zinc-950/40 opacity-80 hover:border-white/20"
          : "border-amber-500/15 bg-zinc-950/60 hover:border-amber-400/40 hover:bg-zinc-900/80",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <TopicCategoryBadge category={topic.category} label={t(`topics.categories.${topic.category}`)} />
        {closed ? (
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
            {t(`topics.status.${topic.status}`)}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-zinc-500">{t("topics.replies", { count: topic.postCount })}</span>
      </div>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-50 group-hover:text-amber-100">
        {topic.title}
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        {topic.authorName} · {when}
      </p>
      {closed && topic.statusReason ? <p className="mt-3 text-sm text-zinc-400">{topic.statusReason}</p> : null}
    </Link>
  );
}

function CreateTopicDialog({
  onClose,
  onCreated,
  fail,
}: {
  onClose: () => void;
  onCreated: (slug: string) => void;
  fail: (reason: "unconfigured" | "save" | TopicErrorCode) => void;
}) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const titleId = useId();
  const bodyId = useId();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TopicCategory>("game");
  const [body, setBody] = useState("");
  const [similar, setSimilar] = useState<SimilarTopic[] | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function publish(force: boolean) {
    const cleanTitle = title.trim();
    const stored = displayToStored(body, []).trim();
    if (cleanTitle.length < 4) {
      fail("topic_title_short");
      return;
    }
    if (stored.length < 2) {
      fail("comment_too_short");
      return;
    }
    setSending(true);
    if (!force) {
      const found = await findSimilarCommunityTopics(cleanTitle);
      if (found.length > 0) {
        setSimilar(found);
        setSending(false);
        return;
      }
    }
    const result = await createCommunityTopic({ title: cleanTitle, category, body: stored });
    setSending(false);
    if (!result.ok || !result.slug) {
      fail(result.ok ? "save" : result.reason);
      return;
    }
    onCreated(result.slug);
    navigate(localeCommunityTopicsPath(locale, result.slug));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <form
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-amber-500/25 bg-zinc-950 p-6 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          void publish(false);
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">{t("topics.kicker")}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-amber-50">{t("topics.createTitle")}</h2>
        <label htmlFor={titleId} className="mt-5 block text-xs font-semibold text-zinc-400">
          {t("topics.topicTitle")}
        </label>
        <input
          id={titleId}
          value={title}
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            setSimilar(null);
          }}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400/50"
        />
        <p className="mt-4 text-xs font-semibold text-zinc-400">{t("topics.category")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TOPIC_CATEGORIES.map((item) => (
            <TopicCategoryBadge
              key={item}
              category={item}
              label={t(`topics.categories.${item}`)}
              selected={category === item}
              onClick={() => setCategory(item)}
            />
          ))}
        </div>
        <label htmlFor={bodyId} className="mt-4 block text-xs font-semibold text-zinc-400">
          {t("topics.opening")}
        </label>
        <textarea
          id={bodyId}
          value={body}
          rows={5}
          maxLength={4000}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("topics.openingPlaceholder")}
          className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400/50"
        />
        <p className="mt-2 text-xs text-zinc-500">{t("comments.mentionHint")}</p>
        {similar && similar.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-50">{t("topics.similarWarning")}</p>
            <ul className="mt-2 space-y-1">
              {similar.map((item) => (
                <li key={item.id}>
                  <Link to={localeCommunityTopicsPath(locale, item.slug)} className="text-sm text-amber-200 underline-offset-2 hover:underline">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={sending}
              className="mt-3 rounded-full border border-amber-300/50 px-3 py-1.5 text-xs font-semibold text-amber-50 disabled:opacity-50"
              onClick={() => void publish(true)}
            >
              {t("topics.createAnyway")}
            </button>
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-full px-3 py-1.5 text-sm text-zinc-400" onClick={onClose}>
            {t("comments.cancel")}
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {sending ? t("topics.creating") : t("topics.publishTopic")}
          </button>
        </div>
      </form>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold",
        active ? "border-white/40 bg-white/10 text-zinc-50" : "border-white/10 text-zinc-400 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}
