import { Link } from "react-router-dom";

import { HomeShowcaseCard } from "@/components/home/HomeShowcaseCard";
import { HomeShowcaseCarousel } from "@/components/home/HomeShowcaseCarousel";
import { HomeShowcaseSection } from "@/components/home/HomeShowcaseSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { localePlayersPath, localeSectionPath } from "@/lib/localeRoutes";
import { trilhaShared } from "@/pages/trilha-de-aprendizado/trilhaAssets";

const HERO_BG = "/assets/others/AprendendoAge_BG.webp";

type HomeNavCard = {
  to: string;
  step: number;
  title: string;
  description: string;
  imageSrc?: string;
  count?: number;
  accent?: "amber";
  isNew?: boolean;
};

export function HomePage() {
  const { t, locale } = useTranslation();
  const {
    aldeoes,
    construcoes,
    deuses,
    eras,
    godpowers,
    mapas,
    panteoes,
    reliquias,
    startsBuildOrder,
    tecnologias,
    unidades,
  } = useCatalog();

  const exploreLabel = t("pages.home.showcase.explore");
  const trailLabel = t("pages.home.showcase.trailStep");
  const newLabel = t("common.new");

  const entryCards: HomeNavCard[] = [
    {
      to: "/trilha-de-aprendizado",
      step: 1,
      title: t("nav.trilha"),
      description: t("pages.home.showcase.trilha.description"),
      imageSrc: getTokenAssetUrl("aomr_archaic_age_icon"),
      accent: "amber" as const,
    },
    {
      to: localeSectionPath(locale, "starts"),
      step: 2,
      title: t("nav.starts"),
      description: t("pages.home.showcase.starts.description"),
      imageSrc: getTokenAssetUrl("aomr_zeus_icon"),
      count: startsBuildOrder.length,
      accent: "amber" as const,
    },
  ];

  const knowledgeCards = [
    {
      to: localeSectionPath(locale, "panteoes"),
      step: 1,
      title: t("nav.pantheons"),
      description: t("pages.home.showcase.panteoes.description"),
      imageSrc: getTokenAssetUrl("aomr_pantheon_greeks_icon"),
      count: panteoes.length,
    },
    {
      to: "/astecas",
      step: 2,
      title: t("nav.astecas"),
      description: t("pages.home.showcase.astecas.description"),
      imageSrc: getTokenAssetUrl("aomr_pantheon_aztecs_icon"),
    },
    {
      to: localeSectionPath(locale, "deuses"),
      step: 3,
      title: t("nav.gods"),
      description: t("pages.home.showcase.deuses.description"),
      imageSrc: getTokenAssetUrl("aomr_amaterasu_icon"),
      count: deuses.length,
    },
    {
      to: localeSectionPath(locale, "eras"),
      step: 4,
      title: t("nav.eras"),
      description: t("pages.home.showcase.eras.description"),
      imageSrc: getTokenAssetUrl("aomr_wonder_age_icon"),
      count: eras.length,
    },
    {
      to: localeSectionPath(locale, "poderes"),
      step: 5,
      title: t("nav.godpowers"),
      description: t("pages.home.showcase.poderes.description"),
      imageSrc: getTokenAssetUrl("aomr_lightning_storm_icon"),
      count: godpowers.length,
    },
    {
      to: localeSectionPath(locale, "construcoes"),
      step: 6,
      title: t("nav.buildings"),
      description: t("pages.home.showcase.construcoes.description"),
      imageSrc: getTokenAssetUrl("aomr_town_center_greek_icon"),
      count: construcoes.length,
    },
    {
      to: localeSectionPath(locale, "unidades"),
      step: 7,
      title: t("nav.units"),
      description: t("pages.home.showcase.unidades.description"),
      imageSrc: getTokenAssetUrl("aomr_type_myth_unit_icon"),
      count: unidades.length,
    },
    {
      to: localeSectionPath(locale, "aldeoes"),
      step: 8,
      title: t("nav.villagers"),
      description: t("pages.home.showcase.aldeoes.description"),
      imageSrc: getTokenAssetUrl("aomr_type_villager_icon"),
      count: aldeoes.length,
    },
    {
      to: localeSectionPath(locale, "mapas"),
      step: 9,
      title: t("nav.maps"),
      description: t("pages.home.showcase.mapas.description"),
      imageSrc: getTokenAssetUrl("aomr_acropolis_icon"),
      count: mapas.length,
    },
    {
      to: localeSectionPath(locale, "reliquias"),
      step: 10,
      title: t("nav.reliquias"),
      description: t("pages.home.showcase.reliquias.description"),
      imageSrc: getTokenAssetUrl("aomr_relic_crown_icon"),
      count: reliquias.length,
    },
    {
      to: localeSectionPath(locale, "tecnologias"),
      step: 11,
      title: t("nav.technologies"),
      description: t("pages.home.showcase.tecnologias.description"),
      imageSrc: getTokenAssetUrl("aomr_pickaxe_icon"),
      count: tecnologias.length,
    },
  ];

  const communityCards: HomeNavCard[] = [
    {
      to: "/videos-comunidade",
      step: 1,
      title: t("nav.communityVideos"),
      description: t("pages.home.showcase.communityVideos.description"),
      imageSrc: trilhaShared("ScoobyManiaco_Perfil.png"),
      isNew: true,
    },
    {
      to: localePlayersPath(locale),
      step: 2,
      title: t("nav.players"),
      description: t("pages.home.showcase.players.description"),
      imageSrc: getTokenAssetUrl("aomr_type_hero_icon"),
      isNew: true,
    },
    {
      to: "/clans",
      step: 3,
      title: t("nav.clans"),
      description: t("pages.home.showcase.clans.description"),
      imageSrc: getTokenAssetUrl("aomr_pantheon_norse_icon"),
    },
    {
      to: "/links-streamers",
      step: 4,
      title: t("nav.streamerLinks"),
      description: t("pages.home.showcase.streamerLinks.description"),
      imageSrc: getTokenAssetUrl("aomr_ambassadors_icon"),
      isNew: true,
    },
    {
      to: "/rank",
      step: 5,
      title: t("nav.rank"),
      description: t("pages.home.showcase.rank.description"),
      imageSrc: getTokenAssetUrl("amaterasu_tier_1_icon"),
    },
  ];

  return (
    <div className="-mx-4 -mt-6 space-y-14 md:-mx-10 md:-mt-10 md:space-y-16">
      <section
        className="relative flex min-h-[76dvh] flex-col overflow-hidden border-b border-aom-border/80 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] sm:min-h-[82dvh] md:min-h-[88dvh]"
        aria-labelledby="home-hero-heading"
      >
        <div className="pointer-events-none absolute inset-0 bg-zinc-950" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat brightness-[1.08] saturate-[1.03]"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          role="presentation"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-zinc-950/68 via-zinc-950/48 to-zinc-950/28"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.12),transparent)]" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[8] h-[min(92dvh,52rem)] bg-[linear-gradient(to_top,rgba(9,9,11,0.92)_0%,rgba(9,9,11,0.88)_10%,rgba(9,9,11,0.78)_24%,rgba(9,9,11,0.62)_42%,rgba(9,9,11,0.48)_58%,rgba(9,9,11,0.28)_74%,rgba(9,9,11,0.12)_88%,transparent_100%)] sm:h-[min(90dvh,56rem)] md:h-[min(88dvh,60rem)]"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-16 pt-[max(4.5rem,env(safe-area-inset-top,0px)+2.5rem)] sm:pb-20 sm:pt-24 md:px-10 md:pb-28 md:pt-28">
          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="font-[family-name:var(--font-display)] text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              {t("pages.home.subtitle")}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
              {t("pages.home.hero")}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
              {t("pages.home.startHere")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/trilha-de-aprendizado"
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              >
                {t("pages.home.trilhaCta")}
              </Link>
              <Link
                to={localeSectionPath(locale, "starts")}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-500/50 bg-zinc-950/40 px-5 py-2.5 text-sm font-medium text-zinc-100 backdrop-blur-sm transition hover:border-amber-500/40 hover:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
              >
                {t("pages.home.buildOrdersCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-14 px-4 pb-10 md:space-y-16 md:px-10 md:pb-14">
        <PageHeader
          title={t("pages.home.exploreTitle")}
          description={t("pages.home.exploreDesc")}
        />

        <HomeShowcaseSection
          title={t("pages.home.entryTitle")}
          description={t("pages.home.entryDesc")}
          trailHint={t("pages.home.entryTrailHint")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {entryCards.map((card) => (
              <HomeShowcaseCard
                key={card.to}
                to={card.to}
                step={card.step}
                trailLabel={trailLabel}
                title={card.title}
                description={card.description}
                imageSrc={card.imageSrc}
                count={card.count}
                accent={card.accent}
                exploreLabel={exploreLabel}
                isNew={card.isNew}
                newLabel={newLabel}
                layout="fill"
              />
            ))}
          </div>
        </HomeShowcaseSection>

        <HomeShowcaseSection
          title={t("nav.modules.conhecimentoAge")}
          description={t("pages.home.knowledgeDesc")}
          trailHint={t("pages.home.knowledgeTrailHint")}
        >
          <HomeShowcaseCarousel
            ariaLabel={t("pages.home.carousel.knowledgeAria")}
            prevLabel={t("pages.home.carousel.prev")}
            nextLabel={t("pages.home.carousel.next")}
          >
            {knowledgeCards.map((card) => (
              <HomeShowcaseCard
                key={card.to}
                to={card.to}
                step={card.step}
                trailLabel={trailLabel}
                title={card.title}
                description={card.description}
                imageSrc={card.imageSrc}
                count={card.count}
                accent="amber"
                exploreLabel={exploreLabel}
              />
            ))}
          </HomeShowcaseCarousel>
        </HomeShowcaseSection>

        <HomeShowcaseSection
          title={t("nav.modules.comunidade")}
          description={t("pages.home.communityDesc")}
          trailHint={t("pages.home.communityTrailHint")}
          accent="teal"
        >
          <HomeShowcaseCarousel
            ariaLabel={t("pages.home.carousel.communityAria")}
            prevLabel={t("pages.home.carousel.prev")}
            nextLabel={t("pages.home.carousel.next")}
          >
            {communityCards.map((card) => (
              <HomeShowcaseCard
                key={card.to}
                to={card.to}
                step={card.step}
                trailLabel={trailLabel}
                title={card.title}
                description={card.description}
                imageSrc={card.imageSrc}
                accent="teal"
                exploreLabel={exploreLabel}
                isNew={card.isNew}
                newLabel={newLabel}
              />
            ))}
          </HomeShowcaseCarousel>
        </HomeShowcaseSection>
      </div>
    </div>
  );
}
