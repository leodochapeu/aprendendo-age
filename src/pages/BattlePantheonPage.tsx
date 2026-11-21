import { Link, Navigate, useParams } from "react-router-dom";

import { BattleAtmosphere } from "@/components/battle/BattleAtmosphere";
import { BattlePantheonCard } from "@/components/battle/BattlePantheonCard";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { modeFromSlug, modeToSlug } from "@/lib/battleSimulator";

export function BattlePantheonPage() {
  const { t } = useTranslation();
  const { mode: modeSlug } = useParams();
  const mode = modeFromSlug(modeSlug);
  const { panteoes, panteaoSlugById } = useCatalog();

  if (!mode) return <Navigate to="/battle/random" replace />;
  if (mode === "category") {
    return <Navigate to={`/battle/random/${modeToSlug("category")}/jogar`} replace />;
  }

  return (
    <BattleAtmosphere>
      <div className="mx-auto max-w-6xl">
        <Link
          to="/battle/random"
          className="text-xs uppercase tracking-[0.18em] text-zinc-400 hover:text-amber-100"
        >
          {t("pages.battle.modeSelectTitle")}
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-pink-300">{t("common.beta")}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-200/80">
          {t("pages.battle.modeRealTitle")}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-amber-50 sm:text-5xl">
          {t("pages.battle.pantheonTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-200 sm:text-lg">{t("pages.battle.pantheonDescription")}</p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {panteoes.map((p) => {
            const slug = panteaoSlugById.get(p.id) ?? String(p.id);
            return (
              <li key={p.id}>
                <BattlePantheonCard
                  to={`/battle/random/${modeToSlug(mode)}/${slug}`}
                  title={p.nome}
                  subtitle={p.description}
                  pantheonId={p.id}
                  pantheonName={p.nome}
                  heroBackground={p.hero_background}
                  icon={p.icon}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </BattleAtmosphere>
  );
}
