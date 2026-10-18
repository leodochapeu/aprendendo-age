import type { ReactNode } from "react";

import { useListHeaderCollapse } from "@/components/layout/listHeaderCollapse";
import { AppTag, type AppTagVariant } from "@/components/ui/AppTag";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";

type PageHeaderBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Mesmo asset da marca d’água: ícone ao lado do título/descrição. */
  headerIconSrc?: string;
  /** Se true, a descrição é mostrada dentro de {@link AppTag} (comportamento análogo a `subtitleTag` em EntityCard). */
  descriptionTag?: boolean;
  /** Variante do {@link AppTag} quando `descriptionTag` está ativo. */
  descriptionTagVariant?: AppTagVariant;
  /** `end`: ícone à direita e texto alinhado à direita (ex.: coluna numa comparação). */
  align?: "start" | "end";
  className?: string;
  /** Classes extra no `<h1>` (ex.: tamanho responsivo em páginas de comparação). */
  titleClassName?: string;
  /** Botão ao lado do título, usado pela barra fixa das listas. */
  titleAccessory?: ReactNode;
};

export function PageHeaderBlock({
  title,
  description,
  headerIconSrc,
  descriptionTag = false,
  descriptionTagVariant = "amber",
  align = "start",
  className,
  titleClassName,
  titleAccessory,
}: PageHeaderBlockProps) {
  const icon =
    headerIconSrc ? (
      <img
        src={headerIconSrc}
        alt=""
        aria-hidden
        className="h-20 w-20 shrink-0 rounded-xl border border-aom-border bg-zinc-900/60 object-contain p-1.5 shadow-sm shadow-black/30"
      />
    ) : null;

  const hasDescription =
    description != null && (typeof description !== "string" || description !== "");
  const useDescriptionTag = descriptionTag && hasDescription;
  const descriptionBody = useDescriptionTag ? (
    <AppTag
      variant={descriptionTagVariant}
      className="mt-2 align-top leading-snug [word-break:break-word] normal-case"
    >
      {description}
    </AppTag>
  ) : hasDescription ? (
    typeof description === "string" ? (
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
    ) : (
      <div className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</div>
    )
  ) : null;

  const isEnd = align === "end";

  const inner = (
    <div
      className={cn(
        "inline-flex max-w-full min-w-0 items-start gap-4",
        isEnd ? "flex-row-reverse" : false,
        !isEnd ? className : false,
      )}
    >
      {icon}
      <div className={cn("min-w-0", isEnd && "text-right")}>
        <h1
          className={cn(
            "font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-100",
            titleAccessory ? "inline-flex max-w-full items-center gap-3" : false,
            titleClassName ?? "text-3xl",
          )}
        >
          {titleAccessory ? <span className="min-w-0">{title}</span> : title}
          {titleAccessory}
        </h1>
        {descriptionBody}
      </div>
    </div>
  );

  if (isEnd) {
    return <div className={cn("flex min-w-0 justify-end", className)}>{inner}</div>;
  }

  return inner;
}

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Mesmo asset da marca d’água: ícone à esquerda do título/descrição. */
  headerIconSrc?: string;
  /** Se true, a descrição é mostrada dentro de `AppTag`. */
  descriptionTag?: boolean;
  descriptionTagVariant?: AppTagVariant;
  actions?: ReactNode;
  className?: string;
};

function ListHeaderCollapseButton() {
  const { t } = useTranslation();
  const collapse = useListHeaderCollapse();
  if (!collapse) return null;
  const label = collapse.open ? t("common.collapseHeader") : t("common.expandHeader");
  return (
    <button
      type="button"
      onClick={collapse.toggle}
      aria-expanded={collapse.open}
      aria-controls={collapse.controlsId}
      title={label}
      aria-label={label}
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/50 text-amber-100/90 transition hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={cn("transition-transform", collapse.open && "rotate-180")}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {collapse.marked && !collapse.open ? (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
      ) : null}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  headerIconSrc,
  descriptionTag,
  descriptionTagVariant,
  actions,
  className,
}: PageHeaderProps) {
  const collapse = useListHeaderCollapse();
  const expanded = collapse?.open ?? true;
  return (
    <header
      className={cn(
        "mb-8 flex w-full max-w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <PageHeaderBlock
        title={title}
        description={expanded ? description : undefined}
        headerIconSrc={headerIconSrc}
        descriptionTag={descriptionTag}
        descriptionTagVariant={descriptionTagVariant}
        titleAccessory={collapse ? <ListHeaderCollapseButton /> : undefined}
      />
      {expanded && actions ? <div className="shrink-0 sm:ml-auto">{actions}</div> : null}
    </header>
  );
}
