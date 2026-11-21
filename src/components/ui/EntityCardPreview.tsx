import type { ReactNode } from "react";

import { NotionText } from "@/components/ui/NotionText";
import type { DeusExplicacaoBloco } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";

export type EntityCardPreviewStat = {
  icon?: string;
  label: string;
  value: ReactNode;
  valueClassName?: string;
};

export function EntityCardPreviewStats({
  items,
  columns = 3,
}: {
  items: EntityCardPreviewStat[];
  /** 1 ou 2: linhas com ícone, nome e valor. 3: os chips compactos de ícone e número. */
  columns?: 1 | 2 | 3;
}) {
  const visibleItems = items.filter((item) => item.value != null && item.value !== "");
  if (!visibleItems.length) return null;

  if (columns === 1 || columns === 2) {
    return (
      <div className={cn("grid gap-x-4", columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {visibleItems.map((item, index) => {
          const iconSrc = item.icon ? resolveTokenIconSrc(item.icon) : undefined;
          return (
            <div
              key={`${item.label}-${index}`}
              title={item.label}
              className="flex min-w-0 items-center gap-1.5 border-b border-zinc-800/80 py-1.5"
            >
              {iconSrc ? (
                <img src={iconSrc} alt="" aria-hidden className="size-4 shrink-0 object-contain" />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">{item.label}</span>
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold tabular-nums",
                  item.valueClassName ?? "text-zinc-100",
                )}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {visibleItems.map((item, index) => {
        const iconSrc = item.icon ? resolveTokenIconSrc(item.icon) : undefined;
        return (
          <div
            key={`${item.label}-${index}`}
            title={item.label}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-zinc-800/90 bg-zinc-900/65 px-2.5 py-2"
          >
            {iconSrc ? (
              <img src={iconSrc} alt="" aria-hidden className="size-5 shrink-0 object-contain" />
            ) : (
              <span className="max-w-20 shrink-0 truncate text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                {item.label}
              </span>
            )}
            <span
              className={cn(
                "min-w-0 truncate text-xs font-semibold tabular-nums",
                item.valueClassName ?? "text-zinc-100",
              )}
            >
              {item.value}
            </span>
            <span className="sr-only">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function EntityCardPreviewText({
  lines,
  maxLines = 4,
}: {
  lines: string[];
  maxLines?: number;
}) {
  const visible = lines.filter(Boolean).slice(0, maxLines);
  if (!visible.length) return null;

  return (
    <div className="space-y-2 text-xs leading-relaxed text-zinc-300">
      {visible.map((line, index) => (
        <p key={index} className="line-clamp-3">
          <NotionText text={line} />
        </p>
      ))}
      {lines.length > visible.length ? (
        <p className="text-[10px] font-medium text-zinc-500">+{lines.length - visible.length}</p>
      ) : null}
    </div>
  );
}

export function EntityCardPreviewDescription({ text }: { text: string }) {
  return (
    <p className="line-clamp-6 text-xs leading-relaxed text-zinc-300">
      <NotionText text={text} />
    </p>
  );
}

export function EntityCardPreviewGodBonuses({ blocks }: { blocks: DeusExplicacaoBloco[] }) {
  const lines = blocks.flatMap((block) => {
    if (block.tipo === "lista") return block.itens;
    return [block.texto];
  });

  return <EntityCardPreviewText lines={lines} maxLines={6} />;
}
