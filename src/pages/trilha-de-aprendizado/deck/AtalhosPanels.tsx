import { useTranslation } from "@/hooks/useTranslation";

import { atalhosImg } from "../trilhaAssets";
import { chapterKicker } from "./chapters";
import { InlineToken, Keycap, KeyPlus, LessonSection, PullQuote, ShortcutCard, Shot, VideoFrame } from "./ui";

const YT_ATALHOS = "https://www.youtube.com/embed/CBp0iKE7bbA";
const YT_ATTACK_MOVE = "https://www.youtube.com/embed/dZd1QNiy99Q";

export function AtalhosIntroPanel() {
  const { t } = useTranslation();

  return (
    <LessonSection
      id="atalhos"
      kicker={chapterKicker(t, "atalhos")}
      title={t("pages.trilha.shortcuts.title")}
      lede={t("pages.trilha.shortcuts.description")}
    >
      <PullQuote tone="orange" icon={<span className="text-3xl">⚠️</span>}>
        <p>{t("pages.trilha.shortcuts.settingsWarning")}</p>
      </PullQuote>
      <Shot
        src={atalhosImg("Teclado_AoM_Atalhos.webp")}
        alt={t("pages.trilha.shortcuts.keyboardMapAlt")}
        className="mt-8"
      />
      <div className="mt-8 max-w-4xl">
        <VideoFrame src={YT_ATALHOS} title={t("pages.trilha.shortcuts.videoTitle")} />
      </div>
    </LessonSection>
  );
}

export function AtalhosSearchPanel() {
  const { t } = useTranslation();

  return (
    <LessonSection
      id="atalhos-busca"
      kicker={chapterKicker(t, "atalhos")}
      title={t("pages.trilha.shortcuts.findBuildingsTitle")}
    >
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="grid gap-4">
          <Shot src={atalhosImg("image.webp")} alt={t("pages.trilha.shortcuts.findBuildingsTitle")} />
          <Shot src={atalhosImg("image 1.webp")} alt="" />
        </div>
        <div className="space-y-5 text-lg leading-relaxed text-zinc-100 md:text-xl">
          <p>{t("pages.trilha.shortcuts.findBuildingsP1")}</p>
          <p>{t("pages.trilha.shortcuts.findBuildingsP2")}</p>
          <PullQuote>
            <p>{t("pages.trilha.shortcuts.findBuildingsTip")}</p>
          </PullQuote>
        </div>
      </div>

      <div className="mt-16 grid items-start gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
            {t("pages.trilha.shortcuts.findTroopsTitle")}
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.shortcuts.findTroopsP1")}</p>
        </div>
        <div className="grid gap-4">
          <Shot src={atalhosImg("image 2.webp")} alt={t("pages.trilha.shortcuts.findTroopsTitle")} />
          <Shot src={atalhosImg("image 3.webp")} alt="" />
        </div>
      </div>
    </LessonSection>
  );
}

export function AtalhosCommandsPanel() {
  const { t } = useTranslation();
  const space = t("pages.trilha.deck.keySpace");

  return (
    <LessonSection
      id="atalhos-comandos"
      kicker={chapterKicker(t, "atalhos")}
      title={t("pages.trilha.shortcuts.findAllTitle")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ShortcutCard
          title={
            <>
              {t("pages.trilha.shortcuts.tableAllProductionBuildings")}{" "}
              <InlineToken name="aomr_type_building_icon" /> <InlineToken name="aomr_type_human_soldier_icon" />{" "}
              <InlineToken name="aomr_type_myth_unit_icon" /> <InlineToken name="aomr_type_hero_icon" />
            </>
          }
          keys={
            <>
              <Keycap>Ctrl</Keycap>
              <KeyPlus />
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>{space}</Keycap>
            </>
          }
        />
        <ShortcutCard
          title={
            <>
              {t("pages.trilha.shortcuts.tableAllMilitaryUnits")} <InlineToken name="aomr_type_human_soldier_icon" />{" "}
              <InlineToken name="aomr_type_myth_unit_icon" /> <InlineToken name="aomr_type_hero_icon" />
            </>
          }
          keys={
            <>
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>Shift</Keycap>
              <KeyPlus />
              <Keycap>A</Keycap>
            </>
          }
        />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableUnitsOnScreen")}
          keys={
            <>
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>A</Keycap>
            </>
          }
        />
      </div>

      <h3 className="mt-16 font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
        {t("pages.trilha.shortcuts.garrisonTitle")}
      </h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableGarrisonEnter")}
          keys={<p className="text-2xl font-semibold text-zinc-50">{t("pages.trilha.shortcuts.tableGarrisonEnterHint")}</p>}
        />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableGarrisonEmpty")}
          hint={t("pages.trilha.shortcuts.tableGarrisonEmptyHint")}
          keys={
            <>
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>X</Keycap>
            </>
          }
        />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableRaidShelter")}
          keys={
            <>
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>C</Keycap>
            </>
          }
        />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableReturnWork")}
          hint={t("pages.trilha.shortcuts.tableGarrisonEmptyHint")}
          keys={
            <>
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>C</Keycap>
            </>
          }
        />
      </div>
    </LessonSection>
  );
}

export function AtalhosGroupsPanel() {
  const { t } = useTranslation();

  return (
    <LessonSection
      id="atalhos-grupos"
      kicker={chapterKicker(t, "atalhos")}
      title={t("pages.trilha.shortcuts.groupingTitle")}
      lede={t("pages.trilha.shortcuts.groupingP1")}
    >
      <Shot src={atalhosImg("image 4.webp")} alt={t("pages.trilha.shortcuts.groupingTitle")} className="max-w-xl" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ShortcutCard title={t("pages.trilha.shortcuts.tableSelectGroup")} keys={<Keycap>1–9</Keycap>} />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableCreateGroup")}
          keys={
            <>
              <Keycap>Ctrl</Keycap>
              <KeyPlus />
              <Keycap>1–9</Keycap>
            </>
          }
        />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableAddToGroup")}
          keys={
            <>
              <Keycap>Shift</Keycap>
              <KeyPlus />
              <Keycap>1–9</Keycap>
            </>
          }
        />
        <ShortcutCard
          title={t("pages.trilha.shortcuts.tableFocusGroup")}
          keys={
            <>
              <Keycap>Alt</Keycap>
              <KeyPlus />
              <Keycap>1–9</Keycap>
            </>
          }
        />
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50">
            {t("pages.trilha.shortcuts.quickSelectTitle")}
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.shortcuts.quickSelectP1")}</p>
          <p className="mt-3 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.shortcuts.quickSelectP2")}</p>
          <div className="mt-5">
            <Keycap>O</Keycap>
          </div>
          <Shot src={atalhosImg("image 5.webp")} alt={t("pages.trilha.shortcuts.quickSelectTitle")} className="mt-6" />
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50">
            {t("pages.trilha.shortcuts.portraitsTitle")}
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.shortcuts.portraitsP1")}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Keycap>Ctrl</Keycap>
            <Keycap>Shift</Keycap>
          </div>
          <Shot src={atalhosImg("image 6.webp")} alt={t("pages.trilha.shortcuts.portraitsTitle")} className="mt-6" />
        </div>
      </div>
    </LessonSection>
  );
}

export function AtalhosCombatPanel() {
  const { t } = useTranslation();

  return (
    <LessonSection
      id="atalhos-combate"
      kicker={chapterKicker(t, "atalhos")}
      title={t("pages.trilha.shortcuts.attackMoveTitle")}
      lede={t("pages.trilha.shortcuts.attackMoveP1")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Keycap>{t("pages.trilha.deck.keySpace")}</Keycap>
        <KeyPlus />
        <span className="text-2xl font-semibold text-zinc-50">{t("pages.trilha.deck.rightClick")}</span>
      </div>
      <video
        className="mt-8 max-h-[50vh] w-full max-w-xl rounded-3xl border border-white/10 bg-black"
        controls
        preload="none"
        src={atalhosImg("VID-20251119-WA0030.mp4")}
      >
        {t("pages.trilha.shortcuts.videoFallback")}
      </video>
      <div className="mt-6 max-w-4xl">
        <VideoFrame src={YT_ATTACK_MOVE} title={t("pages.trilha.shortcuts.attackMoveVideoTitle")} />
      </div>

      <div className="mt-16 max-w-3xl">
        <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
          {t("pages.trilha.shortcuts.patrolTitle")}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-zinc-100 md:text-xl">{t("pages.trilha.shortcuts.patrolP1")}</p>
        <div className="mt-5 flex items-center gap-2">
          <Keycap>Alt</Keycap>
          <KeyPlus />
          <Keycap>V</Keycap>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
          {t("pages.trilha.shortcuts.militarySelectTitle")}
        </h3>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-100 md:text-xl">
          {t("pages.trilha.shortcuts.militarySelectP1")}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Keycap>Alt</Keycap>
          <KeyPlus />
          <span className="text-2xl font-semibold text-zinc-50">{t("pages.trilha.deck.dragSelect")}</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Shot src={atalhosImg("image 7.webp")} alt={t("pages.trilha.shortcuts.militarySelectTitle")} />
          <Shot src={atalhosImg("image 8.webp")} alt="" />
        </div>
      </div>

      <div className="mt-16 grid items-start gap-8 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <Shot src={atalhosImg("image 9.webp")} alt={t("pages.trilha.shortcuts.productionQueueTitle")} />
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 md:text-4xl">
            {t("pages.trilha.shortcuts.productionQueueTitle")}
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-zinc-100 md:text-xl">
            {t("pages.trilha.shortcuts.productionQueueP1")}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ShortcutCard title={t("pages.trilha.shortcuts.tableCancelLast")} keys={<Keycap>Backspace</Keycap>} />
            <ShortcutCard
              title={t("pages.trilha.shortcuts.tableCancelQueue")}
              keys={
                <>
                  <Keycap>Shift</Keycap>
                  <KeyPlus />
                  <Keycap>Backspace</Keycap>
                </>
              }
            />
          </div>
        </div>
      </div>
    </LessonSection>
  );
}
