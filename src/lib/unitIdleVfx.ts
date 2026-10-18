import idleVfxJson from "@/data/unit_idle_vfx.json";

export type IdleVfxKind =
  | "fire"
  | "eyes"
  | "glow"
  | "ring"
  | "smoke"
  | "mist"
  | "gas"
  | "aura"
  | "lightning"
  | "flies";

export type IdleVfxAnchor = {
  kind: IdleVfxKind;
  at: [number, number, number];
  size: number;
  tint: string;
};

const table = idleVfxJson as Record<string, IdleVfxAnchor[]>;

export function unitIdleVfx(unitId: number): IdleVfxAnchor[] {
  return table[String(unitId)] ?? [];
}
