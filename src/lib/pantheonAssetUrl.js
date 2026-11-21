import { getIconFieldUrl, getTokenAssetUrl } from "@/lib/notionTokenAssets";
/** Arte de capa no card de listagem (`EntityCard` `backgroundCoverSrc`); ver `panteoes.json` `hero_background`. */
export function getPantheonHeroBackgroundUrl(panteao) {
    const s = panteao.hero_background?.trim();
    return s || undefined;
}
/** Marca d’água do card de panteão. */
export function getPantheonWatermarkUrl(panteao) {
    return getIconFieldUrl(panteao?.icon);
}
/** Texto para `NotionText`: nome do panteão + `:token:`. */
export function formatPantheonNameForMetaNotion(panteao) {
    if (!panteao?.nome?.trim())
        return "";
    const t = panteao.icon?.trim();
    if (t && getTokenAssetUrl(t))
        return `${panteao.nome} :${t}:`;
    return panteao.nome;
}
