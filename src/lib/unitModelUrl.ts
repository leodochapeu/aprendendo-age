import unitModelsJson from "@/data/unit_models.json";

const unitModels = unitModelsJson as Record<string, string>;

export function unitModelUrl(id: number): string | undefined {
  return unitModels[String(id)];
}
