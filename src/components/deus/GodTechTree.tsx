import { Fragment } from "react";

import { MinorAgeContent } from "@/components/deus/GodMinorChoices";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { buildGodMinorChoices } from "@/lib/godMinorChoices";
import type { Deus } from "@/lib/godMajorTree";
import {
  buildGodTechTree,
  splitTechLines,
  type GodTechTreeFrame,
  type GodTechTreeItem,
  type GodTechTreeLine,
  type GodTechTreeRow,
} from "@/lib/godTechTree";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { TreeIconHover } from "@/components/deus/TreeIconHover";
import { TREE_ICON_FRAME } from "@/components/deus/treeIconFrames";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import type { TreeIconPreview } from "@/lib/treeIconPreview";
import type { ListIndexLinkState } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

type Props = {
  god: Deus;
  className?: string;
  linkState?: ListIndexLinkState;
};

const LINE = "bg-[#d4b06a]";
const AGE_SHADE = "bg-black/75 shadow-[8px_0_18px_rgba(0,0,0,0.45)]";
const TREE_ICON_SIZE = "clamp(2.75rem, 8.5cqh, 8rem)";
const iconBox = { width: "var(--tree-icon)", height: "var(--tree-icon)", padding: "calc(var(--tree-icon) * 0.05)" };

const FRAME: Record<GodTechTreeFrame | "building", string> = {
  building: TREE_ICON_FRAME.building,
  tech: TREE_ICON_FRAME.tech,
  unit: TREE_ICON_FRAME.unit,
  hero: TREE_ICON_FRAME.hero,
  myth: TREE_ICON_FRAME.myth,
  ship: TREE_ICON_FRAME.ship,
};

export function GodTechTree({ god, className, linkState }: Props) {
  const { t } = useTranslation();
  const catalog = useCatalog();
  const rows = buildGodTechTree(god, catalog);
  const choices = god.hierarquia === "Maior" ? buildGodMinorChoices(god, catalog) : null;
  if (!rows.length && !choices?.length) return null;

  const ages = [1, 2, 3, 4].map((id) => catalog.eraById.get(id)).filter((era) => era != null);
  const choiceByEra = new Map((choices ?? []).map((row) => [row.eraId, row]));
  const columns = rows.map((row) => {
    const { loose, lines } = splitTechLines(row.cells);
    const buildingAge = Math.max(0, row.cells.findIndex((cell) => cell.building));
    return {
      row,
      loose,
      lines,
      buildingAge,
      building: row.cells[buildingAge]?.building,
      lastContent: lastContentAge(loose, lines, buildingAge),
    };
  });
  const minorColumn = choiceByEra.size > 0;
  const buildingColumn = (index: number) => (minorColumn ? index + 3 : index + 2);

  return (
    <Section title={t("common.techTree")} className={cn(className, "min-h-[100dvh]")}>
      <div
        className="overflow-x-auto rounded-xl bg-[#100e0c] bg-[radial-gradient(ellipse_at_top,rgba(90,68,32,0.16),transparent_58%)]"
        style={{ height: "calc(100dvh - 6rem)", containerType: "size" }}
      >
        <div
          className="grid h-full w-max min-w-full"
          style={{
            ["--tree-icon" as string]: TREE_ICON_SIZE,
            gridTemplateRows: "repeat(4, minmax(0, 1fr))",
            gridTemplateColumns: minorColumn
              ? "calc(var(--tree-icon) * 2) max-content repeat(" + columns.length + ", max-content)"
              : "calc(var(--tree-icon) * 2) repeat(" + columns.length + ", max-content)",
          }}
        >
          {ages.map((era, age) => {
            const choice = choiceByEra.get(era.id);
            const icon = getEraAssetUrl(era);
            return (
              <Fragment key={era.id}>
                <div
                  key={`age-${era.id}`}
                  className={cn("sticky left-0 z-20 flex items-center justify-center", AGE_SHADE)}
                  style={{ gridColumn: 1, gridRow: age + 1 }}
                >
                  {icon ? (
                    <img
                      src={icon}
                      alt={era.nome}
                      title={era.nome}
                      className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
                      style={{ width: "calc(var(--tree-icon) * 1.2)", height: "calc(var(--tree-icon) * 1.2)" }}
                    />
                  ) : null}
                </div>
                {minorColumn ? (
                  <div key={`minor-${era.id}`} className="flex items-center" style={{ gridColumn: 2, gridRow: age + 1 }}>
                    {choice ? <MinorAgeContent row={choice} linkState={linkState} /> : null}
                  </div>
                ) : null}
                {columns.map((column, index) => (
                  <BuildingAgeCell
                    key={`${column.row.buildingId}-${age}`}
                    column={column}
                    age={age}
                    linkState={linkState}
                    style={{ gridColumn: buildingColumn(index), gridRow: age + 1 }}
                  />
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

type BuildingColumnModel = {
  row: GodTechTreeRow;
  loose: GodTechTreeItem[][];
  lines: GodTechTreeLine[];
  buildingAge: number;
  building?: { nome: string; icon?: string; to?: string; preview?: TreeIconPreview };
  lastContent: number;
};

function BuildingAgeCell({
  column,
  age,
  linkState,
  style,
}: {
  column: BuildingColumnModel;
  age: number;
  linkState?: ListIndexLinkState;
  style: { gridColumn: number; gridRow: number };
}) {
  const { loose, lines, building, buildingAge, lastContent } = column;
  const branch = loose[age] ?? [];
  const hasIcons = branch.length > 0 || lines.some((line) => line.slots[age]);
  const spine = spineClass(age, buildingAge, lastContent);
  const firstFilledLine = lines.findIndex((line) => line.slots[age]);
  const leadSlots = firstFilledLine >= 0 ? firstFilledLine : branch.length > 0 ? lines.length : 0;

  return (
    <div
      className="relative flex h-full items-center"
      style={{
        ...style,
        paddingLeft: "calc(var(--tree-icon) * 1.7)",
        paddingRight: "calc(var(--tree-icon) * 0.85)",
      }}
    >
      {spine ? (
        <span className={cn("pointer-events-none absolute z-0 w-px", LINE, spine)} style={{ left: "calc(var(--tree-icon) / 2)" }} />
      ) : null}
      {building && buildingAge === age ? (
        <div className="absolute top-1/2 left-0 z-10 -translate-y-1/2">
          <TreeIcon item={building} frame="building" linkState={linkState} />
        </div>
      ) : null}
      {hasIcons ? (
        <span
          className={cn("absolute top-1/2 z-0 h-px -translate-y-1/2", LINE)}
          style={{ left: "calc(var(--tree-icon) / 2)", width: `calc(var(--tree-icon) * ${1.2 + leadSlots * 1.1})` }}
        />
      ) : null}
      <div className="flex h-full items-center" style={{ gap: "calc(var(--tree-icon) * 0.1)" }}>
        {lines.map((line) => (
          <LineSlot key={line.id} line={line} age={age} linkState={linkState} />
        ))}
        {branch.map((item) => (
          <TreeIcon key={item.key} item={item} frame={item.frame} linkState={linkState} />
        ))}
      </div>
    </div>
  );
}

function spineClass(age: number, buildingAge: number, lastContent: number): string {
  if (lastContent <= buildingAge) return "";
  if (age === buildingAge) return "top-1/2 bottom-0";
  if (age === lastContent) return "top-0 h-1/2";
  if (age > buildingAge && age < lastContent) return "inset-y-0";
  return "";
}

function LineSlot({
  line,
  age,
  linkState,
}: {
  line: GodTechTreeLine;
  age: number;
  linkState?: ListIndexLinkState;
}) {
  const item = line.slots[age];
  const first = line.slots.findIndex((slot) => slot != null);
  const last = lastFilled(line.slots);
  let lineClass = "";
  if (first >= 0 && last > first) {
    if (age === first) lineClass = "top-1/2 bottom-0";
    else if (age === last) lineClass = "top-0 h-1/2";
    else if (age > first && age < last) lineClass = "inset-y-0";
  }

  return (
    <div className="relative shrink-0 self-stretch" style={{ width: "var(--tree-icon)" }}>
      {lineClass ? <span className={cn("absolute left-1/2 z-0 w-px -translate-x-1/2", LINE, lineClass)} /> : null}
      {item ? (
        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <TreeIcon item={item} frame={item.frame} linkState={linkState} />
        </div>
      ) : null}
    </div>
  );
}

function TreeIcon({
  item,
  frame,
  linkState,
}: {
  item: { nome: string; icon?: string; to?: string; preview?: TreeIconPreview };
  frame: GodTechTreeFrame | "building";
  linkState?: ListIndexLinkState;
}) {
  const src = getIconFieldUrl(item.icon);
  const body = src ? (
    <img src={src} alt="" className="size-full object-contain" />
  ) : (
    <span className="px-0.5 text-center text-[9px] font-semibold text-zinc-400">{item.nome.slice(0, 2)}</span>
  );
  return (
    <TreeIconHover
      nome={item.nome}
      src={src}
      preview={item.preview}
      frameClass={FRAME[frame]}
      to={item.to}
      linkState={linkState}
      className={cn("relative z-10 flex items-center justify-center transition", FRAME[frame])}
      style={iconBox}
    >
      <span className="flex size-full items-center justify-center bg-black">{body}</span>
    </TreeIconHover>
  );
}

function lastFilled(slots: (GodTechTreeItem | null)[]): number {
  for (let age = slots.length - 1; age >= 0; age -= 1) {
    if (slots[age]) return age;
  }
  return -1;
}

function lastContentAge(loose: GodTechTreeItem[][], lines: GodTechTreeLine[], buildingAge: number): number {
  let last = buildingAge;
  loose.forEach((items, age) => {
    if (items.length) last = Math.max(last, age);
  });
  for (const line of lines) last = Math.max(last, lastFilled(line.slots));
  return last;
}
