import { lazy, Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";

import { BackLink } from "@/components/ui/BackLink";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitCluster, InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { entityDisplayDescription } from "@/data/catalogLocale";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { buildingModelUrl } from "@/lib/buildingModelUrl";
import { getConstrucaoAssetUrl, getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import {
  listIndexLinkStateFromLocation,
  listIndexReturnTo,
  listOrDetailBackLinkLabel,
} from "@/lib/listIndexReturnState";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { tecnologiaPortraitItemsFromNames } from "@/lib/tecnologiaPortraitItems";
import { localeSectionPath } from "@/lib/localeRoutes";
import { hasTipoContent } from "@/lib/unidadeTipo";
import type { PortraitHeaderItem } from "@/components/ui/PortraitHeaderActions";

const BuildingProjection = lazy(() =>
  import("@/components/unidade/UnidadeModelViewer").then((mod) => ({ default: mod.UnidadeModelViewer })),
);

function splitCommaNames(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function unidadeIdsFromConstrucao(c: { unidades_ids?: number[]; unidades_id?: number }): number[] {
  const ids = [...(c.unidades_ids ?? [])];
  const single = c.unidades_id;
  if (typeof single === "number" && !ids.includes(single)) ids.push(single);
  return ids;
}

function unidadePortraitItemsFromIds(catalog: LocaleCatalog, ids: number[]): PortraitHeaderItem[] {
  const { locale, unidadeById, unidadeSlugById } = catalog;
  return ids.map((uid, i) => {
    const u = unidadeById.get(uid);
    const slug = unidadeSlugById.get(uid);
    return {
      key: `u-${uid}-${i}`,
      to: localeSectionPath(locale, "unidades", slug ?? uid),
      nome: u?.nome ?? `#${uid}`,
      src: u ? getUnidadeAssetUrl(u) : undefined,
    };
  });
}

export function ConstrucaoDetailPage() {
  const { t, locale } = useTranslation();
  const catalog = useCatalog();
  const { construcaoBySlug, eraById, eraSlugById, panteaoById, panteaoSlugById } = catalog;
  const { pathname, search: locSearch, state: navState } = useLocation();
  const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const buildingsList = localeSectionPath(locale, "construcoes");
  const backToList = listIndexReturnTo(buildingsList, navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, buildingsList, t("nav.buildings"));
  const { slug } = useParams();
  const c = slug ? construcaoBySlug.get(slug) : undefined;

  if (!c) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.building")}</p>
      </div>
    );
  }

  const era = c.era_id != null ? eraById.get(c.era_id) : undefined;
  const construcaoIcon = getConstrucaoAssetUrl(c);
  const panteao = c.panteao_id != null ? panteaoById.get(c.panteao_id) : undefined;

  const tecnologiaNames = splitCommaNames(c.tecnologias);
  const tecnologiaPortraitItems = tecnologiaNames.length ? tecnologiaPortraitItemsFromNames(catalog, tecnologiaNames) : [];

  const unidadeIdList = unidadeIdsFromConstrucao(c);
  const unidadePortraitItems = unidadeIdList.length ? unidadePortraitItemsFromIds(catalog, unidadeIdList) : [];

  const showTecnologiasSection = tecnologiaPortraitItems.length > 0 || Boolean(c.tecnologias?.trim());
  const showUnidadesSection = unidadePortraitItems.length > 0 || Boolean(c.unidades?.trim());
  const modelUrl = buildingModelUrl(c.id);

  const costSection = (
    <Section title={t("common.costAndTime")}>
      <div className="space-y-0">
        <InfoRow label={t("common.totalCost")}>{c.custo ?? "—"}</InfoRow>
        <InfoRow label={t("common.wood")} icon="woodaom">
          {c.madeira ?? "—"}
        </InfoRow>
        <InfoRow label={t("common.gold")} icon="goldaom">
          {c.ouro ?? "—"}
        </InfoRow>
        <InfoRow label={t("common.buildTime")} icon="aomr_time_icon">
          {c.tempo_construir_segundos ?? "—"}
        </InfoRow>
        <InfoRow label={t("common.garrison")} icon="aom_garrison_icon">
          {c.guarnicao ?? "—"}
        </InfoRow>
      </div>
    </Section>
  );

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={c.nome}
        description={entityDisplayDescription(c, locale, t)}
        headerIconSrc={construcaoIcon}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section title={t("common.classification")}>
          <div className="space-y-0">
            {hasTipoContent(c.tipo) ? (
              <InfoRow label={t("common.type")}>
                <UnidadeTipoLine tipo={c.tipo} colored />
              </InfoRow>
            ) : null}
            {panteao ? (
              <InfoRow label={t("common.pantheon")}>
                <InfoRowPortraitOrText
                  portraits={
                    <PortraitHeaderActions
                      items={[
                        {
                          key: String(panteao.id),
                          to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(panteao.id) ?? panteao.id),
                          nome: panteao.nome,
                          src: getPantheonWatermarkUrl(panteao),
                        },
                      ]}
                      linkState={linkState}
                      size="sm"
                      justify="start"
                    />
                  }
                  textFallback={null}
                />
              </InfoRow>
            ) : c.panteao ? (
              <InfoRow label={t("common.pantheon")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={c.panteao} />} />
              </InfoRow>
            ) : null}
            {era ? (
              <InfoRow label={t("common.era")}>
                <InfoRowPortraitOrText
                  portraits={
                    <PortraitHeaderActions
                      items={[
                        {
                          key: String(era.id),
                          to: localeSectionPath(locale, "eras", eraSlugById.get(era.id) ?? era.id),
                          nome: era.nome,
                          src: getEraAssetUrl(era),
                        },
                      ]}
                      linkState={linkState}
                      size="sm"
                      justify="start"
                    />
                  }
                  textFallback={null}
                />
              </InfoRow>
            ) : c.era ? (
              <InfoRow label={t("common.era")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={c.era} />} />
              </InfoRow>
            ) : null}
          </div>
        </Section>

        {modelUrl ? (
          <Section title={t("common.projection3d")}>
            <Suspense fallback={<p className="text-zinc-500">{t("common.loading")}</p>}>
              <BuildingProjection urls={[modelUrl]} />
            </Suspense>
          </Section>
        ) : (
          costSection
        )}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {modelUrl ? costSection : null}
        <Section title={t("common.combatDefense")}>
          <div className="space-y-0">
            <InfoRow label={t("common.hitPoints")} icon="aomr_hit_points_icon">
              {c.pontos_de_vida ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.pierceDamage")} icon="piercedamage">
              {c.dano_perfurante ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.attackSpeed")} icon="aomr_rate_of_fire_icon">
              {c.velocidade_de_ataque_atk_s ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.dps")} icon="attack_cur">
              {c.dps ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.range")} icon="rangeicon">
              {c.alcance ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.projectiles")} icon="piercedamage">
              {c.no_projeteis ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.hackArmor")} icon="hackarmor">
              {formatArmorPercent(c.armadura_anticorte)}
            </InfoRow>
            <InfoRow label={t("common.pierceArmor")} icon="piercearmor">
              {formatArmorPercent(c.armadura_antiperfurante)}
            </InfoRow>
            <InfoRow label={t("common.crushArmor")} icon="crusharmor">
              {formatArmorPercent(c.armadura_anticontucao)}
            </InfoRow>
          </div>
        </Section>

        {showTecnologiasSection ? (
          <Section title={t("common.technologies")}>
            {tecnologiaPortraitItems.length > 0 ? (
              <InfoRowPortraitCluster>
                <PortraitHeaderActions
                  items={tecnologiaPortraitItems}
                  linkState={linkState}
                  size="sm"
                  justify="start"
                />
              </InfoRowPortraitCluster>
            ) : (
              <NotionText text={c.tecnologias!} />
            )}
          </Section>
        ) : (
          <div />
        )}
      </div>

      {showUnidadesSection ? (
        <Section
          title={unidadePortraitItems.length > 0 ? t("common.relatedUnits") : t("nav.units")}
          className="mt-6"
        >
          {unidadePortraitItems.length > 0 ? (
            <InfoRowPortraitCluster>
              <PortraitHeaderActions
                items={unidadePortraitItems}
                linkState={linkState}
                size="sm"
                justify="start"
              />
            </InfoRowPortraitCluster>
          ) : (
            <NotionText text={c.unidades!} />
          )}
        </Section>
      ) : null}
    </div>
  );
}
