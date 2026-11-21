import buildingVariantsJson from "@/data/building_variants.json";
const variants = buildingVariantsJson;
export function buildingVariants(id) {
    const entry = variants[String(id)];
    if (!entry?.pantheons?.length || !entry.models)
        return undefined;
    return entry;
}
export function variantModelUrl(entry, pantheonId, upgrade, fallback) {
    const models = entry?.models[String(pantheonId)];
    if (!models)
        return fallback;
    return (upgrade && models[upgrade]) || models.base || fallback;
}
