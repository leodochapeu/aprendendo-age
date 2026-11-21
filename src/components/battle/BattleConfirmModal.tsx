import { BattleConfirmSheet } from "@/components/battle/BattleConfirmSheet";
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

  return (
    <BattleConfirmSheet
      open={open && attacker != null && defender != null}
      title={t("pages.battle.confirmTitle")}
      description={t("pages.battle.confirmDescription")}
      onClose={onClose}
    >
      {attacker && defender ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <BattleUnitPortrait nome={attacker.nome} icon={attacker.icon} unitId={attacker.id} size="md" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">
                  {t("pages.battle.you")}
                </p>
                <p className="max-w-32 truncate text-sm font-medium text-amber-50">{attacker.nome}</p>
                {revealAttackerCategory ? <UnidadeTipoLine tipo={attacker.tipo} colored /> : null}
              </div>
            </div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-amber-400">VS</p>
            <div className="flex items-center gap-2 text-center sm:text-left">
              <BattleUnitPortrait nome={defender.nome} icon={defender.icon} unitId={defender.id} size="md" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/90">
                  {t("pages.battle.enemy")}
                </p>
                <p className="max-w-32 truncate text-sm font-medium text-amber-50">{defender.nome}</p>
                {revealDefenderCategory ? <UnidadeTipoLine tipo={defender.tipo} colored /> : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 sm:flex-none"
            >
              {t("pages.battle.cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 sm:flex-none"
            >
              {t("pages.battle.confirmAttack")}
            </button>
          </div>
        </div>
      ) : null}
    </BattleConfirmSheet>
  );
}
