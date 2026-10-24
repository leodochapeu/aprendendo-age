import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { commentExcerpt } from "@/lib/commentMarkup";
import { canSuggestPageChange } from "@/lib/auth/constants";
import { localeToHtmlLang } from "@/lib/locale";
import { localeSectionPath, type LocaleSection } from "@/lib/localeRoutes";
import { type CommentReport } from "@/lib/pageComments";
import { deletePageComment, dismissCommentReport, fetchCommentReports } from "@/lib/pageCommentsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const KINDS = new Set<LocaleSection>([
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
  const configured = isSupabaseConfigured();
  const localeTag = localeToHtmlLang(locale);
  const allowed = status === "authenticated" && profileLoadState === "ready" && canSuggestPageChange(profile?.role);
  const authPending = status === "loading" || (status === "authenticated" && profileLoadState !== "ready");
  const [items, setItems] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    let cancel = false;
    setLoading(true);
    void fetchCommentReports().then((result) => {
      if (cancel) return;
      if (!result.ok) setError(true);
      else setItems(result.data);
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [allowed]);

  async function refresh() {
    const result = await fetchCommentReports();
    if (!result.ok) {
      setError(true);
      return;
    }
    setError(false);
    setItems(result.data);
  }

  async function dismiss(id: string) {
    setBusyId(id);
    const result = await dismissCommentReport(id);
    setBusyId(null);
    if (!result.ok) {
      showToast(t("comments.errors.save"), "error");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function removeComment(report: CommentReport) {
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("comments.moderationTitle")} description={allowed ? t("comments.moderationDescription") : undefined} />
      {!configured ? <p className="text-sm text-zinc-400">{t("notifications.errors.unconfigured")}</p> : null}
      {configured && authPending ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
      {configured && !authPending && !allowed ? <p className="text-sm text-zinc-400">{t("comments.moderationForbidden")}</p> : null}
      {allowed ? (
        <>
          {loading ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
          {!loading && error ? <p className="text-sm text-red-200">{t("comments.loadError")}</p> : null}
          {!loading && !error && items.length === 0 ? <p className="text-sm text-zinc-400">{t("comments.moderationEmpty")}</p> : null}
          <ul className="divide-y divide-white/10">
            {items.map((item) => {
              const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt));
              const href = KINDS.has(item.pageKind as LocaleSection)
                ? localeSectionPath(locale, item.pageKind as LocaleSection, item.pageKey)
                : null;
              return (
                <li key={item.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 font-semibold text-red-100">
                      {t("comments.report")}
                    </span>
                    <span>{when}</span>
                    <span>{t("comments.reportedBy", { name: item.reporterName })}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">
                    {href ? (
                      <Link to={href} className="text-amber-200 underline-offset-2 hover:underline">
                        {item.pageTitle}
                      </Link>
                    ) : (
                      item.pageTitle
                    )}
                    <span className="text-zinc-500"> · {item.authorName}</span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{commentExcerpt(item.body, 400)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 disabled:opacity-50"
                      onClick={() => void dismiss(item.id)}
                    >
                      {t("comments.dismiss")}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-200 disabled:opacity-50"
                      onClick={() => void removeComment(item)}
                    >
                      {t("comments.remove")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
