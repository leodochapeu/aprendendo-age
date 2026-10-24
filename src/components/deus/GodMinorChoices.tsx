import { TreeIconHover } from "@/components/deus/TreeIconHover";
import { TREE_ICON_FRAME } from "@/components/deus/treeIconFrames";
import { type GodChoiceFrame, type GodChoiceIcon, type GodMinorChoiceRow } from "@/lib/godMinorChoices";
import type { ListIndexLinkState } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

const FRAME: Record<GodChoiceFrame, string> = {
  portrait: TREE_ICON_FRAME.portrait,
  power: TREE_ICON_FRAME.power,
  tech: TREE_ICON_FRAME.tech,
  myth: TREE_ICON_FRAME.myth,
};

export function MinorAgeContent({
  row,
  linkState,
}: {
  row: GodMinorChoiceRow;
  linkState?: ListIndexLinkState;
}) {
  return (
    <div
      className="flex h-full flex-col justify-center"
      style={{
        gap: "calc(var(--tree-icon) * 0.16)",
        padding: "calc(var(--tree-icon) * 0.12) calc(var(--tree-icon) * 0.7) calc(var(--tree-icon) * 0.12) calc(var(--tree-icon) * 0.35)",
      }}
    >
      {row.icons ? (
        <div className="flex items-center" style={{ gap: "calc(var(--tree-icon) * 0.12)" }}>
          {row.icons.map((item) => (
            <ChoiceIcon key={item.key} item={item} linkState={linkState} />
          ))}
        </div>
      ) : null}
      {row.minors?.map((minor) => (
        <div key={minor.id} className="flex items-center" style={{ gap: "calc(var(--tree-icon) * 0.12)" }}>
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
      frameClass={FRAME[item.frame]}
      to={item.to}
      linkState={linkState}
      className={cn("flex shrink-0 items-center justify-center transition", FRAME[item.frame])}
      style={{
        width: item.frame === "portrait" ? "calc(var(--tree-icon) * 1.15)" : "var(--tree-icon)",
        height: item.frame === "portrait" ? "calc(var(--tree-icon) * 1.15)" : "var(--tree-icon)",
        padding: "calc(var(--tree-icon) * 0.05)",
      }}
    >
      <span className="flex size-full items-center justify-center bg-black">{body}</span>
    </TreeIconHover>
  );
}
