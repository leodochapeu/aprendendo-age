import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { compareNumericTones, toneToTextClass } from "@/lib/numericCompare";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";

type InfoRowProps = {
  label: string;
  children: ReactNode;
  /** Chave em `token_asset_map.json` (ex.: `foodaom`) ou caminho `/assets/...`. Aceita vários. */
  icon?: string | string[];
  /** Controle ao lado do rótulo, fora do texto em maiúsculas (ex.: botão de informação). */
  labelAddon?: ReactNode;
};

export function InfoRow({ label, children, icon, labelAddon }: InfoRowProps) {
  const icons = (Array.isArray(icon) ? icon : icon ? [icon] : [])
    .map((key) => resolveTokenIconSrc(key))
    .filter((src): src is string => Boolean(src));

  return (
    <div className="grid gap-1 border-b border-zinc-800/80 py-3 last:border-0 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start sm:gap-6">
      <div className="flex min-w-0 items-center gap-2">
        {icons.length ? (
          <span className="flex shrink-0 items-center gap-1">
            {icons.map((src) => (
              <img key={src} src={src} alt="" aria-hidden className="size-5 shrink-0 object-contain opacity-90" />
            ))}
          </span>
        ) : null}
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        {labelAddon}
      </div>
      <div className="min-w-0 text-sm text-zinc-200">{children}</div>
    </div>
  );
}

type CompareInfoRowProps = {
  label: string;
  left: ReactNode;
  right: ReactNode;
  icon?: string;
  /** Quando ambos os lados são números válidos, aplica verde/vermelho/amarelo conforme a comparação. */
  numericPair?: { left: number | null; right: number | null; lowerIsBetter?: boolean };
};

/** Uma linha de comparação: rótulo | valor A | valor B (uso típico em telas estreitas). */
export function CompareInfoRow({ label, left, right, icon, numericPair }: CompareInfoRowProps) {
  const iconSrc = icon ? resolveTokenIconSrc(icon) : undefined;
  const tones = numericPair
    ? compareNumericTones(numericPair.left, numericPair.right, {
        lowerIsBetter: numericPair.lowerIsBetter,
      })
    : { left: "default" as const, right: "default" as const };
  const leftToneClass = toneToTextClass(tones.left);
  const rightToneClass = toneToTextClass(tones.right);

  return (
    <div className="grid grid-cols-[minmax(0,5.75rem)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-2 gap-y-1 border-b border-zinc-800/80 py-2.5 last:border-0 sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3 sm:py-3">
      <div className="flex min-w-0 items-start gap-1.5 pt-0.5">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            className="mt-0.5 size-4 shrink-0 object-contain opacity-90 sm:size-5"
          />
        ) : null}
        <span className="text-[10px] font-medium uppercase leading-snug tracking-wide text-zinc-500 sm:text-xs">
          {label}
        </span>
      </div>
      <div className={cn("min-w-0 break-words text-xs sm:text-sm", leftToneClass)}>{left}</div>
      <div className={cn("min-w-0 break-words text-right text-xs sm:text-sm", rightToneClass)}>{right}</div>
    </div>
  );
}
