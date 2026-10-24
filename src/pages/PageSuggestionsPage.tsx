import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { cn } from "@/lib/cn";
import { PAGE_SUGGESTION_TAGS, type PageSuggestion, type PageSuggestionTag } from "@/lib/pageSuggestions";
import { fetchPageSuggestions } from "@/lib/pageSuggestionsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SuggestionsPanel() {
  const { t, locale } = useTranslation();
  const configured = isSupabaseConfigured();
  const localeTag = localeToHtmlLang(locale);
  const [items, setItems] = useState<PageSuggestion[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);
  const [tag, setTag] = useState<PageSuggestionTag | "all">("all");

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let cancel = false;
    setLoading(true);
    void fetchPageSuggestions().then((result) => {
      if (cancel) return;
      if (!result.ok) setError(true);
      else setItems(result.data);
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [configured]);

  const visible = tag === "all" ? items : items.filter((item) => item.tag === tag);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={tag === "all"} onClick={() => setTag("all")}>
          {t("suggestions.allTags")}
        </FilterChip>
        {PAGE_SUGGESTION_TAGS.map((item) => (
          <FilterChip key={item} active={tag === item} onClick={() => setTag(item)}>
            {t(`suggestions.tags.${item}`)}
          </FilterChip>
        ))}
      </div>
      {loading ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
      {!loading && error ? <p className="text-sm text-red-200">{t("suggestions.loadError")}</p> : null}
      {!loading && !error && visible.length === 0 ? <p className="text-sm text-zinc-400">{t("suggestions.empty")}</p> : null}
      <ul className="divide-y divide-white/10">
        {visible.map((item) => (
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold tracking-wide text-amber-100">
                {t(`suggestions.tags.${item.tag}`)}
              </span>
              <span>{item.system}</span>
              <span>{new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</span>
              <span>{item.authorName}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-200">
              <Link to={item.pagePath} className="text-amber-200 underline-offset-2 hover:underline">
                {item.pageTitle || item.pagePath}
              </Link>
            </p>
            {item.section ? <p className="mt-1 text-xs text-zinc-400">{item.section}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{item.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
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
