import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
/** Texto para `NotionText`: nome da era + `:token:` (campo `icon` em `eras.json`). */
export function formatEraNameForMetaNotion(era) {
    const t = era.icon?.trim();
    if (t && getTokenAssetUrl(t))
        return `${era.nome} :${t}:`;
    return era.nome;
}
