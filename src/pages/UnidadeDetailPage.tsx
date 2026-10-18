import { lazy, Suspense } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { UnidadeCombateBody, UnidadeCustoBody, UnidadeVisaoGeralBody } from "@/components/unidade/UnidadeSectionBodies";
import { BackLink } from "@/components/ui/BackLink";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { hasTipoContent } from "@/lib/unidadeTipo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { aldeaoIdMatchingUnit } from "@/lib/unidadeAldeao";
import { localeSectionPath } from "@/lib/localeRoutes";
import { listIndexReturnTo, listOrDetailBackLinkLabel } from "@/lib/listIndexReturnState";
import { isUnitHero } from "@/lib/unitModelTechs";
import { unitModelUrl } from "@/lib/unitModelUrl";

const UnidadeProjection = lazy(() =>
  import("@/components/unidade/UnidadeProjection").then((mod) => ({ default: mod.UnidadeProjection })),
);

export function UnidadeDetailPage() {
  const { t, locale } = useTranslation();
  const { unidadeBySlug, aldeoes, aldeaoSlugById } = useCatalog();
  const { state: navState } = useLocation();
  const unitsList = localeSectionPath(locale, "unidades");
  const backToList = listIndexReturnTo(unitsList, navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, unitsList, t("nav.units"));
  const { slug } = useParams();
  const u = slug ? unidadeBySlug.get(slug) : undefined;

  if (!u) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.unit")}</p>
      </div>
    );
  }

  const unidadeIcon = getUnidadeAssetUrl(u);
  const modelUrl = unitModelUrl(u.id);
  const aldeaoId = aldeaoIdMatchingUnit(u, aldeoes);
  const aldeaoSlug = aldeaoId != null ? aldeaoSlugById.get(aldeaoId) : undefined;
  const villagerPath = aldeaoSlug ? localeSectionPath(locale, "aldeoes", aldeaoSlug) : undefined;

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={u.nome}
        description={
          hasTipoContent(u.tipo) ? <UnidadeTipoLine tipo={u.tipo} colored /> : undefined
        }
        descriptionTag={false}
        headerIconSrc={unidadeIcon}
      />

      {villagerPath ? (
        <div className="mb-6">
          <Link
            to={villagerPath}
            aria-label={t("pages.unidades.openVillagerAria")}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
          >
            {t("pages.unidades.openVillager")}
          </Link>
        </div>
      ) : null}

      <div className={modelUrl ? "grid items-start gap-6 lg:grid-cols-2" : "grid gap-6"}>
        <Section title={t("common.overview")}>
          <UnidadeVisaoGeralBody u={u} />
        </Section>

        {modelUrl ? (
          <Section title={t("common.projection3d")}>
            <Suspense fallback={<p className="text-zinc-500">{t("common.loading")}</p>}>
              <UnidadeProjection unitId={u.id} fallbackUrl={modelUrl} hero={isUnitHero(u.nome, u.ingles, u.tipo)} />
            </Suspense>
          </Section>
        ) : null}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Section title={t("common.combat")}>
          <UnidadeCombateBody u={u} />
        </Section>
        <Section title={t("common.costAndTraining")}>
          <UnidadeCustoBody u={u} />
        </Section>
      </div>
    </div>
  );
}
