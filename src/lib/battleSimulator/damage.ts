import type { Unidade } from "@/data/catalog";
import { resolveBestMultiplier } from "./classification";
import type {
  DamageChannel,
  DamageChannelBreakdown,
  DirectionalDamage,
} from "./types";

type ChannelSpec = {
  channel: DamageChannel;
  baseDamage: number;
  /** Armadura percentual do defensor contra este canal; `null` = sem redução. */
  armorPercent: number | null;
};

function clampArmorPercent(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function armorMitigation(armorPercent: number): number {
  return 1 - armorPercent / 100;
}

/** Lista canais de dano presentes no atacante e a armadura correspondente do defensor. */
export function listDamageChannels(
  attacker: Unidade,
  defender: Unidade,
): ChannelSpec[] {
  const channels: ChannelSpec[] = [];

  if (attacker.dano_cortante != null && attacker.dano_cortante > 0) {
    channels.push({
      channel: "cortante",
      baseDamage: attacker.dano_cortante,
      armorPercent: clampArmorPercent(defender.armadura_anticorte),
    });
  }
  if (attacker.dano_perfurante != null && attacker.dano_perfurante > 0) {
    channels.push({
      channel: "perfurante",
      baseDamage: attacker.dano_perfurante,
      armorPercent: clampArmorPercent(defender.armadura_antiperfurante),
    });
  }
  const crushArmor = clampArmorPercent(defender.armadura_anticontusao);
  if (attacker.dano_contundente != null && attacker.dano_contundente > 0) {
    channels.push({
      channel: "contundente",
      baseDamage: attacker.dano_contundente,
      armorPercent: crushArmor,
    });
  }
  // Alias legado no JSON (ex.: Escaravelho) — só se contundente não estiver presente.
  if (
    attacker.dano_contusao != null &&
    attacker.dano_contusao > 0 &&
    (attacker.dano_contundente == null || attacker.dano_contundente <= 0)
  ) {
    channels.push({
      channel: "contundente",
      baseDamage: attacker.dano_contusao,
      armorPercent: crushArmor,
    });
  }
  if (attacker.dano_divino != null && attacker.dano_divino > 0) {
    channels.push({
      channel: "divino",
      baseDamage: attacker.dano_divino,
      armorPercent: null,
    });
  }
  if (attacker.dano_area != null && attacker.dano_area > 0) {
    channels.push({
      channel: "area",
      baseDamage: attacker.dano_area,
      armorPercent: null,
    });
  }

  return channels;
}

/**
 * DPS efetivo de um canal:
 * `base × multiplicador × ataques/s × (1 − armadura/100)`.
 */
export function channelEffectiveDps(
  baseDamage: number,
  multiplier: number,
  attacksPerSecond: number,
  armorPercent: number | null,
): number {
  const armor = armorPercent == null ? 0 : clampArmorPercent(armorPercent);
  return baseDamage * multiplier * attacksPerSecond * armorMitigation(armor);
}

/** Calcula o dano direcional atacante → defensor (por unidade). */
export function computeDirectionalDamage(
  attacker: Unidade,
  defender: Unidade,
): DirectionalDamage {
  const multiplier = resolveBestMultiplier(attacker, defender);
  const attacksPerSecond = Math.max(0, attacker.velocidade_de_ataque_atk_s ?? 0);
  const specs = listDamageChannels(attacker, defender);

  const channels: DamageChannelBreakdown[] = specs.map((spec) => {
    const armorPercent = spec.armorPercent ?? 0;
    const effectiveDps = channelEffectiveDps(
      spec.baseDamage,
      multiplier.factor,
      attacksPerSecond,
      spec.armorPercent,
    );
    return {
      channel: spec.channel,
      baseDamage: spec.baseDamage,
      multiplier: multiplier.factor,
      attacksPerSecond,
      armorPercent,
      effectiveDps,
    };
  });

  const effectiveDpsPerUnit = channels.reduce((sum, c) => sum + c.effectiveDps, 0);

  return {
    multiplier,
    channels,
    effectiveDpsPerUnit,
  };
}
