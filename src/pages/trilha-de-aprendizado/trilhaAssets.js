/**
 * Imagens exclusivas da trilha (screenshots, diagramas do Notion) em
 * `public/trilha-de-aprendizado/`. Ícones do jogo usam `getTokenAssetUrl` + `token_asset_map.json`.
 */
export function tiposImg(file) {
    return `/trilha-de-aprendizado/tipos-unidades-multiplicadores/${encodeURIComponent(file)}`;
}
export function atalhosImg(file) {
    return `/trilha-de-aprendizado/atalhos-importantes/${encodeURIComponent(file)}`;
}
export function rushTurtleBoomarImg(file) {
    return `/trilha-de-aprendizado/rush-turtle-boomar/${encodeURIComponent(file)}`;
}
/** Avatar / arte que não existe em `/assets` (mapa de tokens). */
export function trilhaShared(file) {
    return `/trilha-de-aprendizado/shared/${encodeURIComponent(file)}`;
}
