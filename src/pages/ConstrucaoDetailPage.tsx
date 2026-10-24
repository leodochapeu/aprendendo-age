import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";

import { PageComments } from "@/components/comments/MapComments";
import { BuildingProjection, type BuildingVisualChoice } from "@/components/construcao/BuildingProjection";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitCluster, InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { formatArmorPercent } from "@/lib/armorDisplay";
import {
  buildingFamilyOf,
  construcaoPublicId,
  construcaoVariantQuery,
  isHiddenFamilyMember,
  legacyBuildingSlugId,
  presentFamilyMember,
  selectedFamilyMember,
  variantButtonLabel,
  variantGodLabel,
} from "@/lib/buildingFamilies";
import { buildingModelUrl } from "@/lib/buildingModelUrl";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
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
  const { construcaoById, construcaoBySlug, construcaoSlugById, deusById, deusSlugById, eraById, eraSlugById, panteaoById, panteaoSlugById } = catalog;
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const buildingsList = localeSectionPath(locale, "construcoes");
  const backToList = listIndexReturnTo(buildingsList, navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, buildingsList, t("nav.buildings"));
  const { slug } = useParams();
  const legacyId = slug ? legacyBuildingSlugId(slug) : undefined;
  if (legacyId != null) {
    const dest = construcaoSlugById.get(legacyId) ?? legacyId;
    return <Navigate to={localeSectionPath(locale, "construcoes", dest)} replace state={navState} />;
  }
  const c = slug ? construcaoBySlug.get(slug) : undefined;

  if (c && isHiddenFamilyMember(c.id)) {
    const ownerId = construcaoPublicId(c.id);
    const dest = construcaoSlugById.get(ownerId) ?? ownerId;
    return (
      <Navigate
        to={`${localeSectionPath(locale, "construcoes", dest)}${construcaoVariantQuery(c.id)}`}
        replace
        state={navState}
      />
    );
  }

  if (!c) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.building")}</p>
      </div>
    );
  }

  const family = buildingFamilyOf(c.id);
  const member = family && family.canonicalId === c.id ? selectedFamilyMember(family, searchParams.get("v")) : undefined;
  const source = member ? construcaoById.get(member.sourceId) : undefined;
  const view = member && source ? presentFamilyMember(c, source) : c;
  const deus = member?.deusId != null ? deusById.get(member.deusId) : undefined;

  const visuals: BuildingVisualChoice[] | undefined = family
    ? family.members.map((item) => {
        const row = construcaoById.get(item.sourceId);
        if (family.kind === "upgrade") {
          const god = item.deusId != null ? deusById.get(item.deusId) : undefined;
          return {
            id: String(item.sourceId),
            label: row ? variantButtonLabel(row) : String(item.sourceId),
            icon: (god ? getDeusAssetUrl(god) : undefined) ?? (row ? getConstrucaoAssetUrl(row) : undefined),
          };
        }
        if (item.deusId != null) {
          const god = deusById.get(item.deusId);
          return {
            id: String(item.sourceId),
            label: variantGodLabel(row?.nome ?? god?.nome ?? String(item.sourceId)),
            icon: god ? getDeusAssetUrl(god) : undefined,
          };
        }
        const pantheon = panteaoById.get(item.pantheonId);
        return {
          id: String(item.sourceId),
          label: pantheon?.nome ?? String(item.pantheonId),
          icon: pantheon ? getPantheonWatermarkUrl(pantheon) : undefined,
        };
      })
    : undefined;

  const selectVisual = (id: string) => {
    if (!family) return;
    const next = new URLSearchParams(searchParams);
    if (Number(id) === family.members[0].sourceId) next.delete("v");
    else next.set("v", id);
    setSearchParams(next, { replace: true, state: navState });
  };

  const era = view.era_id != null ? eraById.get(view.era_id) : undefined;
  const construcaoIcon = getConstrucaoAssetUrl(family?.kind === "upgrade" && source ? source : view);
  const panteao = view.panteao_id != null ? panteaoById.get(view.panteao_id) : undefined;

  const tecnologiaNames = splitCommaNames(view.tecnologias);
  const tecnologiaPortraitItems = tecnologiaNames.length ? tecnologiaPortraitItemsFromNames(catalog, tecnologiaNames) : [];

  const unidadeIdList = unidadeIdsFromConstrucao(view);
  const unidadePortraitItems = unidadeIdList.length ? unidadePortraitItemsFromIds(catalog, unidadeIdList) : [];

  const showTecnologiasSection = tecnologiaPortraitItems.length > 0 || Boolean(view.tecnologias?.trim());
  const showUnidadesSection = unidadePortraitItems.length > 0 || Boolean(view.unidades?.trim());
  const modelUrl = buildingModelUrl(member?.sourceId ?? view.id);
  const shortDesc = (view.descricao_resumida ?? "").trim();
  const longDesc = (view.descricao_avancada ?? "").trim();
  const hist = (view.historia ?? "").trim();

  const costSection = (
    <Section title={t("common.costAndTime")}>
      <div className="space-y-0">
        <InfoRow label={t("common.totalCost")}>{view.custo ?? "—"}</InfoRow>
        {"comida" in view && typeof view.comida === "number" ? (
          <InfoRow label={t("common.food")} icon="foodaom">
            {view.comida}
          </InfoRow>
        ) : null}
        <InfoRow label={t("common.wood")} icon="woodaom">
          {view.madeira ?? "—"}
        </InfoRow>
        <InfoRow label={t("common.gold")} icon="goldaom">
          {view.ouro ?? "—"}
        </InfoRow>
        <InfoRow label={t("common.buildTime")} icon="aomr_time_icon">
          {view.tempo_construir_segundos ?? "—"}
        </InfoRow>
        <InfoRow label={t("common.garrison")} icon="aom_garrison_icon">
          {view.guarnicao ?? "—"}
        </InfoRow>
      </div>
    </Section>
  );

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={view.nome}
        description={
          shortDesc ? <NotionText text={shortDesc} className="block" /> : undefined
        }
        headerIconSrc={construcaoIcon}
        siblingNav={<CatalogRecordNav section="construcoes" currentId={c.id} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section title={t("common.aboutBuilding")}>
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
            ) : view.panteao ? (
              <InfoRow label={t("common.pantheon")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={view.panteao} />} />
              </InfoRow>
            ) : null}
            {deus ? (
              <InfoRow label={t("common.god")}>
                <InfoRowPortraitOrText
                  portraits={
                    <PortraitHeaderActions
                      items={[
                        {
                          key: String(deus.id),
                          to: localeSectionPath(locale, "deuses", deusSlugById.get(deus.id) ?? deus.id),
                          nome: variantGodLabel(source?.nome ?? deus.nome),
                          src: getDeusAssetUrl(deus),
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
            ) : view.era ? (
              <InfoRow label={t("common.era")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={view.era} />} />
              </InfoRow>
            ) : null}
            {longDesc && longDesc !== shortDesc ? (
              <div className="border-t border-aom-border/50 pt-3">
                <NotionText
                  text={longDesc}
                  className="block whitespace-pre-line text-sm leading-relaxed text-zinc-300"
                />
              </div>
            ) : null}
          </div>
        </Section>

        {modelUrl ? (
          <Section title={t("common.projection3d")}>
            <BuildingProjection
              key={c.id}
              buildingId={c.id}
              fallbackUrl={modelUrl}
              defaultPantheonId={view.panteao_id}
              visuals={visuals}
              activeVisual={member ? String(member.sourceId) : undefined}
              onVisual={selectVisual}
            />
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
              {view.pontos_de_vida ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.pierceDamage")} icon="piercedamage">
              {view.dano_perfurante ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.attackSpeed")} icon="aomr_rate_of_fire_icon">
              {view.velocidade_de_ataque_atk_s ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.dps")} icon="attack_cur">
              {view.dps ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.range")} icon="rangeicon">
              {view.alcance ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.projectiles")} icon="piercedamage">
              {view.no_projeteis ?? "—"}
            </InfoRow>
            <InfoRow label={t("common.hackArmor")} icon="hackarmor">
              {formatArmorPercent(view.armadura_anticorte)}
            </InfoRow>
            <InfoRow label={t("common.pierceArmor")} icon="piercearmor">
              {formatArmorPercent(view.armadura_antiperfurante)}
            </InfoRow>
            <InfoRow label={t("common.crushArmor")} icon="crusharmor">
              {formatArmorPercent(view.armadura_anticontucao)}
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
              <NotionText text={view.tecnologias!} />
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
            <NotionText text={view.unidades!} />
          )}
        </Section>
      ) : null}

      {hist ? (
        <Section title={t("common.history")} className="mt-6">
          <NotionText
            text={hist}
            className="block whitespace-pre-line text-sm leading-relaxed text-zinc-300"
          />
        </Section>
      ) : null}
      {slug ? (
        <PageComments pageKind="construcoes" pageKey={slug} itemName={view.nome} kindLabel={t("comments.kinds.building")} />
      ) : null}
    </div>
  );
}
