import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Mesma coluna de valor do {@link InfoRow} que o texto: alinha retratos à **esquerda**,
 * com altura mínima estável quando há vários ícones em fila (`flex-wrap`).
 */
export function InfoRowPortraitCluster({ children }) {
    return (_jsx("div", { className: "flex min-h-[2.75rem] w-full min-w-0 flex-wrap items-center justify-start gap-1.5 sm:min-h-[3rem] sm:gap-2", children: children }));
}
/** Retratos quando existem; caso contrário o fallback (ex.: só `NotionText`). */
export function InfoRowPortraitOrText({ portraits, textFallback }) {
    return _jsx(InfoRowPortraitCluster, { children: portraits != null ? portraits : textFallback });
}
