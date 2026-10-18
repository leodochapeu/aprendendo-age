import { lazy, Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";

import { UnidadeCombateBody, UnidadeCustoBody, UnidadeVisaoGeralBody } from "@/components/unidade/UnidadeSectionBodies";
import { BackLink } from "@/components/ui/BackLink";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { hasTipoContent } from "@/lib/unidadeTipo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { localeSectionPath } from "@/lib/localeRoutes";
import { listIndexReturnTo, listOrDetailBackLinkLabel } from "@/lib/listIndexReturnState";
import { isUnitHero } from "@/lib/unitModelTechs";
import { unitModelUrl } from "@/lib/unitModelUrl";

const UnidadeProjection = lazy(() =>
  import("@/components/unidade/UnidadeProjection").then((mod) => ({ default: mod.UnidadeProjection })),
);

export function UnidadeDetailPage() {
  const { t, locale } = useTranslation();
  const { unidadeBySlug } = useCatalog();
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
