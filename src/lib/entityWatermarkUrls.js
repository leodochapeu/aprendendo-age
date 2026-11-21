import { getIconFieldUrl } from "@/lib/notionTokenAssets";
export function getMapaAssetUrl(m) {
    return getIconFieldUrl(m?.icon);
}
/**
 * Pré-visualização de mapa em `/assets/maps/previews/` (mesmo basename que o PNG em `/assets/maps/`).
 * Ver `getMapaAssetUrl` e `public/assets/maps/previews/`. Quando o ficheiro ainda não existe, passar
 * `backgroundCoverFallbackSrc` no `EntityCard` com o URL principal.
 */
export function getMapaPreviewUrl(m) {
    const u = getMapaAssetUrl(m);
    if (!u)
        return undefined;
    return u.replace("/assets/maps/", "/assets/maps/previews/");
}
/** Imagem 3D opcional, com o mesmo nome do asset principal em `/assets/maps/3d/`. */
export function getMapa3dUrl(m) {
    const u = getMapaAssetUrl(m);
    if (!u)
        return undefined;
    return u.replace("/assets/maps/", "/assets/maps/3d/");
}
export function getUnidadeAssetUrl(u) {
    return getIconFieldUrl(u?.icon);
}
export function getConstrucaoAssetUrl(c) {
    return getIconFieldUrl(c?.icon);
}
export function getAldeaoAssetUrl(a) {
    return getIconFieldUrl(a?.icon);
}
