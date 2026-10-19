import buildingVariantsJson from "@/data/building_variants.json";

export type VariantLabel = {
  pt: string;
  en: string;
};

export type BuildingUpgrade = {
  tag: string;
  rank: number;
  catalog?: string;
  icon?: string;
  label?: VariantLabel;
  pantheons: number[];
};

export type BuildingVariantSet = {
  pantheons: number[];
  upgrades?: BuildingUpgrade[];
  models: Record<string, Record<string, string>>;
};

const variants = buildingVariantsJson as Record<string, BuildingVariantSet>;

export function buildingVariants(id: number): BuildingVariantSet | undefined {
  const entry = variants[String(id)];
  if (!entry?.pantheons?.length || !entry.models) return undefined;
  return entry;
}

export function variantModelUrl(
  entry: BuildingVariantSet | undefined,
  pantheonId: number,
  upgrade: string | null,
  fallback?: string,
): string | undefined {
  const models = entry?.models[String(pantheonId)];
  if (!models) return fallback;
  return (upgrade && models[upgrade]) || models.base || fallback;
}
