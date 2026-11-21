/** Converte `#RRGGBB` em `rgba(r,g,b,a)` para fundos semitransparentes. */
export function hexToRgba(hex, alpha) {
    const normalized = hex.trim();
    const match = /^#?([0-9A-Fa-f]{6})$/.exec(normalized.startsWith("#") ? normalized : `#${normalized}`);
    if (!match)
        return `rgba(245, 158, 11, ${alpha})`;
    const int = Number.parseInt(match[1], 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/** Cor do texto do badge sobre fundo escuro semitransparente — usa a cor da tag. */
export function tagBadgeTextColor(hex) {
    const normalized = hex.trim();
    const withHash = normalized.startsWith("#") ? normalized : `#${normalized}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(withHash))
        return withHash;
    return "#FDE68A";
}
