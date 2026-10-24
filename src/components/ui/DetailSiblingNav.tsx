import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { PageSuggestionButton } from "@/components/suggestions/PageSuggestionButton";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import {
  detailNavScopeFromState,
  detailSiblingPaths,
  type DetailNavSection,
} from "@/lib/detailSibling";

const buttonClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/50 text-amber-100/90 transition hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {direction === "prev" ? (
        <path
          d="M19 12H5M11 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

type DetailSiblingNavProps = {
  prevTo: string;
  nextTo: string;
  state?: unknown;
  className?: string;
};

export function DetailSiblingNav({ prevTo, nextTo, state, className }: DetailSiblingNavProps) {
  const { t } = useTranslation();
  const previousLabel = t("common.previousRecord");
  const nextLabel = t("common.nextRecord");

  return (
    <div role="group" aria-label={t("common.recordNavigation")} className={cn("flex items-center gap-1.5", className)}>
      <Link to={prevTo} state={state} title={previousLabel} aria-label={previousLabel} className={buttonClass}>
        <ArrowIcon direction="prev" />
      </Link>
      <Link to={nextTo} state={state} title={nextLabel} aria-label={nextLabel} className={buttonClass}>
        <ArrowIcon direction="next" />
      </Link>
      <PageSuggestionButton />
    </div>
  );
}

type CatalogRecordNavProps = {
  section: DetailNavSection;
  /** Id numérico da ficha. Mapas e tecnologias usam o índice na lista. */
  currentId: number;
  className?: string;
};

/** Setas da ficha atual para a anterior e a próxima da mesma lista, em ordem de id. */
export function CatalogRecordNav({ section, currentId, className }: CatalogRecordNavProps) {
  const catalog = useCatalog();
  const { locale } = useTranslation();
  const { state } = useLocation();
  const paths = useMemo(
    () => detailSiblingPaths(catalog, section, currentId, locale, detailNavScopeFromState(state)),
    [catalog, section, currentId, locale, state],
  );
  if (!paths) return null;
  return <DetailSiblingNav prevTo={paths.prev} nextTo={paths.next} state={state} className={className} />;
}
