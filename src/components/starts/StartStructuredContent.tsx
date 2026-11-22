import { useMemo } from "react";

import { StartMiniMarkup } from "@/lib/startMiniMarkup";
import type { StartBuildSegment, StartFooterBlock, StartLeadBlock, StartTableRow } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/hooks/useTranslation";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { getTokenLabel } from "@/lib/notionTokenLabels";
import { isHousedPopulation } from "@/lib/startPopulation";
import { resourceDeltasForRows, type ResourceDelta } from "@/lib/startResourceDelta";

function ResourceColumnHeader({
  label,
  token,
  labelClassName,
}: {
  label: string;
  token: string;
  labelClassName?: string;
}) {
  const src = getTokenAssetUrl(token);
  return (
    <span className="inline-flex items-center justify-center gap-0 sm:gap-1">
      <span className={cn(labelClassName, src && "sr-only sm:not-sr-only")}>{label}</span>
      {src ? (
        <img
          src={src}
          alt=""
          title={getTokenLabel(token)}
          className="notion-token-inline mx-0 inline-block h-[1em] max-h-[1.1em] w-auto shrink-0 align-[-0.12em] object-contain"
        />
      ) : null}
    </span>
  );
}

function rowTypeClass(type: string | null): string | undefined {
  if (!type) return undefined;
  const map: Record<string, string> = {
    hint: "start-row-hint",
    blue: "start-row-blue",
    pink: "start-row-pink",
    teal: "start-row-teal",
    orange: "start-row-orange",
    red: "start-row-red",
    gray: "start-row-hint",
  };
  return map[type];
}

function deltaClass(delta: ResourceDelta | null | undefined): string | undefined {
  if (delta === "up") return "start-res-up";
  if (delta === "down") return "start-res-down";
  return undefined;
}

function StartTable({ rows, highlightResourceChanges }: { rows: StartTableRow[]; highlightResourceChanges: boolean }) {
  const { t } = useTranslation();
  const showFavor = rows.some((r) => r.favor != null && r.favor !== "");
  const deltas = useMemo(
    () => (highlightResourceChanges ? resourceDeltasForRows(rows) : null),
    [highlightResourceChanges, rows],
  );

  const deltaTitle = (delta: ResourceDelta | null | undefined) => {
    if (delta === "up") return t("pages.starts.resourceAdded");
    if (delta === "down") return t("pages.starts.resourceRemoved");
    return undefined;
  };

  return (
    <div className="start-table-wrap mt-4 overflow-x-auto">
      <table className="start-structured-table simple-table w-full table-fixed border-collapse text-[0.8125rem]">
        <thead>
          <tr>
            <th className="start-col-desc">Descrição</th>
            <th className="start-col-res">
              <ResourceColumnHeader label="Comida" token="foodaom" labelClassName="highlight-red" />
            </th>
            <th className="start-col-res">
              <ResourceColumnHeader label="Madeira" token="woodaom" labelClassName="highlight-brown" />
            </th>
            <th className="start-col-res">
              <ResourceColumnHeader label="Ouro" token="goldaom" labelClassName="highlight-yellow" />
            </th>
            {showFavor ? (
              <th className="start-col-res">
                <ResourceColumnHeader label="Favor" token="favoraom" labelClassName="text-blue-400" />
              </th>
            ) : null}
            <th className="start-col-pop">
              <ResourceColumnHeader label="População" token="aomr_population_provision_icon" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={rowTypeClass(r.type ?? null)}>
              <td className="start-col-desc">
                <StartMiniMarkup text={r.description} expandResources />
              </td>
              <td className={cn("start-col-res", deltaClass(deltas?.[i].food))} title={deltaTitle(deltas?.[i].food)}>
                {r.food != null && r.food !== "" ? <StartMiniMarkup text={r.food} expandResources /> : null}
              </td>
              <td className={cn("start-col-res", deltaClass(deltas?.[i].wood))} title={deltaTitle(deltas?.[i].wood)}>
                {r.wood != null && r.wood !== "" ? <StartMiniMarkup text={r.wood} expandResources /> : null}
              </td>
              <td className={cn("start-col-res", deltaClass(deltas?.[i].gold))} title={deltaTitle(deltas?.[i].gold)}>
                {r.gold != null && r.gold !== "" ? <StartMiniMarkup text={r.gold} expandResources /> : null}
              </td>
              {showFavor ? (
                <td className="start-col-res">
                  {r.favor != null && r.favor !== "" ? <StartMiniMarkup text={r.favor} expandResources /> : null}
                </td>
              ) : null}
              <td
                className={cn("start-col-pop", isHousedPopulation(r.pop) && "start-pop-housed")}
                title={isHousedPopulation(r.pop) ? t("pages.starts.housed") : undefined}
              >
                {r.pop != null && r.pop !== "" ? <StartMiniMarkup text={r.pop} expandResources /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalloutBlock({ children }: { children: React.ReactNode }) {
  return (
    <figure className="callout block-color-gray_background mt-4 flex gap-3 rounded-xl border border-aom-border p-4 first:mt-0">
      <div className="text-xl leading-none text-zinc-500" aria-hidden>
        ●
      </div>
      <div className="min-w-0 flex-1 whitespace-pre-line text-sm leading-relaxed text-zinc-200">{children}</div>
    </figure>
  );
}

function LeadBlocks({ blocks }: { blocks: StartLeadBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "callout") {
          return (
            <CalloutBlock key={i}>
              <StartMiniMarkup text={b.text} expandResources />
            </CalloutBlock>
          );
        }
        const Tag = b.level <= 2 ? "h2" : "h3";
        return (
          <Tag
            key={i}
            className="mt-6 whitespace-pre-line font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100/95 first:mt-0"
          >
            <StartMiniMarkup text={b.text} expandResources />
          </Tag>
        );
      })}
    </>
  );
}

function FooterBlocks({ blocks }: { blocks: StartFooterBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "paragraph") {
          return (
            <p key={i} className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
              <StartMiniMarkup text={b.text} expandResources />
            </p>
          );
        }
        if (b.kind === "callout") {
          return (
            <CalloutBlock key={i}>
              <StartMiniMarkup text={b.text} expandResources />
            </CalloutBlock>
          );
        }
        const Tag = b.level <= 2 ? "h2" : "h3";
        return (
          <Tag
            key={i}
            className="mt-6 whitespace-pre-line font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100/95"
          >
            <StartMiniMarkup text={b.text} expandResources />
          </Tag>
        );
      })}
    </>
  );
}

export function StartStructuredContent({
  segments,
  highlightResourceChanges = true,
}: {
  segments: StartBuildSegment[];
  /** Pinta comida, madeira e ouro quando a quantidade muda em relação à distribuição anterior. */
  highlightResourceChanges?: boolean;
}) {
  return (
    <div className="start-notion-content start-structured mt-8">
      {segments.map((seg, si) => (
        <section key={si} className={si > 0 ? "mt-10 border-t border-aom-border/60 pt-10" : undefined}>
          {seg.lead?.length ? <LeadBlocks blocks={seg.lead} /> : null}
          {seg.table?.length ? (
            <StartTable rows={seg.table} highlightResourceChanges={highlightResourceChanges} />
          ) : null}
          {seg.footer?.length ? <FooterBlocks blocks={seg.footer} /> : null}
        </section>
      ))}
    </div>
  );
}
