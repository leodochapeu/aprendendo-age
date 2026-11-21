import { jsx as _jsx } from "react/jsx-runtime";
import { DeusPortraitHeaderActions } from "@/components/deus/DeusPortraitHeaderActions";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { resolveStartGodPortraitItems } from "@/lib/startGodPortraits";
/**
 * Retratos quadrados dos deuses do start; nome só no hover (`title`).
 * Sem `linkState`, renderiza estático (uso dentro de `EntityCard`, que já é um link).
 */
export function StartGodPortraits({ names, linkState, className }) {
    const items = resolveStartGodPortraitItems(names);
    if (items.length === 0)
        return null;
    if (linkState) {
        return (_jsx(DeusPortraitHeaderActions, { items: items, linkState: linkState, className: className, size: "xs", justify: "start" }));
    }
    return (_jsx(PortraitHeaderActions, { items: items.map((item) => ({
            key: item.key,
            to: `/deuses/${item.slug}`,
            nome: item.nome,
            src: item.src,
        })), linked: false, hoverHighlight: false, className: className, size: "xs", justify: "start" }));
}
