import { getIconFieldUrl } from "@/lib/notionTokenAssets";
/** URL pública do ícone de era (`icon` em `eras.json`). */
export function getEraAssetUrl(era) {
    return getIconFieldUrl(era?.icon);
}
