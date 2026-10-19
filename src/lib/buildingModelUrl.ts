import buildingModelsJson from "@/data/building_models.json";

const buildingModels = buildingModelsJson as Record<string, string>;

export function buildingModelUrl(id: number): string | undefined {
  return buildingModels[String(id)];
}
