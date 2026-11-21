import { getIconFieldUrl } from "@/lib/notionTokenAssets";
/** URL pública do ícone do poder divino (`icon` em `godpowers.json`). */
export function getGodPowerAssetUrl(power) {
    return getIconFieldUrl(power?.icon);
}
