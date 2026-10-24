import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { commentExcerpt } from "@/lib/commentMarkup";
import { cn } from "@/lib/cn";
import { localeToHtmlLang } from "@/lib/locale";
import { localeCommunityTopicsPath, localeSectionPath, type LocaleSection } from "@/lib/localeRoutes";
import {
  fetchRecentMessages,
  isRecentMessageArea,
  RECENT_MESSAGE_AREAS,
  RECENT_MESSAGE_PAGE_SIZE,
  type RecentMessage,
  type RecentMessageArea,
} from "@/lib/recentMessagesApi";

const PAGE_KINDS = new Set<string>(RECENT_MESSAGE_AREAS.filter((area) => area !== "topicos"));

export function RecentCommentsPanel() {
  const { t, locale } = useTranslation();
  const localeTag = localeToHtmlLang(locale);
  const [area, setArea] = useState<RecentMessageArea | "all">("all");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<RecentMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pageCount = Math.max(1, Math.ceil(total / RECENT_MESSAGE_PAGE_SIZE));

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    void fetchRecentMessages(area, page).then((result) => {
      if (cancel) return;
      if (!result.ok) {
        setError(true);
        setLoading(false);
        return;
      }
      const last = Math.max(0, Math.ceil(result.total / RECENT_MESSAGE_PAGE_SIZE) - 1);
      if (page > last) {
        setPage(last);
        return;
      }
      setError(false);
      setItems(result.items);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [area, page]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={area === "all"} onClick={() => { setArea("all"); setPage(0); }}>
          {t("comments.recentAllAreas")}
        </FilterChip>
        {RECENT_MESSAGE_AREAS.map((item) => (
          <FilterChip
            key={item}
            active={area === item}
            onClick={() => {
              setArea(item);
              setPage(0);
            }}
          >
            {t(`comments.recentAreas.${item}`)}
          </FilterChip>
        ))}
      </div>
      {loading ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
      {!loading && error ? <p className="text-sm text-red-200">{t("comments.loadError")}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-zinc-400">{area === "all" ? t("comments.recentEmptyAll") : t("comments.recentEmpty")}</p>
      ) : null}
      <ul className="divide-y divide-white/10">
        {items.map((item) => {
          const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt));
          const href = originHref(locale, item);
          const areaLabel = isRecentMessageArea(item.area) ? t(`comments.recentAreas.${item.area}`) : item.area;
          return (
            <li key={`${item.area}-${item.id}`} className="py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-100">{areaLabel}</span>
                <span>{when}</span>
                <span>{item.authorName}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-200">
                {href ? (
                  <Link to={href} className="text-amber-200 underline-offset-2 hover:underline">
                    {item.originTitle}
                  </Link>
                ) : (
                  item.originTitle
                )}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{commentExcerpt(item.body, 280)}</p>
            </li>
          );
        })}
      </ul>
      {!loading && total > RECENT_MESSAGE_PAGE_SIZE ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            {t("comments.previous")}
          </button>
          <p className="text-xs text-zinc-500">{t("comments.page", { current: page + 1, total: pageCount })}</p>
          <button type="button" className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)}>
            {t("comments.next")}
          </button>
        </div>
      ) : null}
    </>
  );
}

function originHref(locale: "pt" | "en", item: RecentMessage): string | null {
  const focus = `comentario=${encodeURIComponent(item.id)}`;
  if (item.area === "topicos") return `${localeCommunityTopicsPath(locale, item.originKey)}?${focus}`;
  if (!PAGE_KINDS.has(item.area)) return null;
  return `${localeSectionPath(locale, item.area as LocaleSection, item.originKey)}?${focus}`;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition",
        active ? "border-amber-400/70 bg-amber-500/20 text-amber-100" : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}
