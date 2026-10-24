import { Fragment } from "react";
import { Link } from "react-router-dom";

import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
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
  className?: string;
  linkState?: ListIndexLinkState;
};

const FRAME: Record<GodChoiceFrame, string> = {
  portrait: "size-14 border-[#e7c98a]",
  power: "size-10 border-[#e6c35c]",
  tech: "size-10 border-[#c4a46a]",
  myth: "size-10 border-[#b15cff]",
};

export function GodMinorChoices({ god, className, linkState }: Props) {
  const { t } = useTranslation();
  const catalog = useCatalog();
  const rows = buildGodMinorChoices(god, catalog);
  if (!rows?.length) return null;

  return (
    <Section title={t("common.minorGods")} className={className}>
      <div className="overflow-x-auto rounded-xl bg-[#100e0c] bg-[radial-gradient(ellipse_at_top,rgba(90,68,32,0.16),transparent_58%)] py-2 pr-3">
        <div className="grid w-max min-w-full grid-cols-[4.75rem_minmax(0,1fr)]">
          {rows.map((row, index) => {
            const era = catalog.eraById.get(row.eraId);
            const icon = era ? getEraAssetUrl(era) : undefined;
            return (
              <Fragment key={row.eraId}>
                <div className="sticky left-0 z-20 flex items-center justify-center bg-black shadow-[8px_0_22px_rgba(0,0,0,0.92)]">
                  {icon ? (
                    <img
                      src={icon}
                      alt={era?.nome ?? ""}
                      title={era?.nome}
                      className="size-11 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
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
    </Section>
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
