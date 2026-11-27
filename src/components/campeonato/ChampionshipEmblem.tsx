import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

export function ChampionshipEmblem({
  src,
  burst = 1.75,
  className,
  style,
}: {
  src: string;
  burst?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-visible", className)} style={style}>
      <div
        className="relative h-full w-full overflow-visible border border-amber-300/50 bg-black/55"
        style={{
          borderRadius: "calc(var(--emblem-radius, 1.7) * 1rem)",
          boxShadow: "0 0 calc(var(--emblem-glow, 70) * 1px) rgba(251,191,36,0.22)",
        }}
      >
        <img
          src={src}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{
            width: `calc(var(--emblem-burst, ${burst}) * 100%)`,
            height: `calc(var(--emblem-burst, ${burst}) * 100%)`,
          }}
        />
      </div>
    </div>
  );
}
