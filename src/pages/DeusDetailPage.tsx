import { Link, useLocation, useParams } from "react-router-dom";

import { PageComments } from "@/components/comments/MapComments";
import { DeusBuildAvaliacaoCards } from "@/components/deus/DeusBuildAvaliacaoCards";
import { DeusExplicacaoMaiorSection } from "@/components/deus/DeusExplicacaoMaiorSection";
import { GodMajorDecisionTree } from "@/components/deus/GodMajorDecisionTree";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitCluster, InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions, type PortraitHeaderItem } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import type { DeusExplicacaoBloco } from "@/data/catalog";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { bucketMinorsByEra } from "@/lib/godMajorTree";
import { listIndexLinkStateFromLocation, listIndexReturnTo } from "@/lib/listIndexReturnState";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { localeSectionPath } from "@/lib/localeRoutes";
import { tecnologiaPortraitItemsFromRefs } from "@/lib/tecnologiaPortraitItems";

function unidadePortraitItemsFromRefs(
  catalog: LocaleCatalog,
  refs: { id: number; nome: string }[],
): PortraitHeaderItem[] {
  const { locale, unidadeById, unidadeSlugById } = catalog;
  return refs.map((ref, i) => {
    const u = unidadeById.get(ref.id);
    const slug = unidadeSlugById.get(ref.id);
    return {
      key: `u-${ref.id}-${i}`,
      to: localeSectionPath(locale, "unidades", slug ?? ref.id),
      nome: ref.nome,
      src: u ? getUnidadeAssetUrl(u) : undefined,
    };
  });
}

export function DeusDetailPage() {
  const { t, locale } = useTranslation();
  const catalog = useCatalog();
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
    startById,
  } = catalog;
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

  const treeTiers = d.hierarquia === "Maior" ? bucketMinorsByEra(d, deusById) : null;

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

  const tecnologiaPortraitItems = d.tecnologias?.length
    ? tecnologiaPortraitItemsFromRefs(catalog, d.tecnologias)
    : [];
  const unidadePortraitItems = d.unidades_exclusivas?.length
    ? unidadePortraitItemsFromRefs(catalog, d.unidades_exclusivas)
    : [];

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

      <div className={d.hierarquia === "Maior" ? "grid gap-6 lg:grid-cols-2" : "grid gap-6"}>
        <Section title={t("common.overview")}>
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

        {d.hierarquia === "Maior" ? (
          <Section title={t("common.archetypeEval")}>
            <DeusBuildAvaliacaoCards rush={d.rush} turtle={d.turtle} eco={d.eco} foco={d.foco} />
          </Section>
        ) : null}
      </div>

      {d.hierarquia === "Maior" && d.explicacao_maior?.blocos?.length ? (
        <DeusExplicacaoMaiorSection blocos={d.explicacao_maior.blocos as DeusExplicacaoBloco[]} />
      ) : null}

      {treeTiers ? (
        <Section title={t("common.minorGodTree")} className="mt-6">
          <GodMajorDecisionTree major={d} tiers={treeTiers} />
        </Section>
      ) : null}

      {d.starts?.length ? (
        <Section title={t("common.startsRef")} className="mt-6">
          <ul className="list-inside list-disc space-y-2 text-sm">
            {d.starts.map(({ id: sid, nome }) => {
              const s = startById.get(sid);
              return (
                <li key={sid}>
                  {s ? (
                    <Link to={localeSectionPath(locale, "starts", s.slug)} className="text-amber-200 underline-offset-2 hover:underline">
                      <NotionText text={nome} />
                    </Link>
                  ) : (
                    <NotionText text={nome} />
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {relacoes.length > 0 && !treeTiers ? (
        <Section title={t("common.majorGods")} className="mt-6">
          <ul className="list-inside list-disc space-y-1">
            {relacoes.map((el, i) => (
              <li key={i}>{el}</li>
            ))}
          </ul>
        </Section>
      ) : d.god_maior_relacao?.length && !treeTiers ? (
        <Section title={t("common.minorGods")} className="mt-6">
          <NotionText text={joinRefNomes(d.god_maior_relacao)} />
        </Section>
      ) : null}

      {tecnologiaPortraitItems.length > 0 ? (
        <Section title={t("common.technologies")} className="mt-6">
          <InfoRowPortraitCluster>
            <PortraitHeaderActions
              items={tecnologiaPortraitItems}
              linkState={linkState}
              size="sm"
              justify="start"
            />
          </InfoRowPortraitCluster>
        </Section>
      ) : null}

      {unidadePortraitItems.length > 0 ? (
        <Section title={t("common.exclusiveUnits")} className="mt-6">
          <InfoRowPortraitCluster>
            <PortraitHeaderActions
              items={unidadePortraitItems}
              linkState={linkState}
              size="sm"
              justify="start"
            />
          </InfoRowPortraitCluster>
        </Section>
      ) : d.unidades_exclusivas?.length ? (
        <Section title={t("common.exclusiveUnits")} className="mt-6">
          <NotionText text={joinRefNomes(d.unidades_exclusivas)} />
        </Section>
      ) : null}
      {slug ? <PageComments pageKind="deuses" pageKey={slug} itemName={d.nome} kindLabel={t("comments.kinds.god")} /> : null}
    </div>
  );
}
