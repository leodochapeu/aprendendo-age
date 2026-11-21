import unitModelsJson from "@/data/unit_models.json";
const unitModels = unitModelsJson;
export function unitModelUrl(id) {
    return unitModels[String(id)];
}
