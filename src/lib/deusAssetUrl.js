import { getIconFieldUrl, getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { deusById } from "@/data/catalog";
/**
 * Texto para `NotionText` / `MetaNotionLine`: nome + `:token:` do retrato, quando o JSON traz `icon`.
 */
export function formatGodNameForMetaNotion(deus) {
    if (!deus?.nome?.trim())
        return "";
    const t = deus.icon?.trim();
    if (t && getTokenAssetUrl(t))
        return `${deus.nome} :${t}:`;
    return deus.nome;
}
/**
 * Só o nome (string), sem objeto deus — resolve ícone via `deuses` por `deusById` (ex. `firstNumId(godpower.god)` em poderes) ou fica sem token.
 */
export function formatGodNameStringForMetaNotion(nome, godId) {
    if (!nome?.trim())
        return "";
    if (godId != null) {
        const d = deusById.get(godId);
        if (d)
            return formatGodNameForMetaNotion(d);
    }
    return nome;
}
/** URL pública do retrato do deus (`icon` em `deuses_aom.json`), ou `undefined` se inexistente. */
export function getDeusAssetUrl(deus) {
    return getIconFieldUrl(deus?.icon);
}
