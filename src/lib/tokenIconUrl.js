import tokenAssetMap from "@/data/token_asset_map.json";
/** Chave em `token_asset_map.json` ou caminho já absoluto (`/assets/...`). */
export function resolveTokenIconSrc(icon) {
    if (icon.startsWith("/"))
        return icon;
    const v = tokenAssetMap[icon];
    return typeof v === "string" ? v : undefined;
}
