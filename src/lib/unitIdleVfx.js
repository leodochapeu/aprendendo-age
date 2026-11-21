import idleVfxJson from "@/data/unit_idle_vfx.json";
const table = idleVfxJson;
export function unitIdleVfx(unitId) {
    return table[String(unitId)] ?? [];
}
