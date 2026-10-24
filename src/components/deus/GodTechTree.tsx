import { Link } from "react-router-dom";

import { GodMinorChoices } from "@/components/deus/GodMinorChoices";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
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
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import type { ListIndexLinkState } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

type Props = {
  god: Deus;
  className?: string;
  linkState?: ListIndexLinkState;
};

const BAND = "h-[4.5rem]";
const LINE = "bg-[#d4b06a]";

const FRAME: Record<GodTechTreeFrame | "building", string> = {
  building: "border-[#e7c98a]",
  tech: "border-[#c4a46a]",
  unit: "border-[#c4a46a]",
  hero: "border-[#e6c35c]",
  myth: "border-[#b15cff]",
  ship: "border-[#4c8fd4]",
};

export function GodTechTree({ god, className, linkState }: Props) {
  const { t } = useTranslation();
  const catalog = useCatalog();
  const rows = buildGodTechTree(god, catalog);
  if (!rows.length && god.hierarquia !== "Maior") return null;

  const ages = [1, 2, 3, 4].map((id) => catalog.eraById.get(id)).filter((era) => era != null);

  return (
    <Section title={t("common.techTree")} className={className}>
      <div className="overflow-hidden rounded-xl bg-[#100e0c] bg-[radial-gradient(ellipse_at_top,rgba(90,68,32,0.16),transparent_58%)]">
        {god.hierarquia === "Maior" ? <GodMinorChoices god={god} linkState={linkState} /> : null}
        {rows.length ? (
          <div className="overflow-x-auto px-2 py-3">
            <div className="flex w-max items-start">
              <div className="sticky left-0 z-20 flex w-[4.75rem] shrink-0 flex-col px-1.5">
                <div className="h-12" />
                <div className="flex flex-col rounded-md bg-black/75 shadow-[0_10px_28px_rgba(0,0,0,0.55)]">
                  {ages.map((era) => {
                    const icon = getEraAssetUrl(era);
                    return (
                      <div key={era.id} className={cn(BAND, "flex items-center justify-center")}>
                        {icon ? (
                          <img
                            src={icon}
                            alt={era.nome}
                            title={era.nome}
                            className="size-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              {rows.map((row) => (
                <BuildingColumn key={row.buildingId} row={row} linkState={linkState} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function BuildingColumn({ row, linkState }: { row: GodTechTreeRow; linkState?: ListIndexLinkState }) {
  const { loose, lines } = splitTechLines(row.cells);
  const buildingAge = Math.max(0, row.cells.findIndex((cell) => cell.building));
  const building = row.cells[buildingAge]?.building;
  const lastContent = lastContentAge(loose, lines, buildingAge);

  return (
    <div className="flex shrink-0 flex-col pr-4">
      <div className="flex h-12 w-10 items-end justify-center">
        {building && buildingAge === 0 ? <TreeIcon item={building} frame="building" linkState={linkState} /> : null}
      </div>
      <div className="relative">
        {lastContent > buildingAge ? (
          <span
            className={cn("pointer-events-none absolute w-px", LINE)}
            style={{
              left: 20,
              top: buildingAge === 0 ? 0 : `calc(${buildingAge} * 4.5rem + 2.25rem)`,
              height: `calc(${lastContent - buildingAge} * 4.5rem${buildingAge === 0 ? " + 2.25rem" : ""})`,
            }}
          />
        ) : null}
        {row.cells.map((_, age) => {
          const branch = loose[age] ?? [];
          const hasIcons = branch.length > 0 || lines.some((line) => line.slots[age]);
          return (
            <div key={age} className={cn(BAND, "relative flex items-center pl-10")}>
              {building && buildingAge === age && age !== 0 ? (
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <TreeIcon item={building} frame="building" linkState={linkState} />
                </div>
              ) : null}
              {hasIcons ? (
                <span className={cn("absolute top-1/2 left-5 h-px w-5 -translate-y-1/2", LINE)} />
              ) : null}
              <div className="flex h-full items-center gap-1">
                {lines.map((line) => (
                  <LineSlot key={line.id} line={line} age={age} linkState={linkState} />
                ))}
                {branch.map((item) => (
                  <TreeIcon key={item.key} item={item} frame={item.frame} linkState={linkState} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
    <div className="relative flex h-full w-10 shrink-0 items-center justify-center">
      {lineClass ? <span className={cn("absolute left-1/2 w-px -translate-x-1/2", LINE, lineClass)} /> : null}
      {item ? <TreeIcon item={item} frame={item.frame} linkState={linkState} /> : null}
    </div>
  );
}

function TreeIcon({
  item,
  frame,
  linkState,
}: {
  item: { nome: string; icon?: string; to?: string };
  frame: GodTechTreeFrame | "building";
  linkState?: ListIndexLinkState;
}) {
  const src = getIconFieldUrl(item.icon);
  const body = src ? (
    <img src={src} alt="" className="size-full object-contain" />
  ) : (
    <span className="px-0.5 text-center text-[9px] font-semibold text-zinc-400">{item.nome.slice(0, 2)}</span>
  );
  const className = cn(
    "relative z-[1] flex size-10 items-center justify-center border bg-black p-0.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.65)]",
    FRAME[frame],
    item.to && "transition hover:brightness-125 hover:outline hover:outline-1 hover:outline-[#f0d48a]",
  );
  if (!item.to) {
    return (
      <div className={className} title={item.nome} aria-label={item.nome}>
        {body}
      </div>
    );
  }
  return (
    <Link to={item.to} state={linkState} title={item.nome} aria-label={item.nome} className={className}>
      {body}
    </Link>
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
