import { useLocation, useParams } from "react-router-dom";

import { DeusPortraitHeaderActions } from "@/components/deus/DeusPortraitHeaderActions";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { entityDisplayDescription } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { formatGodNameStringForMetaNotion, getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { firstNome, firstNumId } from "@/lib/entityRefs";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import {
  listIndexLinkStateFromLocation,
  listIndexReturnTo,
  listOrDetailBackLinkLabel,
} from "@/lib/listIndexReturnState";

export function GodpowerDetailPage() {
  const { t, locale } = useTranslation();
  const { deusById, deusSlugById, eraById, eraSlugById, godpowerBySlug, panteaoById, panteaoSlugById } =
    useCatalog();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const deusLinkFromPowerState = listIndexLinkStateFromLocation(pathname, locSearch);
  const backToList = listIndexReturnTo("/poderes", navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, "/poderes", t("nav.godpowers"));
  const { slug } = useParams();
  const g = slug ? godpowerBySlug.get(slug) : undefined;

  if (!g) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.power")}</p>
      </div>
    );
  }

  const godId = firstNumId(g.god);
  const eraId = firstNumId(g.era);
  const panteaoId = firstNumId(g.panteao);
  const deus = godId != null ? deusById.get(godId) : undefined;
  const era = eraId != null ? eraById.get(eraId) : undefined;
  const panteao = panteaoId != null ? panteaoById.get(panteaoId) : undefined;
  const powerIcon = getGodPowerAssetUrl(g);

  const deusSlug = deus ? (deusSlugById.get(deus.id) ?? String(deus.id)) : undefined;
  const deusPortraitItems =
    deus && deusSlug
      ? [
          {
            key: String(deus.id),
            slug: deusSlug,
            nome: deus.nome,
            src: getDeusAssetUrl(deus),
          },
        ]
      : [];

  const eraPortraitItems =
    era != null
      ? [
          {
            key: `era-${era.id}`,
            to: `/eras/${eraSlugById.get(era.id) ?? era.id}`,
            nome: era.nome,
            src: getEraAssetUrl(era),
          },
        ]
      : [];

  const panteaoPortraitItems =
    panteao != null
      ? [
          {
            key: `panteao-${panteao.id}`,
            to: `/panteoes/${panteaoSlugById.get(panteao.id) ?? panteao.id}`,
            nome: panteao.nome,
            src: getPantheonWatermarkUrl(panteao),
          },
        ]
      : [];

  const godNomeRef = firstNome(g.god);
  const eraNomeRef = firstNome(g.era);
  const panteaoNomeRef = firstNome(g.panteao);

  const showDeusRow = !!(deusPortraitItems.length || godNomeRef);
  const showEraRow = !!(eraPortraitItems.length || eraNomeRef);
  const showPanteaoRow = !!(panteaoPortraitItems.length || panteaoNomeRef);

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={g.nome}
        description={entityDisplayDescription(g, locale, t)}
        headerIconSrc={powerIcon}
        siblingNav={<CatalogRecordNav section="poderes" currentId={g.id} />}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title={t("common.links")}>
          <div className="space-y-0">
            {showDeusRow ? (
              <InfoRow label={t("common.god")}>
                <InfoRowPortraitOrText
                  portraits={
                    deusPortraitItems.length > 0 ? (
                      <DeusPortraitHeaderActions
                        items={deusPortraitItems}
                        linkState={deusLinkFromPowerState}
                        size="sm"
                        justify="start"
                      />
                    ) : null
                  }
                  textFallback={
                    godNomeRef ? <NotionText text={formatGodNameStringForMetaNotion(godNomeRef, godId)} /> : null
                  }
                />
              </InfoRow>
            ) : null}
            {showEraRow ? (
              <InfoRow label={t("common.era")}>
                <InfoRowPortraitOrText
                  portraits={
                    eraPortraitItems.length > 0 ? (
                      <PortraitHeaderActions
                        items={eraPortraitItems}
                        linkState={deusLinkFromPowerState}
                        size="sm"
                        justify="start"
                      />
                    ) : null
                  }
                  textFallback={eraNomeRef ? <NotionText text={eraNomeRef} /> : null}
                />
              </InfoRow>
            ) : null}
            {showPanteaoRow ? (
              <InfoRow label={t("common.pantheon")}>
                <InfoRowPortraitOrText
                  portraits={
                    panteaoPortraitItems.length > 0 ? (
                      <PortraitHeaderActions
                        items={panteaoPortraitItems}
                        linkState={deusLinkFromPowerState}
                        size="sm"
                        justify="start"
                      />
                    ) : null
                  }
                  textFallback={panteaoNomeRef ? <NotionText text={panteaoNomeRef} /> : null}
                />
              </InfoRow>
            ) : null}
          </div>
        </Section>

        <Section title={t("common.numbers")}>
          <div className="space-y-0">
            <InfoRow label={t("common.cooldownSec")}>{g.cooldown_seg ?? "—"}</InfoRow>
            <InfoRow label={t("common.mapDurationSec")}>{g.duracao_no_mapa_seg ?? "—"}</InfoRow>
            <InfoRow label={t("common.repeatCost")}>{g.custo_repetir ?? "—"}</InfoRow>
            <InfoRow label={t("common.incrementPerUse")}>{g.incremento_por_uso ?? "—"}</InfoRow>
          </div>
        </Section>
      </div>

      {g.descricao_resumida ? (
        <Section title={t("common.summary")} className="mt-6">
          <NotionText text={g.descricao_resumida} />
        </Section>
      ) : null}

      {g.descricao_avancada ? (
        <Section title={t("common.advancedDescription")} className="mt-6">
          <NotionText text={g.descricao_avancada} />
        </Section>
      ) : null}
    </div>
  );
}
