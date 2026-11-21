import { ModalApp } from "@/components/ui/ModalApp";
import { BattleUnitPortrait } from "@/components/battle/BattleUnitPortrait";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import type { Unidade } from "@/data/catalog";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  open: boolean;
  attacker: Unidade | null;
  defender: Unidade | null;
  revealAttackerCategory: boolean;
  revealDefenderCategory: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function BattleConfirmModal({
  open,
  attacker,
  defender,
  revealAttackerCategory,
  revealDefenderCategory,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  if (!attacker || !defender) return null;

  return (
    <ModalApp
      open={open}
      onClose={onClose}
      title={t("pages.battle.confirmTitle")}
      description={t("pages.battle.confirmDescription")}
      className="max-w-lg"
    >
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            {t("pages.battle.you")}
          </p>
          <BattleUnitPortrait nome={attacker.nome} icon={attacker.icon} unitId={attacker.id} size="lg" />
          <p className="max-w-28 text-sm font-medium text-amber-50">{attacker.nome}</p>
          {revealAttackerCategory ? (
            <UnidadeTipoLine tipo={attacker.tipo} colored className="justify-center" />
          ) : null}
        </div>
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-amber-400">VS</p>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300/90">
            {t("pages.battle.enemy")}
          </p>
          <BattleUnitPortrait nome={defender.nome} icon={defender.icon} unitId={defender.id} size="lg" />
          <p className="max-w-28 text-sm font-medium text-amber-50">{defender.nome}</p>
          {revealDefenderCategory ? (
            <UnidadeTipoLine tipo={defender.tipo} colored className="justify-center" />
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
        >
          {t("pages.battle.cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {t("pages.battle.confirmAttack")}
        </button>
      </div>
    </ModalApp>
  );
}
