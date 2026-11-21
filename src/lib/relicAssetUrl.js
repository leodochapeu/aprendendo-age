import { getIconFieldUrl } from "@/lib/notionTokenAssets";
/** URL pública do ícone da relíquia (`icon` em `reliquias.json`). */
export function getRelicAssetUrl(relic) {
    return getIconFieldUrl(relic?.icon);
}
