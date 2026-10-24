import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

import { StartAuthorsMeta } from "@/components/start/StartAuthorsMeta";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { BackLink } from "@/components/ui/BackLink";
import { EntityCard } from "@/components/ui/EntityCard";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PantheonMetaIcon } from "@/components/ui/PantheonMetaIcon";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { familyMemberForPantheon } from "@/lib/buildingFamilies";
import {
  AZTEC_PANTEON_ID,
  MAPAS_OBSIDIAN_ORIGEM,
  isObsidianMap,
  isPantheonConstrucao,
  isPantheonRef,
} from "@/lib/astecasCatalog";
import { localeSectionPath } from "@/lib/localeRoutes";
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
import { startNovoTagClass } from "@/components/start/startNovoTag";

const sectionTitleClass =
  "mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-amber-100/95";

export function PanteaoFullPage() {
  const { t, locale } = useTranslation();
  const { slug } = useParams();
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
    panteaoBySlug,
    startsBuildOrder,
    unidadeSlugById,
    unidades,
  } = catalog;
  const { pathname, search: locSearch } = useLocation();
  const listIndexState = useMemo(
    () => listIndexLinkStateFromLocation(pathname, locSearch),
    [pathname, locSearch],
  );

  const pantheon = slug ? panteaoBySlug.get(slug) : undefined;
  const pantheonId = pantheon?.id;
  const cardTint = pantheonCardTint(pantheon?.nome ?? "");
  const backTo = slug ? localeSectionPath(locale, "panteoes", slug) : localeSectionPath(locale, "panteoes");

  const deusesDoPanteao = useMemo(
    () =>
      [...deuses]
        .filter((d) => pantheonId != null && isPantheonRef(d.panteao, pantheonId))
        .sort((a, b) => {
          const aM = a.hierarquia?.toLowerCase() === "maior" ? 0 : 1;
          const bM = b.hierarquia?.toLowerCase() === "maior" ? 0 : 1;
          if (aM !== bM) return aM - bM;
          return a.id - b.id;
        }),
    [deuses, pantheonId],
  );

  const godpowersDoPanteao = useMemo(
    () =>
      [...godpowers]
        .filter((g) => pantheonId != null && isPantheonRef(g.panteao, pantheonId))
        .sort((a, b) => a.id - b.id),
    [godpowers, pantheonId],
  );

  const aldeoesDoPanteao = useMemo(
    () => aldeoes.filter((a) => pantheonId != null && isPantheonRef(a.panteao, pantheonId)),
    [aldeoes, pantheonId],
  );

  const unidadesDoPanteao = useMemo(
    () =>
      [...unidades]
        .filter((u) => pantheonId != null && isPantheonRef(u.panteao, pantheonId))
        .sort((a, b) => a.id - b.id),
    [unidades, pantheonId],
  );

  const construcoesDoPanteao = useMemo(
    () =>
      [...construcoes]
        .filter((c) => pantheonId != null && isPantheonConstrucao(c, pantheonId))
        .sort((a, b) => a.id - b.id),
    [construcoes, pantheonId],
  );

  const mapasObsidian = useMemo(
    () =>
      mapas
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => isObsidianMap(m)),
    [mapas],
  );

  const startsDoPanteao = useMemo(
    () =>
      [...startsBuildOrder]
        .filter((s) => pantheon != null && s.pantheon === pantheon.nome)
        .sort((a, b) => {
          const aNew = a.status === "new" ? 0 : 1;
          const bNew = b.status === "new" ? 0 : 1;
          if (aNew !== bNew) return aNew - bNew;
          return a.id - b.id;
        }),
    [pantheon, startsBuildOrder],
  );

  if (!pantheon || pantheonId == null) {
    return (
      <div>
        <BackLink to={backTo}>{t("nav.pantheons")}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.pantheon")}</p>
      </div>
    );
  }

  return (
    <div>
      <BackLink to={backTo}>{pantheon.nome}</BackLink>
      <PageHeader
        title={t("common.pantheonIndex")}
        headerIconSrc={getPantheonWatermarkUrl(pantheon)}
        description={
          pantheonId === AZTEC_PANTEON_ID ? t("pages.astecas.description") : t("common.pantheonIndexHint")
        }
      />

      {deusesDoPanteao.length > 0 ? (
      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.gods")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {deusesDoPanteao.map((d) => (
            <li key={d.id}>
              <EntityCard
                to={localeSectionPath(locale, "deuses", deusSlugById.get(d.id) ?? d.id)}
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
      ) : null}

      {godpowersDoPanteao.length > 0 ? (
      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.godpowers")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {godpowersDoPanteao.map((g) => {
            const gid = firstNumId(g.god);
            const deus = gid != null ? deusById.get(gid) : undefined;
            const godLine = deus ? formatGodNameForMetaNotion(deus) : joinRefNomes(g.god);
            return (
              <li key={g.id}>
                <EntityCard
                  to={localeSectionPath(locale, "poderes", godpowerSlugById.get(g.id) ?? g.id)}
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
      ) : null}

      {aldeoesDoPanteao.length > 0 ? (
      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.villagers")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {aldeoesDoPanteao.map((a) => (
            <li key={a.id}>
              <EntityCard
                to={localeSectionPath(locale, "aldeoes", aldeaoSlugById.get(a.id) ?? a.id)}
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
      ) : null}

      {unidadesDoPanteao.length > 0 ? (
      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.units")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {unidadesDoPanteao.map((u) => (
            <li key={u.id}>
              <EntityCard
                to={localeSectionPath(locale, "unidades", unidadeSlugById.get(u.id) ?? u.id)}
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
      ) : null}

      {construcoesDoPanteao.length > 0 ? (
      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("nav.buildings")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {construcoesDoPanteao.map((c) => {
            const variantId = familyMemberForPantheon(c.id, pantheonId);
            const variant = variantId != null && variantId !== c.id ? construcaoById.get(variantId) : undefined;
            const tintName = (variant?.panteao_id != null ? panteaoById.get(variant.panteao_id) : c.panteao_id != null ? panteaoById.get(c.panteao_id) : undefined)?.nome ?? "";
            const buildingSlug = construcaoSlugById.get(c.id) ?? c.id;
            return (
            <li key={c.id}>
              <EntityCard
                to={
                  variant
                    ? `${localeSectionPath(locale, "construcoes", buildingSlug)}?v=${variant.id}`
                    : localeSectionPath(locale, "construcoes", buildingSlug)
                }
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
      ) : null}

      {startsDoPanteao.length > 0 ? (
      <section className="mt-10">
        <h2 className={sectionTitleClass}>{t("common.startsBuildOrders")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {startsDoPanteao.map((s) => (
            <li key={s.slug} className="min-h-[8.5rem]">
              <EntityCard
                className="h-full"
                to={localeSectionPath(locale, "starts", s.slug)}
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
      ) : null}

      {pantheonId === AZTEC_PANTEON_ID && mapasObsidian.length > 0 ? (
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
                  to={localeSectionPath(locale, "mapas", mapaSlugByIndex.get(i) ?? i)}
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
      ) : null}
    </div>
  );
}
