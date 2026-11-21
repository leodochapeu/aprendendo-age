import { useState } from "react";

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

function formatNum(value: number, locale: string): string {
  return value.toLocaleString(locale === "en" ? "en-US" : "pt-BR", { maximumFractionDigits: 2 });
}

function RealSideCalc({
  unit,
  title,
  titleClass,
  mark,
  targetHp,
  side,
  locale,
  ignoresArmor,
  perHit,
  noDamage,
  secondsLabel,
  hpLeftLabel,
}: {
  unit: Unidade;
  title: string;
  titleClass: string;
  mark: SideMark;
  targetHp: number;
  side: RealSide;
  locale: string;
  ignoresArmor: string;
  perHit: string;
  noDamage: string;
  secondsLabel: string;
  hpLeftLabel: string;
}) {
  const num = (value: number) => formatNum(value, locale);
  return (
    <div className="rounded-xl border border-white/15 bg-zinc-900/90 p-3">
      <SideIdentity unit={unit} title={title} titleClass={titleClass} mark={mark} />
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
        <span>{num(side.damagePerHit)}</span>
        <span className="text-zinc-400">×</span>
        <StatIcon token="aomr_rate_of_fire_icon" />
        <span>{num(side.attacksPerSecond)}</span>
        <span className="text-zinc-400">=</span>
        <span>{num(side.dps)}</span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-zinc-100">
        <StatIcon token="aomr_hit_points_icon" />
        <span>{num(targetHp)}</span>
        <span className="text-zinc-400">÷</span>
        <span>{num(side.dps)}</span>
        <span className="text-zinc-400">=</span>
        <span className="font-semibold text-amber-50">
          {side.secondsToKill == null ? noDamage : secondsLabel.replace("{{seconds}}", num(side.secondsToKill))}
        </span>
      </p>
      <p className="mt-1 text-xs text-zinc-300">{hpLeftLabel.replace("{{hp}}", num(side.hpRemaining))}</p>
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
  const armorIcon = ARMOR_ICON[channel.channel];
  const typeIcon = channel.matchedType ? TYPE_ICON[channel.matchedType] : undefined;
  return (
    <li className="text-sm text-zinc-100">
      <p className="flex flex-wrap items-center gap-1.5">
        <StatIcon token={CHANNEL_ICON[channel.channel]} />
        <span>{num(channel.baseDamage)}</span>
        {channel.multiplier !== 1 ? (
          <>
            <span className="text-zinc-400">×</span>
            <StatIcon token={typeIcon} />
            <span>{num(channel.multiplier)}</span>
            <span className="text-zinc-400">=</span>
            <span>{num(channel.boostedDamage)}</span>
          </>
        ) : null}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-zinc-300">
        {channel.armorPercent == null ? (
          <span>{ignoresArmor}</span>
        ) : (
          <>
            <StatIcon token={armorIcon} />
            <span>{num(channel.armorPercent)}%</span>
          </>
        )}
        <span className="text-zinc-500">→</span>
        <span className="font-semibold text-amber-50">
          {num(channel.damagePerHit)} {perHit}
        </span>
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
                locale={locale}
                ignoresArmor={t("pages.battle.ignoresArmor")}
                perHit={t("pages.battle.perHit")}
                noDamage={t("pages.battle.noDamage")}
                secondsLabel={t("pages.battle.secondsToFall")}
                hpLeftLabel={t("pages.battle.hpLeft")}
              />
              <RealSideCalc
                unit={defender}
                title={t("pages.battle.enemy")}
                titleClass="text-rose-200"
                mark={sideMark(duel.winner, "b")}
                targetHp={duel.sideA.hp}
                side={duel.sideB}
                locale={locale}
                ignoresArmor={t("pages.battle.ignoresArmor")}
                perHit={t("pages.battle.perHit")}
                noDamage={t("pages.battle.noDamage")}
                secondsLabel={t("pages.battle.secondsToFall")}
                hpLeftLabel={t("pages.battle.hpLeft")}
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
