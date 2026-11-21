import unitModelsJson from "@/data/unit_models.json";
import { projectionUrls, unitTechVisual } from "@/lib/unitModelTechs";

const unitModels = unitModelsJson as Record<string, string>;

export function unitModelUrl(id: number): string | undefined {
  return unitModels[String(id)];
}

/**
 * Modelo parado do hover. Heróis com espada e arco (ou dardo) vêm em peças:
 * o GLB inteiro mostra as duas armas ao mesmo tempo. A pose parada fica só com a arma de corte.
 */
export function idleModelUrls(id: number): string[] {
  const fallback = unitModelUrl(id);
  const visual = unitTechVisual(id);
  if (!visual?.stance) return fallback ? [fallback] : [];
  return projectionUrls(visual, [], fallback, "hack");
}
