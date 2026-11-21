import type { ReactNode } from "react";

import { ParticleField } from "@/components/campeonato/ParticleField";
import { cn } from "@/lib/cn";

/** Fundo do modo batalha: mesmas partículas e vinheta da página de campeonato. */
export function BattleAtmosphere({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#07080c]" aria-hidden />
      <ParticleField />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.72)_78%)]"
        aria-hidden
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </>
  );
}

function BattleWind() {
  return (
    <div className="epic-wind" aria-hidden>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function BattleEpicFrame({
  children,
  className,
  bodyClassName,
  muted = false,
  glow = true,
  wash,
}: {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  muted?: boolean;
  glow?: boolean;
  wash?: "rose" | "emerald";
}) {
  return (
    <div className={cn("relative", className)}>
      {muted || !glow ? null : <div className="epic-gold-glow" aria-hidden />}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border shadow-lg shadow-black/40",
          muted ? "border-white/10" : "border-amber-200/25",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#3a2a12_0%,#120e09_58%,#07080c_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/75" />
        {wash === "rose" ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-600/28 via-transparent to-transparent" />
        ) : null}
        {wash === "emerald" ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/22 via-transparent to-transparent" />
        ) : null}
        {muted ? null : <BattleWind />}
        <div className={cn("relative z-[3]", bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}
