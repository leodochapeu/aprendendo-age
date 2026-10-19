import { useState } from "react";

import { ModalApp } from "@/components/ui/ModalApp";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useTranslation } from "@/hooks/useTranslation";
import type { Locale } from "@/i18n/types";
import {
  attributeStrengthBreakdown,
  type AttributeStrengthTerm,
  type AttributeStrengthTermId,
} from "@/lib/forcaAtributos";
import { cn } from "@/lib/cn";

type U = LocaleCatalog["unidades"][number];

const TERM_LABEL: Record<AttributeStrengthTermId, string> = {
  hitPoints: "spreadsheet.unidades.hitPoints",
  hackArmor: "spreadsheet.unidades.hackArmor",
  pierceArmor: "spreadsheet.unidades.pierceArmor",
  moveSpeed: "spreadsheet.unidades.moveSpeed",
  dps: "spreadsheet.unidades.dps",
  artilleryBonus: "spreadsheet.unidades.attributeStrengthInfo.artilleryBonus",
  trainTime: "spreadsheet.unidades.trainTime",
  resourceHalf: "spreadsheet.unidades.attributeStrengthInfo.resourceHalf",
  population: "spreadsheet.unidades.population",
};

function formatAmount(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
    maximumFractionDigits: 2,
  });
}

function signedAmount(amount: number, locale: Locale): string {
  const formatted = formatAmount(Math.abs(amount), locale);
  return amount < 0 ? `− ${formatted}` : `+ ${formatted}`;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-4" fill="none">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="6.35" r="0.9" fill="currentColor" />
      <path d="M10 9.15v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ForcaAtributosInfo({ u }: { u: U }) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const breakdown = attributeStrengthBreakdown(u);
  const adds = t("spreadsheet.unidades.attributeStrengthInfo.adds").split("\n");
  const subtracts = t("spreadsheet.unidades.attributeStrengthInfo.subtracts").split("\n");

  return (
    <>
      <button
        type="button"
        aria-label={t("spreadsheet.unidades.attributeStrengthInfo.aria")}
        onClick={() => setOpen(true)}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      >
        <InfoIcon />
      </button>
      <ModalApp
        open={open}
        onClose={() => setOpen(false)}
        title={t("spreadsheet.unidades.attributeStrengthInfo.title")}
        className="max-w-lg"
      >
        <p className="text-sm leading-relaxed text-zinc-300">
          {t("spreadsheet.unidades.attributeStrengthInfo.intro")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <TermList title={t("spreadsheet.unidades.attributeStrengthInfo.addsTitle")} items={adds} sign="+" />
          <TermList
            title={t("spreadsheet.unidades.attributeStrengthInfo.subtractsTitle")}
            items={subtracts}
            sign="−"
          />
        </div>

        <p className="text-sm leading-relaxed text-zinc-400">
          {t("spreadsheet.unidades.attributeStrengthInfo.note")}
        </p>

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
          <p className="border-b border-zinc-800 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {t("spreadsheet.unidades.attributeStrengthInfo.thisUnit")}
          </p>
          <ul>
            {breakdown.terms
              .filter((term) => term.id !== "artilleryBonus" || term.amount !== 0)
              .map((term) => (
                <BreakdownRow key={term.id} term={term} locale={locale} breakdown={breakdown} t={t} />
              ))}
          </ul>
          <div className="flex items-baseline justify-between gap-3 border-t border-zinc-700 bg-zinc-900/70 px-3 py-2.5">
            <span className="text-sm font-medium text-amber-100">
              {t("spreadsheet.unidades.attributeStrengthInfo.result")}
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg tabular-nums text-amber-100">
              {formatAmount(breakdown.total, locale)}
            </span>
          </div>
        </div>
      </ModalApp>
    </>
  );
}

function TermList({ title, items, sign }: { title: string; items: string[]; sign: "+" | "−" }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.filter(Boolean).map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-zinc-200">
            <span className={cn("w-3 shrink-0 tabular-nums", sign === "+" ? "text-emerald-400" : "text-red-300")}>
              {sign}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BreakdownRow({
  term,
  locale,
  breakdown,
  t,
}: {
  term: AttributeStrengthTerm;
  locale: Locale;
  breakdown: ReturnType<typeof attributeStrengthBreakdown>;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-3 py-2 last:border-0">
      <span className="min-w-0 text-sm text-zinc-300">
        <span className="block">{t(TERM_LABEL[term.id])}</span>
        {term.id === "resourceHalf" ? (
          <span className="mt-0.5 block text-xs text-zinc-500">
            {t("spreadsheet.unidades.attributeStrengthInfo.resourceHalfDetail", {
              food: formatAmount(breakdown.food, locale),
              wood: formatAmount(breakdown.wood, locale),
              gold: formatAmount(breakdown.gold, locale),
              sum: formatAmount(breakdown.resourceSum, locale),
            })}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 tabular-nums text-sm",
          term.amount < 0 ? "text-red-300" : "text-emerald-300",
        )}
      >
        {signedAmount(term.amount, locale)}
      </span>
    </li>
  );
}
