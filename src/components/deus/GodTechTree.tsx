import { Link } from "react-router-dom";

import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import type { Deus } from "@/lib/godMajorTree";
import { buildGodTechTree, type GodTechTreeBuildingMark, type GodTechTreeItem } from "@/lib/godTechTree";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import type { ListIndexLinkState } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

type Props = {
  god: Deus;
  className?: string;
  linkState?: ListIndexLinkState;
};

export function GodTechTree({ god, className, linkState }: Props) {
  const { t } = useTranslation();
  const catalog = useCatalog();
  const rows = buildGodTechTree(god, catalog);
  if (!rows.length) return null;

  const ages = [1, 2, 3, 4].map((id) => catalog.eraById.get(id)).filter((era) => era != null);

  return (
    <Section title={t("common.techTree")} className={className}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed border-collapse">
          <thead>
            <tr>
              {ages.map((era) => {
                const icon = getEraAssetUrl(era);
                return (
                  <th
                    key={era.id}
                    scope="col"
                    className="border border-aom-border/80 bg-zinc-950/50 px-2 py-3 text-center"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {icon ? <img src={icon} alt="" className="size-8 object-contain" /> : null}
                      <span className="font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-wider text-amber-100/90">
                        {era.nome}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.buildingId} className="align-top">
                {row.cells.map((cell, index) => (
                  <td key={index} className="border border-aom-border/70 px-3 py-3">
                    {cell.building ? <BuildingMark building={cell.building} linkState={linkState} /> : null}
                    {cell.items.length ? (
                      <div className="flex flex-wrap gap-2">
                        {cell.items.map((item) => (
                          <TreeItem key={item.key} item={item} linkState={linkState} />
                        ))}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function BuildingMark({
  building,
  linkState,
}: {
  building: GodTechTreeBuildingMark;
  linkState?: ListIndexLinkState;
}) {
  const src = getIconFieldUrl(building.icon);
  const body = (
    <>
      {src ? <img src={src} alt="" className="size-11 shrink-0 object-contain" /> : null}
      <span className="font-[family-name:var(--font-display)] text-sm font-semibold leading-tight text-amber-50 group-hover:text-amber-200">
        {building.nome}
      </span>
    </>
  );
  const className = "group mb-3 flex items-center gap-2";
  if (!building.to) return <div className={className}>{body}</div>;
  return (
    <Link to={building.to} state={linkState} className={className}>
      {body}
    </Link>
  );
}

function TreeItem({ item, linkState }: { item: GodTechTreeItem; linkState?: ListIndexLinkState }) {
  const src = getIconFieldUrl(item.icon);
  const body = (
    <>
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-md border border-aom-border bg-zinc-950/80 p-0.5",
          item.to && "transition group-hover:border-amber-400/70",
        )}
      >
        {src ? (
          <img src={src} alt="" className="size-full object-contain" />
        ) : (
          <span className="px-1 text-center text-[10px] font-semibold text-zinc-500">{item.nome.slice(0, 3)}</span>
        )}
      </span>
      <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-zinc-400 group-hover:text-amber-100">
        {item.nome}
      </span>
    </>
  );
  const className = "group flex w-16 flex-col items-center gap-1";
  if (!item.to) {
    return (
      <div className={className} title={item.nome}>
        {body}
      </div>
    );
  }
  return (
    <Link to={item.to} state={linkState} title={item.nome} className={className}>
      {body}
    </Link>
  );
}
