import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { localeSectionPath } from "@/lib/localeRoutes";

import { chapterKicker } from "./chapters";
import { BigToken, InlineToken, LessonSection, PullQuote, Shot, VideoFrame } from "./ui";
import { tiposImg, trilhaShared } from "../trilhaAssets";

const YT_MICRAGEM = "https://www.youtube.com/embed/zE27Ehwk3Cs";

function MatchupRow({
  from,
  fromToken,
  to,
  toToken,
  fromClass,
}: {
  from: string;
  fromToken: string;
  to: string;
  toToken: string;
  fromClass: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:gap-6 md:p-5">
      <BigToken name={fromToken} className="h-14 w-14 md:h-16 md:w-16" />
      <div className="min-w-0 flex-1">
        <p className={`text-xl font-semibold md:text-2xl ${fromClass}`}>{from}</p>
        <p className="mt-1 text-lg text-zinc-200">
          {t("pages.trilha.deck.beats")} <span className="text-zinc-50">{to}</span>
        </p>
      </div>
      <span className="text-3xl text-zinc-500" aria-hidden>
        →
      </span>
      <BigToken name={toToken} className="h-14 w-14 md:h-16 md:w-16" />
    </div>
  );
}

export function ForcasMultipliersPanel() {
  const { t, locale } = useTranslation();
  const factor = locale === "en" ? "1.25" : "1,25";

  return (
    <LessonSection
      id="forcas"
      kicker={chapterKicker(t, "forcas")}
      title={t("pages.trilha.multipliers.title")}
      lede={t("pages.trilha.multipliers.introP1")}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-amber-300/25 bg-amber-950/25 p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
            {t("pages.trilha.deck.softLabel")}
          </p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-6xl text-amber-100 md:text-7xl">{factor}×</p>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 font-[family-name:var(--font-display)] text-4xl text-zinc-50 md:text-5xl">
            <span>8</span>
            <span className="text-2xl text-zinc-500">×</span>
            <span className="text-amber-200">{factor}</span>
            <span className="text-2xl text-zinc-500">=</span>
            <span>10</span>
          </p>
          <p className="mt-5 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.multipliers.introP2a")}</p>
          <Shot
            src={tiposImg("image.webp")}
            alt={t("pages.trilha.multipliers.hoplitePanelAlt")}
            className="mx-auto mt-6 max-w-sm"
          />
        </article>

        <article className="rounded-3xl border border-rose-400/35 bg-rose-950/30 p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-200">
            {t("pages.trilha.deck.hardLabel")}
          </p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-6xl text-rose-100 md:text-7xl">5×</p>
          <p className="mt-5 font-[family-name:var(--font-display)] text-4xl text-zinc-50 md:text-5xl">30</p>
          <p className="mt-5 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.multipliers.introP3")}</p>
          <Shot
            src={tiposImg("image 1.webp")}
            alt={t("pages.trilha.multipliers.hippeusAlt")}
            className="mx-auto mt-6 max-w-sm"
          />
        </article>
      </div>
    </LessonSection>
  );
}

export function ForcasCyclePanel() {
  const { t } = useTranslation();
  const infantry = t("pages.trilha.multipliers.infantryLabel");
  const cavalry = t("pages.trilha.multipliers.cavalryLabel");
  const archers = t("pages.trilha.multipliers.archersLabel");

  return (
    <LessonSection
      id="forcas-ciclo"
      kicker={chapterKicker(t, "forcas")}
      title={t("pages.trilha.multipliers.humanSoldiersTitle")}
      lede={t("pages.trilha.multipliers.humanSoldiersIntro")}
    >
      <div className="grid gap-4">
        <MatchupRow
          from={infantry}
          fromToken="aomr_type_infantry_icon"
          to={cavalry}
          toToken="aomr_type_cavalry_icon"
          fromClass="text-red-300"
        />
        <MatchupRow
          from={cavalry}
          fromToken="aomr_type_cavalry_icon"
          to={archers}
          toToken="aomr_type_archer_icon"
          fromClass="text-teal-300"
        />
        <MatchupRow
          from={archers}
          fromToken="aomr_type_archer_icon"
          to={infantry}
          toToken="aomr_type_infantry_icon"
          fromClass="text-sky-300"
        />
      </div>

      <div className="mt-8 grid items-center gap-4 text-lg text-zinc-100 md:grid-cols-3 md:text-xl">
        <p>
          <InlineToken name="aomr_type_infantry_icon" />{" "}
          <span className="font-semibold text-red-300">{infantry}</span> {t("pages.trilha.multipliers.infantryDesc")}
        </p>
        <p>
          <InlineToken name="aomr_type_cavalry_icon" />{" "}
          <span className="font-semibold text-teal-300">{cavalry}</span> {t("pages.trilha.multipliers.cavalryDesc")}
        </p>
        <p>
          <InlineToken name="aomr_type_archer_icon" />{" "}
          <span className="font-semibold text-sky-300">{archers}</span> {t("pages.trilha.multipliers.archersDesc")}
        </p>
      </div>

      <Shot
        src={tiposImg("Militares_Beneficios.webp")}
        alt={t("pages.trilha.multipliers.triangleDiagramAlt")}
        className="mx-auto mt-10 max-w-xl"
      />

      <div className="mt-10">
        <PullQuote
          icon={
            <img
              src={trilhaShared("ScoobyManiaco_Perfil.webp")}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          }
        >
          <p>{t("pages.trilha.multipliers.scoobyCallout")}</p>
        </PullQuote>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Shot src={tiposImg("Contra_-Mitica.webp")} alt="" className="max-w-sm" />
        <Shot src={tiposImg("Elementos_Primarios.webp")} alt="" className="max-w-sm" />
      </div>
    </LessonSection>
  );
}

function RoleCard({
  token,
  title,
  body,
  image,
  imageAlt,
}: {
  token: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <article className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
      <BigToken name={token} />
      <h3 className="mt-5 font-[family-name:var(--font-display)] text-3xl text-zinc-50">{title}</h3>
      <p className="mt-3 text-lg leading-relaxed text-zinc-100 md:text-xl">{body}</p>
      {image ? <Shot src={image} alt={imageAlt ?? ""} className="mt-6" /> : null}
    </article>
  );
}

export function ForcasRolesPanel() {
  const { t } = useTranslation();

  return (
    <LessonSection id="forcas-papeis" kicker={chapterKicker(t, "forcas")} title={t("pages.trilha.deck.rolesTitle")}>
      <div className="grid gap-5 lg:grid-cols-2">
        <RoleCard
          token="aomr_type_myth_unit_icon"
          title={t("pages.trilha.multipliers.mythUnitsTitle")}
          body={t("pages.trilha.multipliers.mythUnitsDesc")}
          image={tiposImg("image 2.webp")}
        />
        <RoleCard
          token="aomr_type_hero_icon"
          title={t("pages.trilha.multipliers.heroesTitle")}
          body={t("pages.trilha.multipliers.heroesDesc")}
          image={tiposImg("image 3.webp")}
        />
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <BigToken name="aomr_type_archer_ship_icon" className="h-14 w-14" />
            <span className="text-2xl text-zinc-500" aria-hidden>
              →
            </span>
            <BigToken name="aomr_type_close_combat_ship_icon" className="h-14 w-14" />
            <span className="text-2xl text-zinc-500" aria-hidden>
              →
            </span>
            <BigToken name="aomr_type_siege_ship_icon" className="h-14 w-14" />
          </div>
          <h3 className="mt-5 font-[family-name:var(--font-display)] text-3xl text-zinc-50">
            {t("pages.trilha.multipliers.navalTitle")}
          </h3>
          <p className="mt-3 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.multipliers.navalDesc")}</p>
          <ol className="mt-5 flex flex-wrap gap-2 text-base font-medium text-zinc-100">
            <li className="rounded-full bg-sky-950/70 px-3 py-1.5">{t("pages.trilha.deck.navalArrow")}</li>
            <li className="rounded-full bg-teal-950/70 px-3 py-1.5">{t("pages.trilha.deck.navalMelee")}</li>
            <li className="rounded-full bg-amber-950/70 px-3 py-1.5">{t("pages.trilha.deck.navalSiege")}</li>
          </ol>
          <Shot
            src={tiposImg("Barcos_Beneficios.webp")}
            alt={t("pages.trilha.multipliers.navalDiagramAlt")}
            className="mx-auto mt-6 max-w-md"
          />
        </article>
        <RoleCard
          token="aomr_type_siege_weapon_icon"
          title={t("pages.trilha.multipliers.siegeTitle")}
          body={t("pages.trilha.multipliers.siegeDesc")}
        />
      </div>
    </LessonSection>
  );
}

function StatCard({ token, title, body, tone }: { token: string; title: string; body: string; tone: string }) {
  return (
    <article className={`rounded-3xl border p-6 md:p-8 ${tone}`}>
      <BigToken name={token} />
      <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl text-zinc-50 md:text-3xl">{title}</h3>
      <p className="mt-3 text-lg leading-relaxed text-zinc-100">{body}</p>
    </article>
  );
}

export function ForcasDamagePanel() {
  const { t, locale } = useTranslation();

  return (
    <LessonSection
      id="forcas-dano"
      kicker={chapterKicker(t, "forcas")}
      title={t("pages.trilha.multipliers.damageTypesTitle")}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          token="hackdamage"
          title={t("pages.trilha.multipliers.hackDamageTitle")}
          body={t("pages.trilha.multipliers.hackDamageDesc")}
          tone="border-red-400/30 bg-red-950/35"
        />
        <StatCard
          token="piercedamage"
          title={t("pages.trilha.multipliers.pierceDamageTitle")}
          body={t("pages.trilha.multipliers.pierceDamageDesc")}
          tone="border-sky-400/30 bg-sky-950/35"
        />
        <StatCard
          token="crushdamage"
          title={t("pages.trilha.multipliers.crushDamageTitle")}
          body={t("pages.trilha.multipliers.crushDamageDesc")}
          tone="border-amber-400/30 bg-amber-950/30"
        />
      </div>

      <div className="mt-14">
        <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
          {t("pages.trilha.multipliers.defensesTitle")}
        </h3>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-100 md:text-xl">
          {t("pages.trilha.multipliers.defensesIntro")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 font-[family-name:var(--font-display)] text-4xl text-zinc-50 md:text-5xl">
          <span className="rounded-2xl bg-red-950/70 px-4 py-3 text-red-100">10</span>
          <span className="text-2xl text-zinc-500">×</span>
          <span className="rounded-2xl bg-zinc-800 px-4 py-3">50%</span>
          <span className="text-2xl text-zinc-500">=</span>
          <span className="rounded-2xl bg-zinc-50 px-4 py-3 text-zinc-950">5</span>
        </div>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-200 md:text-xl">
          {t("pages.trilha.multipliers.defensesExample")}
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <StatCard
          token="hackarmor"
          title={t("pages.trilha.multipliers.hackArmorTitle")}
          body={t("pages.trilha.multipliers.hackArmorDesc")}
          tone="border-red-400/25 bg-red-950/25"
        />
        <StatCard
          token="piercearmor"
          title={t("pages.trilha.multipliers.pierceArmorTitle")}
          body={t("pages.trilha.multipliers.pierceArmorDesc")}
          tone="border-sky-400/25 bg-sky-950/25"
        />
        <StatCard
          token="crusharmor"
          title={t("pages.trilha.multipliers.crushArmorTitle")}
          body={t("pages.trilha.multipliers.crushArmorDesc")}
          tone="border-white/10 bg-zinc-900/60"
        />
      </div>

      <div className="mt-14">
        <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
          {t("pages.trilha.multipliers.categoriesTitle")}
        </h3>
        <Shot
          src={tiposImg("image 4.webp")}
          alt={t("pages.trilha.multipliers.categoriesAlt")}
          className="mt-6"
        />
      </div>

      <div className="mt-10 max-w-4xl">
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-zinc-50">
          {t("pages.trilha.multipliers.videoTitle")}
        </h3>
        <VideoFrame src={YT_MICRAGEM} title={t("pages.trilha.multipliers.videoIframeTitle")} />
        <p className="mt-6 text-lg text-zinc-200">
          {t("pages.trilha.multipliers.spreadsheetLinkBefore")}
          <Link
            to={localeSectionPath(locale, "unidades")}
            className="font-semibold text-amber-200 underline decoration-amber-400/50 underline-offset-4 hover:text-amber-50"
          >
            {t("pages.trilha.index.step3CardTitle")}
          </Link>
          {t("pages.trilha.multipliers.spreadsheetLinkAfter")}
        </p>
      </div>
    </LessonSection>
  );
}
