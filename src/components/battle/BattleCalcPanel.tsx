import { useState, type ReactNode } from "react";

import { BattleUnitPortrait } from "@/components/battle/BattleUnitPortrait";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import type { Unidade } from "@/data/catalog";
import { useTranslation } from "@/hooks/useTranslation";
import type { RealHitChannel, RealSide, TrainingDuel } from "@/lib/battleSimulator";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import { cn } from "@/lib/cn";
import type { BattleUnitTypeId, DamageChannel, MultiplierMatch } from "@/lib/battleSimulator/types";

type SideMark = "crown" | "skull" | null;

function sideMark(winner: "a" | "b" | "draw", side: "a" | "b"): SideMark {
  if (winner === "draw") return null;
  return winner === side ? "crown" : "skull";
}

function ResultMark({ mark }: { mark: SideMark }) {
  const { t } = useTranslation();
  if (!mark) return null;
  return (
    <span
      role="img"
      aria-label={mark === "crown" ? t("pages.battle.winnerMark") : t("pages.battle.loserMark")}
      className="text-base leading-none"
    >
      {mark === "crown" ? "👑" : "💀"}
    </span>
  );
}

function SideIdentity({
  unit,
  title,
  titleClass,
  mark,
}: {
  unit: Unidade;
  title: string;
  titleClass: string;
  mark: SideMark;
}) {
  return (
    <div className="flex items-center gap-3">
      <BattleUnitPortrait
        nome={unit.nome}
        icon={unit.icon}
        unitId={unit.id}
        size="sm"
        className={cn(
          "rounded-2xl",
          mark === "crown" && "border-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.45)]",
          mark === "skull" && "border-zinc-600 opacity-75 grayscale-[0.25]",
        )}
      />
      <div className="min-w-0">
        <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em]", titleClass)}>
          {title}
          <ResultMark mark={mark} />
        </p>
        <p className="truncate text-sm font-medium text-amber-50">{unit.nome}</p>
      </div>
    </div>
  );
}

const CHANNEL_ICON: Record<DamageChannel, string> = {
  cortante: "hackdamage",
  perfurante: "piercedamage",
  contundente: "crushdamage",
  divino: "aomr_divine_damage_icon",
  area: "attack_cur",
};

const ARMOR_ICON: Partial<Record<DamageChannel, string>> = {
  cortante: "hackarmor",
  perfurante: "piercearmor",
  contundente: "crusharmor",
};

const TYPE_ICON: Record<BattleUnitTypeId, string> = {
  infantaria: "aomr_type_infantry_icon",
  cavalaria: "aomr_type_cavalry_icon",
  artilharia: "aomr_type_archer_icon",
  heroi: "aomr_type_hero_icon",
  unidade_mitica: "aomr_type_myth_unit_icon",
  soldado_humano: "aomr_type_human_soldier_icon",
  construcao: "aomr_type_building_icon",
  aldeao: "aomr_type_villager_icon",
  voador: "aomr_type_flying_unit_icon",
  barco: "aomr_type_ship_icon",
  cerco: "aomr_type_siege_weapon_icon",
  tita: "aomr_type_titan_icon",
  outro: "aomr_type_human_soldier_icon",
};

function StatIcon({ token }: { token?: string | null }) {
  const src = token ? getIconFieldUrl(token) : undefined;
  if (!src) return null;
  return <img src={src} alt="" aria-hidden className="inline size-4 shrink-0 object-contain align-[-2px]" />;
}

const CHANNEL_HINT: Record<DamageChannel, string> = {
  cortante: "pages.battle.hintHack",
  perfurante: "pages.battle.hintPierce",
  contundente: "pages.battle.hintCrush",
  divino: "pages.battle.hintDivine",
  area: "pages.battle.hintArea",
};

const ARMOR_HINT: Partial<Record<DamageChannel, string>> = {
  cortante: "pages.battle.hintHackArmor",
  perfurante: "pages.battle.hintPierceArmor",
  contundente: "pages.battle.hintCrushArmor",
};

function Hint({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span tabIndex={0} className="group/hint relative inline-flex items-center gap-1 outline-none">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-40 w-max max-w-52 rounded-lg border border-amber-200/35 bg-[#1a1612] px-2 py-1 text-left text-[11px] font-medium leading-snug text-amber-50 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-opacity group-hover/hint:opacity-100 group-focus-within/hint:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function formatNum(value: number, locale: string): string {
  return value.toLocaleString(locale === "en" ? "en-US" : "pt-BR", { maximumFractionDigits: 2 });
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, value), template);
}

function ApproachLine({
  side,
  opponent,
  num,
  opensAtRange,
  secondsToReach,
  neverReaches,
  bothInRange,
}: {
  side: RealSide;
  opponent: RealSide;
  num: (value: number) => string;
  opensAtRange: string;
  secondsToReach: string;
  neverReaches: string;
  bothInRange: string;
}) {
  const { t } = useTranslation();
  const opponentWalks = opponent.attackDelay != null && opponent.attackDelay > 0;
  if (side.attackDelay === 0 && opponentWalks) {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-amber-50">
        <Hint text={t("pages.battle.hintRange")}>
          <StatIcon token="rangeicon" />
          <span>{fill(opensAtRange, { range: num(side.range) })}</span>
        </Hint>
      </p>
    );
  }
  if (side.attackDelay == null) {
    return <p className="mt-2 text-sm text-zinc-300">{neverReaches}</p>;
  }
  if (side.attackDelay > 0) {
    const distance = Math.max(0, opponent.range - side.range);
    return (
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-zinc-100">
        <Hint text={t("pages.battle.hintRange")}>
          <StatIcon token="rangeicon" />
          <span>{num(distance)}</span>
        </Hint>
        <span className="text-zinc-400">÷</span>
        <Hint text={t("pages.battle.hintMoveSpeed")}>
          <StatIcon token="aomr_speed_icon" />
          <span>{num(side.moveSpeed)}</span>
        </Hint>
        <span className="text-zinc-400">=</span>
        <span className="font-semibold text-amber-50">{fill(secondsToReach, { seconds: num(side.attackDelay) })}</span>
      </p>
    );
  }
  if (side.ranged && opponent.ranged) {
    return <p className="mt-2 text-sm text-zinc-300">{bothInRange}</p>;
  }
  return null;
}

function RealSideCalc({
  unit,
  title,
  titleClass,
  mark,
  targetHp,
  side,
  opponent,
  locale,
  ignoresArmor,
  perHit,
  noDamage,
  secondsLabel,
  approachSecondsLabel,
  hpLeftLabel,
  opensAtRange,
  secondsToReach,
  neverReaches,
  bothInRange,
}: {
  unit: Unidade;
  title: string;
  titleClass: string;
  mark: SideMark;
  targetHp: number;
  side: RealSide;
  opponent: RealSide;
  locale: string;
  ignoresArmor: string;
  perHit: string;
  noDamage: string;
  secondsLabel: string;
  approachSecondsLabel: string;
  hpLeftLabel: string;
  opensAtRange: string;
  secondsToReach: string;
  neverReaches: string;
  bothInRange: string;
}) {
  const { t } = useTranslation();
  const num = (value: number) => formatNum(value, locale);
  const walkedFirst = side.attackDelay != null && side.attackDelay > 0 && side.secondsToKill != null;
  return (
    <div className="rounded-xl border border-white/15 bg-zinc-900/90 p-3">
      <SideIdentity unit={unit} title={title} titleClass={titleClass} mark={mark} />
      <ApproachLine
        side={side}
        opponent={opponent}
        num={num}
        opensAtRange={opensAtRange}
        secondsToReach={secondsToReach}
        neverReaches={neverReaches}
        bothInRange={bothInRange}
      />
      {side.channels.length === 0 ? <p className="mt-2 text-sm text-zinc-300">{noDamage}</p> : null}
      <ul className="mt-2 space-y-2">
        {side.channels.map((channel) => (
          <ChannelRow
            key={channel.channel}
            channel={channel}
            num={num}
            ignoresArmor={ignoresArmor}
            perHit={perHit}
          />
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-zinc-100">
        <Hint text={t("pages.battle.hintPerHit")}>
          <span>{num(side.damagePerHit)}</span>
        </Hint>
        <span className="text-zinc-400">×</span>
        <Hint text={t("pages.battle.hintAttackSpeed")}>
          <StatIcon token="aomr_rate_of_fire_icon" />
          <span>{num(side.attacksPerSecond)}</span>
        </Hint>
        <span className="text-zinc-400">=</span>
        <Hint text={t("pages.battle.hintDps")}>
          <span>{num(side.dps)}</span>
        </Hint>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-zinc-100">
        <Hint text={t("pages.battle.hintHitPoints")}>
          <StatIcon token="aomr_hit_points_icon" />
          <span>{num(targetHp)}</span>
        </Hint>
        <span className="text-zinc-400">÷</span>
        <Hint text={t("pages.battle.hintDps")}>
          <span>{num(side.dps)}</span>
        </Hint>
        <span className="text-zinc-400">=</span>
        <Hint text={t("pages.battle.hintTimeToFall")}>
          <span className="font-semibold text-amber-50">
            {side.secondsToKill == null ? noDamage : secondsLabel.replace("{{seconds}}", num(side.secondsToKill))}
          </span>
        </Hint>
      </p>
      {walkedFirst ? (
        <p className="mt-1 text-sm font-semibold text-amber-50">
          {fill(approachSecondsLabel, {
            delay: num(side.attackDelay ?? 0),
            seconds: num(side.secondsToKill ?? 0),
            total: num(side.secondsFromStart ?? side.secondsToKill ?? 0),
          })}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-zinc-300">
        <Hint text={t("pages.battle.hintHpLeft")}>{hpLeftLabel.replace("{{hp}}", num(side.hpRemaining))}</Hint>
      </p>
    </div>
  );
}

function ChannelRow({
  channel,
  num,
  ignoresArmor,
  perHit,
}: {
  channel: RealHitChannel;
  num: (value: number) => string;
  ignoresArmor: string;
  perHit: string;
}) {
  const { t } = useTranslation();
  const armorIcon = ARMOR_ICON[channel.channel];
  const armorHint = ARMOR_HINT[channel.channel];
  const typeIcon = channel.matchedType ? TYPE_ICON[channel.matchedType] : undefined;
  const typeLabel = channel.matchedType ? t(`pages.battle.hintType.${channel.matchedType}`) : "";
  return (
    <li className="text-sm text-zinc-100">
      <p className="flex flex-wrap items-center gap-1.5">
        <Hint text={t(CHANNEL_HINT[channel.channel])}>
          <StatIcon token={CHANNEL_ICON[channel.channel]} />
          <span>{num(channel.baseDamage)}</span>
        </Hint>
        {channel.multiplier !== 1 ? (
          <>
            <span className="text-zinc-400">×</span>
            <Hint text={t("pages.battle.hintMultiplier", { type: typeLabel })}>
              <StatIcon token={typeIcon} />
              <span>{num(channel.multiplier)}</span>
            </Hint>
            <span className="text-zinc-400">=</span>
            <span>{num(channel.boostedDamage)}</span>
          </>
        ) : null}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-zinc-300">
        {channel.armorPercent == null ? (
          <span>{ignoresArmor}</span>
        ) : (
          <Hint text={armorHint ? t(armorHint) : t("pages.battle.ignoresArmor")}>
            <StatIcon token={armorIcon} />
            <span>{num(channel.armorPercent)}%</span>
          </Hint>
        )}
        <span className="text-zinc-500">→</span>
        <Hint text={t("pages.battle.hintPerHit")}>
          <span className="font-semibold text-amber-50">
            {num(channel.damagePerHit)} {perHit}
          </span>
        </Hint>
      </p>
    </li>
  );
}

export function BattleCalcPanel({
  duel,
  attacker,
  defender,
  defaultOpen = false,
}: {
  duel: TrainingDuel;
  attacker: Unidade;
  defender: Unidade;
  defaultOpen?: boolean;
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const num = (value: number) => formatNum(value, locale);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-xl border border-amber-200/40 bg-black/30 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-amber-200/70 hover:bg-black/45"
      >
        {open ? t("pages.battle.hideCalc") : t("pages.battle.showCalc")}
      </button>
      {open ? (
        <div className="mt-3">
          {duel.mode === "category" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-zinc-900/90 p-3">
                <SideIdentity
                  unit={attacker}
                  title={t("pages.battle.you")}
                  titleClass="text-emerald-200"
                  mark={sideMark(duel.winner, "a")}
                />
                <div className="mt-2">
                  <UnidadeTipoLine tipo={attacker.tipo} colored />
                </div>
                {duel.sameType ? null : (
                  <MultiplierLine match={duel.sideA} num={num} neutral={t("pages.battle.calcNeutral")} />
                )}
              </div>
              <div className="rounded-xl border border-white/15 bg-zinc-900/90 p-3">
                <SideIdentity
                  unit={defender}
                  title={t("pages.battle.enemy")}
                  titleClass="text-rose-200"
                  mark={sideMark(duel.winner, "b")}
                />
                <div className="mt-2">
                  <UnidadeTipoLine tipo={defender.tipo} colored />
                </div>
                {duel.sameType ? null : (
                  <MultiplierLine match={duel.sideB} num={num} neutral={t("pages.battle.calcNeutral")} />
                )}
              </div>
              <p className="sm:col-span-2 text-sm text-amber-50">
                {duel.sameType ? t("pages.battle.sameTypeDraw") : t("pages.battle.typeAdvantage")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              <RealSideCalc
                unit={attacker}
                title={t("pages.battle.you")}
                titleClass="text-emerald-200"
                mark={sideMark(duel.winner, "a")}
                targetHp={duel.sideB.hp}
                side={duel.sideA}
                opponent={duel.sideB}
                locale={locale}
                ignoresArmor={t("pages.battle.ignoresArmor")}
                perHit={t("pages.battle.perHit")}
                noDamage={t("pages.battle.noDamage")}
                secondsLabel={t("pages.battle.secondsToFall")}
                approachSecondsLabel={t("pages.battle.secondsWithApproach")}
                hpLeftLabel={t("pages.battle.hpLeft")}
                opensAtRange={t("pages.battle.opensAtRange")}
                secondsToReach={t("pages.battle.secondsToReach")}
                neverReaches={t("pages.battle.neverReaches")}
                bothInRange={t("pages.battle.bothInRange")}
              />
              <RealSideCalc
                unit={defender}
                title={t("pages.battle.enemy")}
                titleClass="text-rose-200"
                mark={sideMark(duel.winner, "b")}
                targetHp={duel.sideA.hp}
                side={duel.sideB}
                opponent={duel.sideA}
                locale={locale}
                ignoresArmor={t("pages.battle.ignoresArmor")}
                perHit={t("pages.battle.perHit")}
                noDamage={t("pages.battle.noDamage")}
                secondsLabel={t("pages.battle.secondsToFall")}
                approachSecondsLabel={t("pages.battle.secondsWithApproach")}
                hpLeftLabel={t("pages.battle.hpLeft")}
                opensAtRange={t("pages.battle.opensAtRange")}
                secondsToReach={t("pages.battle.secondsToReach")}
                neverReaches={t("pages.battle.neverReaches")}
                bothInRange={t("pages.battle.bothInRange")}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MultiplierLine({
  match,
  num,
  neutral,
}: {
  match: MultiplierMatch;
  num: (value: number) => string;
  neutral: string;
}) {
  if (match.factor === 1 || !match.matchedType) {
    return <p className="mt-2 text-sm text-zinc-300">{neutral}</p>;
  }
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-amber-50">
      <span>×</span>
      <StatIcon token={TYPE_ICON[match.matchedType]} />
      <span className="font-semibold">{num(match.factor)}</span>
    </p>
  );
}
