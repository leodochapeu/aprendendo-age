import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { useTranslation } from "@/hooks/useTranslation";
import { localeSectionPath } from "@/lib/localeRoutes";

import { trilhaShared } from "../trilhaAssets";
import { TRILHA_CHAPTERS, chapterKicker } from "./chapters";
import { useTrilhaJump } from "./jump";
import { LessonSection, PillLink, VideoFrame, trilhaSectionClass } from "./ui";

const YT_APRENDENDO_AGE = "https://www.youtube.com/embed/fT66Hc4XcRo";
const BATTLE_SIM = "https://www.aom-battlesimulator.net/#/";

export function IntroPanel() {
  const { t } = useTranslation();
  const jump = useTrilhaJump();
  const archaic = getTokenAssetUrl("aomr_archaic_age_icon");
  const wonder = getTokenAssetUrl("aomr_wonder_age_icon");
  const lessons = TRILHA_CHAPTERS.filter((chapter) => chapter.id !== "inicio");

  return (
    <section id="inicio" className={`${trilhaSectionClass} px-5 pb-8 pt-10 md:px-12 md:pt-16`}>
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-300/90">
            {t("pages.trilha.index.trilhaLabel")}
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-50 md:text-7xl">
            <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>{t("pages.trilha.index.titlePrefix")}</span>
              <span className="inline-flex items-center gap-3 text-amber-200">
                {t("pages.trilha.index.titleNoob")}
                {archaic ? <img src={archaic} alt="" className="h-12 w-12 object-contain md:h-16 md:w-16" /> : null}
              </span>
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>{t("pages.trilha.index.titleJoin")}</span>
              <span className="inline-flex items-center gap-3 text-sky-200">
                {t("pages.trilha.index.titlePro")}
                {wonder ? <img src={wonder} alt="" className="h-12 w-12 object-contain md:h-16 md:w-16" /> : null}
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-100 md:text-xl">
            {t("pages.trilha.index.pageDescription")}
          </p>
          <figure className="mt-8 flex items-center gap-4">
            <img
              src={trilhaShared("ScoobyManiaco_Perfil.webp")}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-300/50"
            />
            <figcaption className="text-lg leading-relaxed text-zinc-100">
              <span className="font-semibold text-amber-200">Scooby. </span>
              {t("pages.trilha.index.callout")}
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={() => jump("forcas")}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-zinc-50 px-7 py-3.5 text-lg font-semibold text-zinc-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {t("pages.trilha.deck.startCta")}
            <span aria-hidden>→</span>
          </button>
        </div>

        <ol className="divide-y divide-white/10 border-y border-white/10">
          {lessons.map((chapter, index) => (
            <li key={chapter.id}>
              <button
                type="button"
                onClick={() => jump(chapter.id)}
                className="group flex w-full items-start gap-4 py-4 text-left transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <span className="w-10 shrink-0 pt-0.5 font-[family-name:var(--font-display)] text-xl text-amber-200/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-medium text-zinc-50 md:text-xl">{t(chapter.titleKey)}</span>
                  <span className="mt-1 block text-base leading-relaxed text-zinc-300">{t(chapter.blurbKey)}</span>
                </span>
                <span aria-hidden className="pt-1 text-xl text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-amber-200">
                  →
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ErasPanel() {
  const { t, locale } = useTranslation();
  return (
    <LessonSection
      id="eras"
      slide
      center
      kicker={chapterKicker(t, "eras")}
      title={t("pages.trilha.index.step2")}
      lede={t("pages.trilha.index.step2Body")}
    >
      <PillLink to={localeSectionPath(locale, "eras")}>{t("pages.trilha.deck.openEras")}</PillLink>
    </LessonSection>
  );
}

export function UnidadesPanel() {
  const { t, locale } = useTranslation();
  return (
    <LessonSection
      id="unidades"
      slide
      center
      kicker={chapterKicker(t, "unidades")}
      title={t("pages.trilha.index.step3")}
      lede={t("pages.trilha.index.step3Body")}
    >
      <PillLink to={localeSectionPath(locale, "unidades")}>{t("pages.trilha.deck.openUnits")}</PillLink>
    </LessonSection>
  );
}

export function StartsPanel() {
  const { t, locale } = useTranslation();
  return (
    <LessonSection
      id="starts"
      slide
      center
      kicker={chapterKicker(t, "starts")}
      title={t("pages.trilha.index.step5")}
      lede={t("pages.trilha.index.step5Body")}
    >
      <PillLink to={localeSectionPath(locale, "starts")}>{t("pages.trilha.deck.openStarts")}</PillLink>
    </LessonSection>
  );
}

export function VideoPanel() {
  const { t } = useTranslation();
  const chapters = [
    t("pages.trilha.index.step7Chapter1"),
    t("pages.trilha.index.step7Chapter2"),
    t("pages.trilha.index.step7Chapter3"),
    t("pages.trilha.index.step7Chapter4"),
  ];

  return (
    <LessonSection
      id="video"
      center
      kicker={chapterKicker(t, "video")}
      title={t("pages.trilha.index.step7")}
      lede={t("pages.trilha.index.step7Body")}
    >
      <div className="mx-auto max-w-4xl text-left">
        <VideoFrame src={YT_APRENDENDO_AGE} title={t("pages.trilha.index.step7VideoTitle")} />
        <ol className="mt-8 space-y-3">
          {chapters.map((chapter, index) => (
            <li key={chapter} className="flex gap-4 text-lg text-zinc-100 md:text-xl">
              <span className="font-[family-name:var(--font-display)] text-amber-200">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{chapter}</span>
            </li>
          ))}
        </ol>
      </div>
    </LessonSection>
  );
}

export function SimPanel() {
  const { t } = useTranslation();
  return (
    <LessonSection
      id="simulador"
      slide
      center
      kicker={chapterKicker(t, "simulador")}
      title={t("pages.trilha.index.step8")}
      lede={
        <>
          <em>{t("pages.trilha.index.step8Credits")}</em> {t("pages.trilha.index.step8Desc")}
        </>
      }
    >
      <PillLink to={BATTLE_SIM} external>
        {t("pages.trilha.deck.openSim")}
      </PillLink>
    </LessonSection>
  );
}
