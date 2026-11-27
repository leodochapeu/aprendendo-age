import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import {
  type AomRacePlayer,
  playerClanLogoUrl,
  playerClanPagePath,
  playerClanTag,
} from "@/lib/playersApi";

type PlayerClanLinkProps = {
  player: AomRacePlayer;
  size?: "sm" | "md";
  showTag?: boolean;
  className?: string;
  onNavigate?: () => void;
};

const LOGO_SIZE = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
} as const;

export function PlayerClanLink({
  player,
  size = "sm",
  showTag = false,
  className,
  onNavigate,
}: PlayerClanLinkProps) {
  const { t } = useTranslation();
  const tag = playerClanTag(player);
  const logoUrl = playerClanLogoUrl(player);
  const path = playerClanPagePath(player);

  if (!tag && !logoUrl) return null;

  const logoBox = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-zinc-600/70 bg-zinc-950 shadow-inner shadow-black/40",
        LOGO_SIZE[size],
      )}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-full object-cover" width={36} height={36} />
      ) : (
        <div className="flex size-full items-center justify-center bg-zinc-900 font-mono text-[9px] font-bold uppercase text-zinc-400">
          {tag?.slice(0, 3)}
        </div>
      )}
    </div>
  );

  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {logoBox}
      {showTag && tag ? (
        <span className="font-mono text-xs font-semibold text-sky-400/95">{tag}</span>
      ) : null}
    </span>
  );

  if (!path) return content;

  return (
    <Link
      to={path}
      title={t("pages.players.openClanPage", { tag: tag ?? "" })}
      onClick={onNavigate}
      className="inline-flex rounded-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      {content}
    </Link>
  );
}
