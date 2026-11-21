import { Link } from "react-router-dom";

import { BattleAtmosphere, BattleEpicFrame } from "@/components/battle/BattleAtmosphere";
import { useTranslation } from "@/hooks/useTranslation";

export function BattlePage() {
  const { t } = useTranslation();

  return (
    <BattleAtmosphere>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-pink-300">{t("common.beta")}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-amber-50 sm:text-5xl">
          {t("pages.battle.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-200 sm:text-lg">{t("pages.battle.description")}</p>

        <div className="mt-10 grid gap-6">
          <Link
            to="/battle/random"
            className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
          >
            <BattleEpicFrame bodyClassName="px-6 py-10 text-center transition group-hover:bg-black/10">
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-amber-50 sm:text-4xl">
                {t("pages.battle.randomBattle")}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-zinc-200 sm:text-base">
                {t("pages.battle.randomBattleHint")}
              </p>
            </BattleEpicFrame>
          </Link>

          <button type="button" disabled className="cursor-not-allowed text-left">
            <BattleEpicFrame muted bodyClassName="px-6 py-10 text-center opacity-60">
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-zinc-400 sm:text-4xl">
                {t("pages.battle.comingSoon")}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">{t("pages.battle.comingSoonHint")}</p>
            </BattleEpicFrame>
          </button>
        </div>
      </div>
    </BattleAtmosphere>
  );
}
