import { Link } from "react-router-dom";

import { BattleAtmosphere, BattleEpicFrame } from "@/components/battle/BattleAtmosphere";
import { useTranslation } from "@/hooks/useTranslation";
import { modeToSlug } from "@/lib/battleSimulator";

export function BattleModePage() {
  const { t } = useTranslation();

  return (
    <BattleAtmosphere>
      <div className="mx-auto max-w-3xl">
        <Link
          to="/battle"
          className="text-xs uppercase tracking-[0.18em] text-zinc-400 hover:text-amber-100"
        >
          {t("pages.battle.backToMenu")}
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-pink-300">{t("common.beta")}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-amber-50 sm:text-5xl">
          {t("pages.battle.modeSelectTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-200 sm:text-lg">{t("pages.battle.modeSelectDescription")}</p>

        <div className="mt-10 grid gap-6">
          <Link
            to={`/battle/random/${modeToSlug("category")}`}
            className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
          >
            <BattleEpicFrame bodyClassName="px-6 py-10 text-center transition group-hover:bg-black/10">
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-amber-50 sm:text-4xl">
                {t("pages.battle.modeCategoryTitle")}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-zinc-200 sm:text-base">
                {t("pages.battle.modeCategoryHint")}
              </p>
            </BattleEpicFrame>
          </Link>

          <Link
            to={`/battle/random/${modeToSlug("real")}`}
            className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
          >
            <BattleEpicFrame wash="rose" bodyClassName="px-6 py-10 text-center transition group-hover:bg-black/10">
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-amber-50 sm:text-4xl">
                {t("pages.battle.modeRealTitle")}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-zinc-200 sm:text-base">
                {t("pages.battle.modeRealHint")}
              </p>
            </BattleEpicFrame>
          </Link>
        </div>
      </div>
    </BattleAtmosphere>
  );
}
