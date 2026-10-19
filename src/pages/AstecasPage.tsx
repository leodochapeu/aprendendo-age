import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { StartAuthorsMeta } from "@/components/start/StartAuthorsMeta";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { EntityCard } from "@/components/ui/EntityCard";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoRow } from "@/components/ui/InfoRow";
import { PantheonMetaIcon } from "@/components/ui/PantheonMetaIcon";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { familyMemberForPantheon } from "@/lib/buildingFamilies";
import {
  AZTEC_PANTEON_ID,
  MAPAS_OBSIDIAN_ORIGEM,
  isAztecAldeao,
  isAztecConstrucao,
  isAztecDeus,
  isAztecGodpower,
  isAztecUnidade,
  isObsidianMap,
} from "@/lib/astecasCatalog";
import { getAldeaoAssetUrl, getConstrucaoAssetUrl, getMapaAssetUrl, getMapaPreviewUrl, getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { formatGodNameForMetaNotion, getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { formatMapaOrigem, mapaOrigemTitleIcons } from "@/lib/mapaOrigemIcons";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { panteaoFieldHasMultiplePantheons, pantheonCardTint } from "@/lib/pantheonCardTint";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { hasTipoContent } from "@/lib/unidadeTipo";
import { StartGodPortraits } from "@/components/start/StartGodPortraits";
import { startNovoTagClass } from "@/pages/StartsPage";

const sectionTitleClass =
  "mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-amber-100/95";

export function AstecasPage() {
  const { t } = useTranslation();
  const catalog = useCatalog();
  const {
    aldeaoSlugById,
    aldeoes,
    construcaoById,
    construcaoSlugById,
    construcoes,
    deusSlugById,
    deuses,
    deusById,
    godpowerSlugById,
    godpowers,
    mapaSlugByIndex,
    mapas,
    panteaoById,
    panteaoSlugById,
    startsBuildOrder,
    unidadeSlugById,
    unidades,
  } = catalog;
  const { pathname, search: locSearch } = useLocation();
  const listIndexState = useMemo(
    () => listIndexLinkStateFromLocation(pathname, locSearch),
    [pathname, locSearch],
  );

  const cardTint = pantheonCardTint("Astecas");
  const panteaoAzteca = panteaoById.get(AZTEC_PANTEON_ID);
  const panteaoFichaSlug = panteaoAzteca ? panteaoSlugById.get(panteaoAzteca.id) : undefined;

  const deusesAztecas = useMemo(
    () =>
      [...deuses]
        .filter(isAztecDeus)
        .sort((a, b) => {
          const aM = a.hierarquia?.toLowerCase() === "maior" ? 0 : 1;
          const bM = b.hierarquia?.toLowerCase() === "maior" ? 0 : 1;
          if (aM !== bM) return aM - bM;
          return a.id - b.id;
        }),
    [deuses],
  );

  const godpowersAztecas = useMemo(
    () =>
      [...godpowers]
        .filter(isAztecGodpower)
        .sort((a, b) => a.id - b.id),
    [godpowers],
  );

  const aldeoesAztecas = useMemo(
    () => aldeoes.filter(isAztecAldeao),
    [aldeoes],
  );

  const unidadesAztecas = useMemo(
    () =>
      [...unidades]
        .filter(isAztecUnidade)
        .sort((a, b) => a.id - b.id),
    [unidades],
  );

  const construcoesAztecas = useMemo(
    () =>
      [...construcoes]
        .filter(isAztecConstrucao)
        .sort((a, b) => a.id - b.id),
    [construcoes],
  );

  const mapasObsidian = useMemo(
    () =>
      mapas
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => isObsidianMap(m)),
    [mapas],
  );

  const startsAztecas = useMemo(
    () =>
      [...startsBuildOrder]
        .filter((s) => s.pantheon === "Astecas")
        .sort((a, b) => {
          const aNew = a.status === "new" ? 0 : 1;
          const bNew = b.status === "new" ? 0 : 1;
          if (aNew !== bNew) return aNew - bNew;
          return a.id - b.id;
        }),
    [startsBuildOrder],
  );

  return (
    <div>
      {panteaoAzteca ? (
        <>
          <PageHeader
            title={panteaoAzteca.nome}
            headerIconSrc={getPantheonWatermarkUrl(panteaoAzteca)}
            description={<NotionText text={panteaoAzteca.description} />}
          />
          <div className="mb-10 -mt-2 space-y-0 rounded-2xl border border-aom-border bg-aom-card/60 p-5">
            {Array.isArray(panteaoAzteca.vill) && panteaoAzteca.vill.length > 0 ? (
              <InfoRow label={t("common.villager")} icon="aomr_settler_icon">
                {panteaoAzteca.vill.map((v) => v.nome).join(", ")}
              </InfoRow>
            ) : null}
            {Array.isArray(panteaoAzteca.deuses) && panteaoAzteca.deuses.length > 0 ? (
              <InfoRow label={t("common.gods")} icon={panteaoAzteca.icon ?? undefined}>
                {panteaoAzteca.deuses.map((d) => d.nome).join(", ")}
              </InfoRow>
            ) : null}
            {panteaoFichaSlug ? (
              <p className="pt-1 text-sm text-zinc-500">
                <Link
                  to={`/panteoes/${panteaoFichaSlug}`}
                  className="text-amber-200/90 underline-offset-2 hover:underline"
                >
                  {t("common.pantheonPageLink")}
                </Link>{" "}
                {t("common.inGeneralList")}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <PageHeader title={t("pages.astecas.title")} description={t("pages.astecas.description")} />
      )}

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.gods")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {deusesAztecas.map((d) => (
            <li key={d.id}>
              <EntityCard
                to={`/deuses/${deusSlugById.get(d.id) ?? d.id}`}
                linkState={listIndexState}
                title={d.nome}
                cardTint={cardTint}
                subtitle={d.foco ? <NotionText text={d.foco} /> : undefined}
                meta={
                  <span className="inline-flex flex-wrap items-baseline gap-x-0">
                    {firstNumId(d.panteao) != null ? <PantheonMetaIcon panteaoId={firstNumId(d.panteao)!} /> : null}
                    <MetaNotionLine parts={[firstNome(d.panteao), firstNome(d.era)]} />
                  </span>
                }
                watermarkSrc={getDeusAssetUrl(d)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.godpowers")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {godpowersAztecas.map((g) => {
            const gid = firstNumId(g.god);
            const deus = gid != null ? deusById.get(gid) : undefined;
            const godLine = deus ? formatGodNameForMetaNotion(deus) : joinRefNomes(g.god);
            return (
              <li key={g.id}>
                <EntityCard
                  to={`/poderes/${godpowerSlugById.get(g.id) ?? g.id}`}
                  linkState={listIndexState}
                  title={g.nome}
                  cardTint={cardTint}
                  subtitle={g.descricao_resumida}
                  meta={<MetaNotionLine parts={[godLine, joinRefNomes(g.era), joinRefNomes(g.panteao)]} />}
                  watermarkSrc={getGodPowerAssetUrl(g)}
                  subtitleMinLines={3}
                  subtitleTag={false}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.villagers")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {aldeoesAztecas.map((a) => (
            <li key={a.id}>
              <EntityCard
                to={`/aldeoes/${aldeaoSlugById.get(a.id) ?? a.id}`}
                linkState={listIndexState}
                title={a.nome}
                cardTint={cardTint}
                subtitle={firstNome(a.panteao) ? <NotionText text={firstNome(a.panteao)!} /> : undefined}
                meta={a.ingles ? a.ingles : undefined}
                watermarkSrc={getAldeaoAssetUrl(a)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.units")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {unidadesAztecas.map((u) => (
            <li key={u.id}>
              <EntityCard
                to={`/unidades/${unidadeSlugById.get(u.id) ?? u.id}`}
                linkState={listIndexState}
                title={u.nome}
                cardTint={cardTint}
                subtitleTag={false}
                subtitle={hasTipoContent(u.tipo) ? <UnidadeTipoLine tipo={u.tipo} colored /> : undefined}
                meta={
                  <MetaNotionLine
                    parts={[
                      joinRefNomes(u.panteao),
                      joinRefNomes(u.era),
                      u.categoria?.filter((c) => c.type != null).map((c) => c.type).join(", "),
                    ]}
                  />
                }
                watermarkSrc={getUnidadeAssetUrl(u)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.buildings")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {construcoesAztecas.map((c) => {
            const variantId = familyMemberForPantheon(c.id, AZTEC_PANTEON_ID);
            const variant = variantId != null && variantId !== c.id ? construcaoById.get(variantId) : undefined;
            const tintName = (variant?.panteao_id != null ? panteaoById.get(variant.panteao_id) : c.panteao_id != null ? panteaoById.get(c.panteao_id) : undefined)?.nome ?? "";
            const slug = construcaoSlugById.get(c.id) ?? c.id;
            return (
            <li key={c.id}>
              <EntityCard
                to={variant ? `/construcoes/${slug}?v=${variant.id}` : `/construcoes/${slug}`}
                linkState={listIndexState}
                title={c.nome}
                cardTint={panteaoFieldHasMultiplePantheons(variant?.panteao ?? c.panteao) ? undefined : pantheonCardTint(tintName)}
                subtitle={
                  hasTipoContent(c.tipo) ? <UnidadeTipoLine tipo={c.tipo} colored shell="none" /> : undefined
                }
                meta={<MetaNotionLine parts={[variant?.panteao ?? c.panteao, c.era]} />}
                watermarkSrc={getConstrucaoAssetUrl(c)}
              />
            </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("common.startsBuildOrders")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {startsAztecas.map((s) => (
            <li key={s.slug} className="min-h-[8.5rem]">
              <EntityCard
                className="h-full"
                to={`/starts/${s.slug}`}
                linkState={listIndexState}
                watermarkSrc={resolveTokenIconSrc(s.image)}
                title={
                  <span className="flex w-full min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0">
                      <NotionText text={s.titulo} />
                    </span>
                    {s.status === "new" ? (
                      <span className={startNovoTagClass} title={t("common.new")}>
                        🔷 {t("common.new")} !
                      </span>
                    ) : null}
                  </span>
                }
                subtitleTag={false}
                subtitle={s.god.length ? <StartGodPortraits names={s.god} /> : undefined}
                cardTint={s.pantheon ? pantheonCardTint(s.pantheon) : cardTint}
                meta={<StartAuthorsMeta authors={s.author} />}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("common.mapsObsidianMirror")}</h2>
        <p className="mb-4 text-sm text-zinc-400">
          {t("common.mapsObsidianDesc", { origin: MAPAS_OBSIDIAN_ORIGEM })}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mapasObsidian.map(({ m, i }) => {
            const dlcIcons = mapaOrigemTitleIcons(m.origem);
            const origemMeta = formatMapaOrigem(m.origem);
            return (
              <li key={`${m.nome}-${i}`}>
                <EntityCard
                  to={`/mapas/${mapaSlugByIndex.get(i) ?? i}`}
                  linkState={listIndexState}
                  title={m.nome}
                  subtitle={m.tipo}
                  meta={
                    origemMeta || dlcIcons.length ? (
                      <span className="inline-flex items-center gap-1.5">
                        {dlcIcons.map((ti) => (
                          <img
                            key={ti.src}
                            src={ti.src}
                            alt=""
                            title={ti.label}
                            draggable={false}
                            className="size-4 shrink-0 object-contain"
                          />
                        ))}
                        {origemMeta ? <span>{origemMeta}</span> : null}
                      </span>
                    ) : undefined
                  }
                  backgroundCoverSrc={getMapaPreviewUrl(m)}
                  backgroundCoverFallbackSrc={getMapaAssetUrl(m)}
                  watermarkSrc={getMapaAssetUrl(m)}
                  rankedHighlight={m.mapas_da_ranqueada}
                  titleIcons={
                    m.mapas_da_ranqueada
                      ? [{ icon: "aomr_type_hero_icon", label: t("common.ranked") }]
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
