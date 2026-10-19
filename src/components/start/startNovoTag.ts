import { cn } from "@/lib/cn";

const startNovoTagClassBase =
  "inline-flex shrink-0 items-center rounded border border-sky-700/55 bg-sky-950/80 font-semibold text-sky-200";

export const startNovoTagClass = cn(startNovoTagClassBase, "rounded-md px-2 py-0.5 text-xs");

/** Variação menor (menu lateral). Liga com `navNovo: true` no item do menu. */
export const startNovoTagClassNav = cn(
  startNovoTagClassBase,
  "px-1 py-px text-[0.6rem] leading-tight",
);
