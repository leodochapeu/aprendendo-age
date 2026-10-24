import { Fragment } from "react";
import { Link } from "react-router-dom";

import { useCatalog } from "@/hooks/useCatalog";
import {
  buildGodMinorChoices,
  type GodChoiceFrame,
  type GodChoiceIcon,
} from "@/lib/godMinorChoices";
import type { Deus } from "@/lib/godMajorTree";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import type { ListIndexLinkState } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

type Props = {
  god: Deus;
  linkState?: ListIndexLinkState;
};

const AGE_SHADE = "bg-black/75 shadow-[8px_0_22px_rgba(0,0,0,0.55)]";

const FRAME: Record<GodChoiceFrame, string> = {
  portrait: "size-14 border-[#e7c98a]",
  power: "size-10 border-[#e6c35c]",
  tech: "size-10 border-[#c4a46a]",
  myth: "size-10 border-[#b15cff]",
};

export function GodMinorChoices({ god, linkState }: Props) {
  const catalog = useCatalog();
  const rows = buildGodMinorChoices(god, catalog);
  if (!rows?.length) return null;

  return (
    <div className="overflow-x-auto border-b border-[#d4b06a]/30 py-2 pr-3">
      <div className="grid w-max min-w-full grid-cols-[4.75rem_minmax(0,1fr)]">
        {rows.map((row, index) => {
          const era = catalog.eraById.get(row.eraId);
          const icon = era ? getEraAssetUrl(era) : undefined;
          return (
            <Fragment key={row.eraId}>
              <div className={cn("sticky left-0 z-20 flex items-center justify-center", AGE_SHADE)}>
                {icon ? (
                  <img
                    src={icon}
                    alt={era?.nome ?? ""}
                    title={era?.nome}
                    className="size-11 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
                  />
                ) : null}
              </div>
              <div
                className={cn(
                  "flex flex-col justify-center gap-2 px-3 py-2.5",
                  index < rows.length - 1 && "border-b border-[#d4b06a]/30",
                )}
              >
                {row.icons ? (
                  <div className="flex items-center gap-1.5">
                    {row.icons.map((item) => (
                      <ChoiceIcon key={item.key} item={item} linkState={linkState} />
                    ))}
                  </div>
                ) : null}
                {row.minors?.map((minor) => (
                  <div key={minor.id} className="flex items-center gap-1.5">
                    <ChoiceIcon item={minor.portrait} linkState={linkState} />
                    {minor.icons.map((item) => (
                      <ChoiceIcon key={item.key} item={item} linkState={linkState} />
                    ))}
                  </div>
                ))}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceIcon({ item, linkState }: { item: GodChoiceIcon; linkState?: ListIndexLinkState }) {
  const body = item.src ? (
    <img src={item.src} alt="" className="size-full object-contain" />
  ) : (
    <span className="px-0.5 text-center text-[9px] font-semibold text-zinc-400">{item.nome.slice(0, 2)}</span>
  );
  const className = cn(
    "flex shrink-0 items-center justify-center border bg-black p-0.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.65)]",
    FRAME[item.frame],
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
