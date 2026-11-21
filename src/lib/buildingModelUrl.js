import buildingModelsJson from "@/data/building_models.json";
const buildingModels = buildingModelsJson;
export function buildingModelUrl(id) {
    return buildingModels[String(id)];
}
