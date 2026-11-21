/** Tenta obter um único número a partir de valores vindos do catálogo (string ou number). */
export function parseGameNumber(value) {
    if (value == null || value === "")
        return null;
    if (typeof value === "number" && Number.isFinite(value))
        return value;
    if (typeof value === "string") {
        const t = value.trim();
        if (t === "" || t === "—" || t === "-")
            return null;
        const n = Number(t.replace(/%$/u, "").replace(",", "."));
        if (Number.isFinite(n))
            return n;
    }
    return null;
}
const EQ_EPS = 1e-6;
/** Diferença relativa máxima para considerar “próximo” (10%). */
const CLOSE_RATIO = 0.1;
/**
 * Compara dois números para destaque visual: por defeito maior verde e menor vermelho;
 * com `lowerIsBetter`, menor verde e maior vermelho.
 * Valores muito próximos (≤ limiar relativo) em amarelo nos dois; iguais sem destaque.
 * Só aplica quando ambos são finitos.
 */
export function compareNumericTones(a, b, options) {
    if (a == null || b == null) {
        return { left: "default", right: "default" };
    }
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return { left: "default", right: "default" };
    }
    if (Math.abs(a - b) <= EQ_EPS) {
        return { left: "default", right: "default" };
    }
    const maxAbs = Math.max(Math.abs(a), Math.abs(b));
    const rel = maxAbs > 0 ? Math.abs(a - b) / maxAbs : 0;
    if (rel <= CLOSE_RATIO) {
        return { left: "close", right: "close" };
    }
    const invert = options?.lowerIsBetter === true;
    if (invert) {
        if (a < b) {
            return { left: "higher", right: "lower" };
        }
        return { left: "lower", right: "higher" };
    }
    if (a > b) {
        return { left: "higher", right: "lower" };
    }
    return { left: "lower", right: "higher" };
}
export function toneToTextClass(tone) {
    switch (tone) {
        case "higher":
            return "text-emerald-400";
        case "lower":
            return "text-red-400";
        case "close":
            return "text-yellow-400";
        default:
            return "text-zinc-200";
    }
}
