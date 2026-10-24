import { Link, useLocation, useParams } from "react-router-dom";

import { PageComments } from "@/components/comments/MapComments";
import { DeusBuildAvaliacaoCards } from "@/components/deus/DeusBuildAvaliacaoCards";
import { DeusExplicacaoMaiorSection } from "@/components/deus/DeusExplicacaoMaiorSection";
import { GodMinorChoices } from "@/components/deus/GodMinorChoices";
import { GodTechTree } from "@/components/deus/GodTechTree";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import type { DeusExplicacaoBloco } from "@/data/catalog";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { listIndexLinkStateFromLocation, listIndexReturnTo } from "@/lib/listIndexReturnState";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { localeSectionPath } from "@/lib/localeRoutes";

export function DeusDetailPage() {
  const { t, locale } = useTranslation();
  const {
    deusById,
    deusBySlug,
    deusSlugById,
    eraById,
    eraSlugById,
    godpowerById,
    godpowerSlugById,
    panteaoById,
    panteaoSlugById,
  } = useCatalog();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const backToList = listIndexReturnTo(localeSectionPath(locale, "deuses"), navState);

  function deusBackLinkLabel(backTo: string): string {
    const pathOnly = backTo.split("?")[0];
    if (pathOnly === "/deuses" || backTo.startsWith("/deuses?")) return t("nav.gods");
    if (pathOnly === "/gods" || backTo.startsWith("/gods?")) return t("nav.gods");
    if (backTo === "/astecas" || backTo.startsWith("/astecas?")) return t("nav.astecas");
    if (backTo === "/starts" || backTo.startsWith("/starts?")) return t("nav.starts");
    if (backTo.startsWith("/starts/")) return t("common.backToStart");
    if (backTo.startsWith("/poderes/compare") || backTo.startsWith("/god-powers/compare")) return t("pages.godpowers.comparePowers");
    if (backTo.startsWith("/poderes/") || backTo.startsWith("/god-powers/")) return t("pages.godpowers.backToPower");
    if (backTo === "/poderes" || backTo.startsWith("/poderes?") || backTo === "/god-powers" || backTo.startsWith("/god-powers?")) return t("nav.godpowers");
    return t("common.back");
  }

  const backLinkLabel = deusBackLinkLabel(backToList);
  const { slug } = useParams();
  const d = slug ? deusBySlug.get(slug) : undefined;

  if (!d) {
    return (
      <div>
        <BackLink to={backToList}>{backLinkLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.god")}</p>
      </div>
    );
  }

  const deusIcon = getDeusAssetUrl(d);

  const panteaoId = firstNumId(d.panteao);
  const panteao = panteaoId != null ? panteaoById.get(panteaoId) : undefined;
  const eraId = firstNumId(d.era);
  const era = eraId != null ? eraById.get(eraId) : undefined;
  const gpId = firstNumId(d.godpower);
  const gp = gpId != null ? godpowerById.get(gpId) : undefined;

  const relacoes = (d.god_maior_relacao ?? [])
    .map((rel) => {
      const rid = rel.id;
      const x = deusById.get(rid);
      return x ? (
        <Link
          key={rid}
          to={localeSectionPath(locale, "deuses", deusSlugById.get(rid) ?? rid)}
          className="text-amber-200 underline-offset-2 hover:underline"
        >
          {rel.nome}
        </Link>
      ) : null;
    })
    .filter(Boolean);

  const bonusBlocos =
    d.hierarquia === "Maior" && d.explicacao_maior?.blocos?.length
      ? (d.explicacao_maior.blocos as DeusExplicacaoBloco[])
      : null;

  return (
    <div>
      <BackLink to={backToList}>{backLinkLabel}</BackLink>
      <PageHeader
        title={d.nome}
        description={
          [d.hierarquia, firstNome(d.panteao)].some(Boolean) ? (
            <MetaNotionLine parts={[d.hierarquia, firstNome(d.panteao)]} />
          ) : undefined
        }
        headerIconSrc={deusIcon}
        siblingNav={<CatalogRecordNav section="deuses" currentId={d.id} />}
      />

      <div className={bonusBlocos ? "grid items-stretch gap-6 lg:grid-cols-2" : undefined}>
        <Section title={t("common.overview")} className={bonusBlocos ? "h-full" : undefined}>
          <div className="space-y-0">
            {d.hierarquia ? <InfoRow label={t("common.hierarchy")}>{d.hierarquia}</InfoRow> : null}
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
            ) : firstNome(d.panteao) ? (
              <InfoRow label={t("common.pantheon")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={firstNome(d.panteao)!} />} />
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
            ) : firstNome(d.era) ? (
              <InfoRow label={t("common.era")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={firstNome(d.era)!} />} />
              </InfoRow>
            ) : null}
            {gp ? (
              <InfoRow label={t("common.godPower")}>
                <InfoRowPortraitOrText
                  portraits={
                    <PortraitHeaderActions
                      items={[
                        {
                          key: String(gp.id),
                          to: localeSectionPath(locale, "poderes", godpowerSlugById.get(gp.id) ?? gp.id),
                          nome: gp.nome,
                          src: getGodPowerAssetUrl(gp),
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
            ) : firstNome(d.godpower) ? (
              <InfoRow label={t("common.godPower")}>
                <InfoRowPortraitOrText portraits={null} textFallback={<NotionText text={firstNome(d.godpower)!} />} />
              </InfoRow>
            ) : null}
          </div>
        </Section>

        {bonusBlocos ? <DeusExplicacaoMaiorSection blocos={bonusBlocos} className="h-full" /> : null}
      </div>

      <GodTechTree god={d} className="mt-6" linkState={linkState} />

      {d.hierarquia === "Maior" ? <GodMinorChoices god={d} className="mt-6" linkState={linkState} /> : null}

      {d.hierarquia === "Maior" ? (
        <Section title={t("common.archetypeEval")} className="mt-6">
          <DeusBuildAvaliacaoCards rush={d.rush} turtle={d.turtle} eco={d.eco} foco={d.foco} />
        </Section>
      ) : null}

      {d.hierarquia !== "Maior" && relacoes.length > 0 ? (
        <Section title={t("common.majorGods")} className="mt-6">
          <ul className="list-inside list-disc space-y-1">
            {relacoes.map((el, i) => (
              <li key={i}>{el}</li>
            ))}
          </ul>
        </Section>
      ) : d.hierarquia !== "Maior" && d.god_maior_relacao?.length ? (
        <Section title={t("common.minorGods")} className="mt-6">
          <NotionText text={joinRefNomes(d.god_maior_relacao)} />
        </Section>
      ) : null}
      {slug ? <PageComments pageKind="deuses" pageKey={slug} itemName={d.nome} kindLabel={t("comments.kinds.god")} /> : null}
    </div>
  );
}
