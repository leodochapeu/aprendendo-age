import { Link, useLocation, useParams } from "react-router-dom";

import { DeusPortraitHeaderActions } from "@/components/deus/DeusPortraitHeaderActions";
import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { localePantheonIndexPath } from "@/lib/localeRoutes";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import {
  listIndexLinkStateFromLocation,
  listIndexReturnTo,
  listOrDetailBackLinkLabel,
} from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";

export function PanteaoDetailPage() {
  const { t, locale } = useTranslation();
  const { aldeaoById, aldeaoSlugById, deusById, deusSlugById, panteaoBySlug, startById } = useCatalog();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const backToList = listIndexReturnTo("/panteoes", navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, "/panteoes", t("nav.pantheons"));
  const { slug } = useParams();
  const p = slug ? panteaoBySlug.get(slug) : undefined;

  if (!p) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.pantheon")}</p>
      </div>
    );
  }

  const heroBackground =
    "hero_background" in p && typeof p.hero_background === "string" ? p.hero_background : undefined;

  const villEntries = Array.isArray(p.vill) ? p.vill : [];
  const villLinks = villEntries
    .map((item) => {
      const a = aldeaoById.get(item.id);
      if (!a) return null;
      const villagerSlug = aldeaoSlugById.get(item.id) ?? String(item.id);
      return (
        <Link key={item.id} to={`/aldeoes/${villagerSlug}`} className="text-amber-200 underline-offset-2 hover:underline">
          {item.nome}
        </Link>
      );
    })
    .filter(Boolean);

  const startEntries = Array.isArray(p.starts) ? p.starts : [];

  const deusLinkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const deusEntries = Array.isArray(p.deuses) ? p.deuses : [];
  const deusPortraitItems = deusEntries
    .map(({ id: did }) => {
      const d = deusById.get(did);
      const dslug = d ? deusSlugById.get(did) : undefined;
      if (!d || !dslug) return null;
      return { key: String(did), slug: dslug, nome: d.nome, src: getDeusAssetUrl(d) };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const sectionOnHeroClass =
    heroBackground &&
    "border-aom-border/90 bg-aom-card/75 shadow-black/25 backdrop-blur-[2px]";

  return (
    <div
      className={cn(
        heroBackground &&
          "relative isolate -mx-4 -mt-6 -mb-6 grid min-h-[100dvh] grid-cols-1 md:-mx-10 md:-mb-10 md:-mt-10",
      )}
    >
      {heroBackground ? (
        <>
          <div
            className="pointer-events-none -z-[12] col-start-1 row-start-1 w-full min-w-0 self-stretch bg-zinc-950"
            aria-hidden
          />
          <img
            src={heroBackground}
            alt=""
            decoding="async"
            className="pointer-events-none -z-10 col-start-1 row-start-1 block h-auto w-full max-w-full select-none self-start"
            aria-hidden
          />
          <div
            className="pointer-events-none -z-[9] col-start-1 row-start-1 w-full min-w-0 self-stretch bg-gradient-to-b from-zinc-950/88 via-zinc-950/78 to-zinc-950"
            aria-hidden
          />
          <div
            className="pointer-events-none -z-[8] col-start-1 row-start-1 w-full min-w-0 self-stretch bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(245,158,11,0.08),transparent)]"
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={cn(
          "space-y-6",
          heroBackground &&
            "relative z-10 col-start-1 row-start-1 min-h-[100dvh] self-start px-4 pb-10 pt-1 md:px-10",
        )}
      >
        <BackLink to={backToList}>{backLabel}</BackLink>

        {heroBackground ? (
          <header className="space-y-2" aria-labelledby="panteao-detail-heading">
            <p className="font-[family-name:var(--font-display)] text-xs font-medium uppercase tracking-[0.18em] text-amber-400/90">
              {t("common.pantheon")}
            </p>
            <div className="flex items-start justify-between gap-3">
              <h1
                id="panteao-detail-heading"
                className="min-w-0 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-amber-50 sm:text-4xl md:text-5xl"
              >
                {p.nome}
              </h1>
              <CatalogRecordNav section="panteoes" currentId={p.id} className="mt-1 shrink-0 md:mt-2" />
            </div>
          </header>
        ) : (
          <PageHeader
            title={p.nome}
            siblingNav={<CatalogRecordNav section="panteoes" currentId={p.id} />}
          />
        )}

        {slug ? (
          <Link
            to={localePantheonIndexPath(locale, slug)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-left transition hover:border-amber-400/60 hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
          >
            <span>
              <span className="block font-[family-name:var(--font-display)] text-base font-semibold text-amber-50">
                {t("common.pantheonIndex")}
              </span>
              <span className="mt-0.5 block text-sm text-amber-100/75">{t("common.pantheonIndexHint")}</span>
            </span>
            <span aria-hidden className="text-lg text-amber-200">
              →
            </span>
          </Link>
        ) : null}

        {p.description ? (
          <Section title={t("common.description")} className={cn(sectionOnHeroClass)}>
            <NotionText text={p.description} />
          </Section>
        ) : null}
        {"dois_tipos_de_trabalhadores_alimentam_esse_crescimento" in p &&
        p.dois_tipos_de_trabalhadores_alimentam_esse_crescimento ? (
          <Section title={t("common.workers")} className={cn(sectionOnHeroClass)}>
            <NotionText text={p.dois_tipos_de_trabalhadores_alimentam_esse_crescimento} />
          </Section>
        ) : null}

        <div
          className={cn(
            "space-y-0 rounded-2xl border border-aom-border bg-aom-card/60 p-5 shadow-sm shadow-black/20",
            heroBackground && "border-aom-border/90 bg-aom-card/75 shadow-black/25 backdrop-blur-[2px]",
          )}
        >
          {villLinks.length > 0 ? (
            <InfoRow label={villLinks.length > 1 ? t("common.villagersPlural") : t("common.villager")}>
              <span className="flex flex-wrap gap-x-2 gap-y-1">
                {villLinks.map((el, i) => (
                  <span key={i}>
                    {el}
                    {i < villLinks.length - 1 ? "," : ""}
                  </span>
                ))}
              </span>
            </InfoRow>
          ) : null}
          {startEntries.length > 0 ? (
            <InfoRow label={t("common.startsRef")}>
              <ul className="list-inside list-disc space-y-1.5 text-sm">
                {startEntries.map(({ id: sid, nome }) => {
                  const s = startById.get(sid);
                  return (
                    <li key={sid}>
                      {s ? (
                        <Link to={`/starts/${s.slug}`} className="text-amber-200 underline-offset-2 hover:underline">
                          <NotionText text={nome} />
                        </Link>
                      ) : (
                        <NotionText text={nome} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </InfoRow>
          ) : null}
          {deusPortraitItems.length > 0 ? (
            <InfoRow label={t("common.gods")}>
              <DeusPortraitHeaderActions
                items={deusPortraitItems}
                linkState={deusLinkState}
                className="justify-start"
              />
            </InfoRow>
          ) : null}
        </div>
        {slug ? (
          <PageComments pageKind="panteoes" pageKey={slug} itemName={p.nome} kindLabel={t("comments.kinds.pantheon")} />
        ) : null}
      </div>
    </div>
  );
}
