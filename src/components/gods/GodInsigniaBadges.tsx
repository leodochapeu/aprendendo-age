import { useState } from "react";

import { cn } from "@/lib/cn";

export type GodInsigniaKind = "mostPlayed" | "favorite" | "undefeated" | "highlight";

export const CLAN_INSIGNIA_ORDER: GodInsigniaKind[] = ["mostPlayed", "favorite", "undefeated", "highlight"];
export const PLAYER_INSIGNIA_ORDER: GodInsigniaKind[] = ["mostPlayed", "undefeated", "highlight"];

const INSIGNIA_STYLE: Record<
  GodInsigniaKind,
  { ring: string; glow: string; icon: string; medal: string }
> = {
  mostPlayed: {
    ring: "ring-amber-400/55",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.35)]",
    icon: "text-amber-200",
    medal: "from-amber-950/90 via-amber-900/40 to-zinc-950/95 border-amber-500/45",
  },
  favorite: {
    ring: "ring-rose-400/55",
    glow: "shadow-[0_0_12px_rgba(251,113,133,0.35)]",
    icon: "text-rose-200",
    medal: "from-rose-950/90 via-rose-900/35 to-zinc-950/95 border-rose-500/45",
  },
  undefeated: {
    ring: "ring-orange-400/55",
    glow: "shadow-[0_0_12px_rgba(251,146,60,0.38)]",
    icon: "text-orange-200",
    medal: "from-orange-950/90 via-orange-900/35 to-zinc-950/95 border-orange-500/45",
  },
  highlight: {
    ring: "ring-sky-400/55",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.35)]",
    icon: "text-sky-200",
    medal: "from-sky-950/90 via-sky-900/35 to-zinc-950/95 border-sky-500/45",
  },
};

function InsigniaStarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5l2.35 4.76 5.25.77-3.8 3.7.9 5.24L12 14.9l-4.7 2.47.9-5.24-3.8-3.7 5.25-.77L12 2.5z" />
    </svg>
  );
}

function InsigniaHeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.7-9.9-9.1C-.1 8.2 1.6 4.6 5.1 3.4c2.1-.7 4.3.1 5.7 1.8 1.4-1.7 3.6-2.5 5.7-1.8 3.5 1.2 5.2 4.8 3 8.5C19.5 16.3 12 21 12 21z" />
    </svg>
  );
}

function InsigniaFireIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2c1.2 3.1-.4 5.2-1.6 7.2-.9 1.5-1.7 2.9-1.4 4.8.4 2.5 2.4 4.5 5 4.5 3.3 0 6-2.7 6-6.1 0-4.8-3.5-8.8-8-12.4zM8.5 20.5c-2.8-1.6-3.5-4.8-1.8-7.4.6-.9 1.2-1.7 1.8-2.6.3 2.1 1.4 3.8 2.8 5.5-1.1.9-2 2-2.8 3.2-.5.8-.2 1.9.7 1.3z" />
    </svg>
  );
}

function InsigniaMuscleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 18.34S4 7.09 7 3l5 1-1 3.09H9v7.16h1c2-3.07 6.14-4.19 8.64-3.07 3.3 1.53 3 6.14 0 8.18C16.24 21 9 22.43 3 18.34z" />
    </svg>
  );
}

function InsigniaIcon({ id, className }: { id: GodInsigniaKind; className?: string }) {
  switch (id) {
    case "mostPlayed":
      return <InsigniaStarIcon className={className} />;
    case "favorite":
      return <InsigniaHeartIcon className={className} />;
    case "undefeated":
      return <InsigniaFireIcon className={className} />;
    case "highlight":
      return <InsigniaMuscleIcon className={className} />;
  }
}

function GodInsigniaBadge({
  id,
  label,
  hint,
}: {
  id: GodInsigniaKind;
  label: string;
  hint: string;
}) {
  const [open, setOpen] = useState(false);
  const style = INSIGNIA_STYLE[id];

  return (
    <div className="group/insignia relative">
      <button
        type="button"
        aria-label={`${label}: ${hint}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border bg-gradient-to-br shadow-inner ring-2 ring-inset transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
          style.medal,
          style.ring,
          style.glow,
        )}
      >
        <InsigniaIcon id={id} className={cn("h-4 w-4 drop-shadow-sm", style.icon)} />
      </button>

      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-left shadow-xl shadow-black/50 backdrop-blur-sm",
          "opacity-0 transition duration-150",
          "group-hover/insignia:opacity-100 group-focus-within/insignia:opacity-100",
          open && "opacity-100",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-100/95">{label}</p>
        <p className="mt-1 text-[10px] leading-snug text-zinc-400">{hint}</p>
      </div>
    </div>
  );
}

export function GodInsignias({
  insignias,
  order,
  labelKey,
  hintKey,
  t,
}: {
  insignias: GodInsigniaKind[];
  order: readonly GodInsigniaKind[];
  labelKey: (id: GodInsigniaKind) => string;
  hintKey: (id: GodInsigniaKind) => string;
  t: (key: string) => string;
}) {
  if (insignias.length === 0) return null;

  const ordered = order.filter((id) => insignias.includes(id));

  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5 sm:right-3 sm:top-3">
      {ordered.map((id) => (
        <GodInsigniaBadge key={id} id={id} label={t(labelKey(id))} hint={t(hintKey(id))} />
      ))}
    </div>
  );
}
