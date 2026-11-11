import type { SyntheticEvent } from "react";

import { cn } from "@/lib/cn";
import { rankAvatarDiscBackground, type RankTierId } from "@/lib/rankClassification";
import {
  DEFAULT_PLAYER_AVATAR_DISC,
  isDefaultPlayerAvatarSrc,
  resolvePlayerAvatarSrc,
} from "@/lib/steamAvatarUrl";

/** Retrato do jogador. Vazio ou a interrogação da Steam viram o ícone padrão, com o disco do rank atrás. */
export function PlayerAvatarMark({
  src,
  tierId,
  className,
  width,
  height,
  onError,
}: {
  src: string | null | undefined;
  tierId?: RankTierId | null;
  className?: string;
  width?: number;
  height?: number;
  onError?: () => void;
}) {
  const resolved = resolvePlayerAvatarSrc(src);
  const placeholder = isDefaultPlayerAvatarSrc(resolved);

  return (
    <img
      src={resolved}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      className={cn("h-full w-full object-cover", className)}
      onError={onError ? (_event: SyntheticEvent<HTMLImageElement>) => onError() : undefined}
      style={
        placeholder
          ? { backgroundImage: tierId ? rankAvatarDiscBackground(tierId) : DEFAULT_PLAYER_AVATAR_DISC }
          : undefined
      }
    />
  );
}
