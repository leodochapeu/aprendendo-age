import { useEffect } from "react";
import { createPortal } from "react-dom";

import { BattleCalcPanel } from "@/components/battle/BattleCalcPanel";
import { BattleUnitPortrait } from "@/components/battle/BattleUnitPortrait";
import { useTranslation } from "@/hooks/useTranslation";
import type { RoundOutcome } from "@/lib/battleGame";
import type { TrainingDuel } from "@/lib/battleSimulator";
import { cn } from "@/lib/cn";
import type { Unidade } from "@/data/catalog";

type Props = {
  open: boolean;
  outcome: RoundOutcome;
  attacker: Unidade;
  defender: Unidade;
  duel: TrainingDuel;
  continueLabel: string;
  onContinue: () => void;
};

const TITLE_CLASS: Record<RoundOutcome, string> = {
  win: "text-emerald-300 drop-shadow-[0_0_28px_rgba(52,211,153,0.55)]",
  loss: "text-rose-300 drop-shadow-[0_0_28px_rgba(251,113,133,0.5)]",
  draw: "text-amber-200 drop-shadow-[0_0_28px_rgba(251,191,36,0.45)]",
};

const GLOW_CLASS: Record<RoundOutcome, string> = {
  win: "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.28),transparent_62%)]",
  loss: "bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.28),transparent_62%)]",
  draw: "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.24),transparent_62%)]",
};

function sideMark(winner: "a" | "b" | "draw", side: "a" | "b"): "crown" | "skull" | null {
  if (winner === "draw") return null;
  return winner === side ? "crown" : "skull";
}

function FighterPortrait({
  unit,
  label,
  labelClass,
  mark,
  markLabel,
}: {
  unit: Unidade;
  label: string;
  labelClass: string;
  mark: "crown" | "skull" | null;
  markLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em]", labelClass)}>
        {label}
        {mark ? (
          <span role="img" aria-label={markLabel} className="text-lg leading-none">
            {mark === "crown" ? "👑" : "💀"}
          </span>
        ) : null}
      </p>
      <div className="relative mt-3">
        <div
          aria-hidden
          className={cn(
            "absolute -inset-3 rounded-full blur-xl",
            mark === "crown" && "bg-amber-400/25",
            mark === "skull" && "bg-rose-500/15",
            mark == null && "bg-amber-200/10",
          )}
        />
        <BattleUnitPortrait
          nome={unit.nome}
          icon={unit.icon}
          size="lg"
          className={cn(
            "relative rounded-2xl bg-[#1a1612]",
            mark === "crown" && "border-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.5)] ring-2 ring-amber-200/50",
            mark === "skull" && "border-rose-300/30 opacity-80 grayscale-[0.2]",
          )}
        />
      </div>
      <p className="mt-3 max-w-[9.5rem] text-sm font-semibold text-amber-50 sm:text-base">{unit.nome}</p>
    </div>
  );
}

function AnimatedWord({ text, className }: { text: string; className: string }) {
  const letters = Array.from(text);
  return (
    <h2
      className={cn(
        "font-[family-name:var(--font-display)] text-5xl font-semibold tracking-[0.12em] sm:text-7xl",
        className,
      )}
      aria-label={text}
    >
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className="inline-block animate-[battleResultLetter_0.7s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
          style={{ animationDelay: `${120 + index * 70}ms` }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </h2>
  );
}

export function BattleResultModal({
  open,
  outcome,
  attacker,
  defender,
  duel,
  continueLabel,
  onContinue,
}: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onContinue]);

  if (!open) return null;

  const modeLabel = duel.mode === "category" ? t("pages.battle.modeCategory") : t("pages.battle.modeAttributes");

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-[battleResultFade_0.35s_ease-out] bg-black/80 motion-reduce:animate-none" aria-hidden />
      <div className={cn("pointer-events-none absolute inset-0", GLOW_CLASS[outcome])} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(`pages.battle.outcome.${outcome}`)}
        className="relative flex max-h-[min(92vh,52rem)] w-full max-w-3xl animate-[battleResultCard_0.55s_cubic-bezier(0.22,1,0.36,1)] flex-col overflow-hidden rounded-3xl border border-amber-200/30 bg-[#100e0b] shadow-[0_30px_80px_rgba(0,0,0,0.65)] motion-reduce:animate-none"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
          <p className="animate-[battleResultRise_0.6s_ease-out_both] text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80 motion-reduce:animate-none">
            {modeLabel}
          </p>
          <div className="mt-3 text-center">
            <AnimatedWord text={t(`pages.battle.outcome.${outcome}`)} className={TITLE_CLASS[outcome]} />
          </div>
          <div className="mt-6 flex animate-[battleResultRise_0.7s_ease-out_0.4s_both] items-center justify-center gap-2 motion-reduce:animate-none sm:gap-6">
            <FighterPortrait
              unit={attacker}
              label={t("pages.battle.you")}
              labelClass="text-emerald-200"
              mark={sideMark(duel.winner, "a")}
              markLabel={duel.winner === "a" ? t("pages.battle.winnerMark") : t("pages.battle.loserMark")}
            />
            <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-widest text-amber-200 sm:text-3xl">
              VS
            </p>
            <FighterPortrait
              unit={defender}
              label={t("pages.battle.enemy")}
              labelClass="text-rose-200"
              mark={sideMark(duel.winner, "b")}
              markLabel={duel.winner === "b" ? t("pages.battle.winnerMark") : t("pages.battle.loserMark")}
            />
          </div>
          <div className="mt-8 animate-[battleResultRise_0.7s_ease-out_0.7s_both] motion-reduce:animate-none">
            <BattleCalcPanel duel={duel} attacker={attacker} defender={defender} defaultOpen />
          </div>
        </div>
        <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl border border-amber-200/50 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/30"
          >
            {continueLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes battleResultFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes battleResultCard {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes battleResultLetter {
          from { opacity: 0; transform: translateY(0.45em) scale(0.82); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes battleResultRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
