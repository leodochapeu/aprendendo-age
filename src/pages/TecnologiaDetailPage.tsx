import { useLocation, useParams } from "react-router-dom";

import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitCluster } from "@/components/ui/InfoRowPortraitCluster";
import { TecnologiaTipoBadges } from "@/components/tecnologia/TecnologiaTipoBadges";
import { NotionText } from "@/components/ui/NotionText";
import { hasTecnologiaTipo } from "@/lib/tecnologiaTipo";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  PortraitHeaderActions,
  type PortraitHeaderItem,
} from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getConstrucaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import {
  listIndexLinkStateFromLocation,
  listIndexReturnTo,
  listOrDetailBackLinkLabel,
} from "@/lib/listIndexReturnState";
import { construcaoPublicId, construcaoVariantQuery } from "@/lib/buildingFamilies";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getTecnologiaAssetUrl } from "@/lib/tecnologiaAssetUrl";

export function TecnologiaDetailPage() {
  const { t, locale } = useTranslation();
  const {
    construcaoById,
    construcaoSlugById,
    deusById,
    deusSlugById,
    eraById,
    eraSlugById,
    panteaoById,
    panteaoSlugById,
    tecnologiaBySlug,
    tecnologias,
  } = useCatalog();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const tecLinkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const techList = localeSectionPath(locale, "tecnologias");
  const backToList = listIndexReturnTo(techList, navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, techList, t("nav.technologies"));
  const { slug } = useParams();
  const tech = slug ? tecnologiaBySlug.get(slug) : undefined;

  if (!tech) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.tech")}</p>
      </div>
    );
  }

  const tecIndex = tecnologias.indexOf(tech);
  const shortDesc = (tech.descricao_resumida ?? "").trim();
  const hist = (tech.historia ?? "").trim();

  const eraRefs = tech.eras;
  const panteoesField = tech.panteoes;
  const construcaoOrigemField = tech.construcao_origem;
  const godEspecificoField = tech.god_especifico;

  const deusPortraitItems: PortraitHeaderItem[] =
    Array.isArray(godEspecificoField) && godEspecificoField.length
      ? godEspecificoField.map((r, i) => {
          const d = deusById.get(r.id);
          return {
            key: `${r.id}-${i}`,
            to: localeSectionPath(locale, "deuses", deusSlugById.get(r.id) ?? r.id),
            nome: r.nome,
            src: d ? getDeusAssetUrl(d) : undefined,
          };
        })
      : [];

  const panteoesPortraitItems =
    Array.isArray(panteoesField) && panteoesField.length
      ? panteoesField.map((r, i) => {
          const p = panteaoById.get(r.id);
          return {
            key: `${r.id}-${i}`,
            to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(r.id) ?? r.id),
            nome: r.nome,
            src: p ? getPantheonWatermarkUrl(p) : undefined,
          };
        })
      : [];

  const eraPortraitItems =
    Array.isArray(eraRefs) && eraRefs.length
      ? eraRefs.map((r, i) => {
          const e = eraById.get(r.id);
          return {
            key: `${r.id}-${i}`,
            to: localeSectionPath(locale, "eras", eraSlugById.get(r.id) ?? r.id),
            nome: r.nome,
            src: e ? getEraAssetUrl(e) : undefined,
          };
        })
      : [];

  const construcaoPortraitItems =
    Array.isArray(construcaoOrigemField) && construcaoOrigemField.length
      ? construcaoOrigemField.map((r, i) => {
          const publicId = construcaoPublicId(r.id);
          const c = construcaoById.get(publicId);
          return {
            key: `${r.id}-${i}`,
            to: `${localeSectionPath(locale, "construcoes", construcaoSlugById.get(publicId) ?? publicId)}${construcaoVariantQuery(r.id)}`,
            nome: r.nome,
            src: c ? getConstrucaoAssetUrl(c) : undefined,
          };
        })
      : [];

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={
          tech.nome ||
          t("common.untitledTech", { index: tecIndex >= 0 ? tecIndex : "?" })
        }
        description={
          shortDesc ? <NotionText text={shortDesc} className="block" /> : undefined
        }
        headerIconSrc={getTecnologiaAssetUrl(tech)}
        siblingNav={tecIndex >= 0 ? <CatalogRecordNav section="tecnologias" currentId={tecIndex} /> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("common.summary")}>
          <div className="space-y-0">
            {tech.beneficia ? (
              <InfoRow label={t("common.benefits")}>
                <NotionText text={tech.beneficia} />
              </InfoRow>
            ) : null}
            {hasTecnologiaTipo(tech.tipo) || tech.tipo?.trim() ? (
              <InfoRow label={t("common.type")}>
                <TecnologiaTipoBadges tipo={tech.tipo} />
              </InfoRow>
            ) : null}
            {panteoesPortraitItems.length > 0 ? (
              <InfoRow label={t("common.pantheon")}>
                <InfoRowPortraitCluster>
                  <PortraitHeaderActions
                    items={panteoesPortraitItems}
                    linkState={tecLinkState}
                    size="sm"
                    justify="start"
                  />
                </InfoRowPortraitCluster>
              </InfoRow>
            ) : typeof tech.panteoes === "string" && tech.panteoes.trim() ? (
              <InfoRow label={t("common.pantheon")}>
                <NotionText text={tech.panteoes} />
              </InfoRow>
            ) : null}
            {eraPortraitItems.length > 0 ? (
              <InfoRow label={t("common.era")}>
                <InfoRowPortraitCluster>
                  <PortraitHeaderActions
                    items={eraPortraitItems}
                    linkState={tecLinkState}
                    size="sm"
                    justify="start"
                  />
                </InfoRowPortraitCluster>
              </InfoRow>
            ) : null}
            {construcaoPortraitItems.length > 0 ? (
              <InfoRow label={t("common.originBuilding")}>
                <InfoRowPortraitCluster>
                  <PortraitHeaderActions
                    items={construcaoPortraitItems}
                    linkState={tecLinkState}
                    size="sm"
                    justify="start"
                  />
                </InfoRowPortraitCluster>
              </InfoRow>
            ) : typeof construcaoOrigemField === "string" && construcaoOrigemField.trim() ? (
              <InfoRow label={t("common.originBuilding")}>
                <NotionText text={construcaoOrigemField} />
              </InfoRow>
            ) : null}
            {deusPortraitItems.length > 0 ? (
              <InfoRow label={t("common.specificGod")}>
                <InfoRowPortraitCluster>
                  <PortraitHeaderActions
                    items={deusPortraitItems}
                    linkState={tecLinkState}
                    size="sm"
                    justify="start"
                  />
                </InfoRowPortraitCluster>
              </InfoRow>
            ) : null}
          </div>
        </Section>
        {tech.campo && tech.campo.length > 0 ? (
          <Section title={t("common.fieldEffect")}>
            <div className="flex flex-col gap-3">
              {tech.campo.map((line, i) => (
                <p key={i} className="m-0 block w-full leading-relaxed text-zinc-300">
                  <NotionText text={line} className="block" />
                </p>
              ))}
            </div>
          </Section>
        ) : null}
      </div>

      {hist ? (
        <Section title={t("common.history")} className="mt-6">
          <NotionText
            text={hist}
            className="block whitespace-pre-line text-sm leading-relaxed text-zinc-300"
          />
        </Section>
      ) : null}
    </div>
  );
}
