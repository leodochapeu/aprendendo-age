import { TreeIconHover } from "@/components/deus/TreeIconHover";
import { type GodChoiceFrame, type GodChoiceIcon, type GodMinorChoiceRow } from "@/lib/godMinorChoices";
import type { ListIndexLinkState } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

const FRAME: Record<GodChoiceFrame, string> = {
  portrait: "size-14 border-[#e7c98a]",
  power: "size-10 border-[#e6c35c]",
  tech: "size-10 border-[#c4a46a]",
  myth: "size-10 border-[#b15cff]",
};

export function MinorAgeContent({
  row,
  linkState,
}: {
  row: GodMinorChoiceRow;
  linkState?: ListIndexLinkState;
}) {
  return (
    <div className="flex flex-col justify-center gap-2 px-3 py-2 pr-8">
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
  );
}

function ChoiceIcon({ item, linkState }: { item: GodChoiceIcon; linkState?: ListIndexLinkState }) {
  const body = item.src ? (
    <img src={item.src} alt="" className="size-full object-contain" />
  ) : (
    <span className="px-0.5 text-center text-[9px] font-semibold text-zinc-400">{item.nome.slice(0, 2)}</span>
  );
  return (
    <TreeIconHover
      nome={item.nome}
      src={item.src}
      preview={item.preview}
      to={item.to}
      linkState={linkState}
      className={cn(
        "flex shrink-0 items-center justify-center border bg-black p-0.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.65)] transition",
        FRAME[item.frame],
      )}
    >
      {body}
    </TreeIconHover>
  );
}
