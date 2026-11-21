import { jsx as _jsx } from "react/jsx-runtime";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
export function DeusPortraitHeaderActions({ items, linkState, className, size, justify }) {
    const mapped = items.map((item) => ({
        key: item.key,
        to: `/deuses/${item.slug}`,
        nome: item.nome,
        src: item.src,
    }));
    return (_jsx(PortraitHeaderActions, { items: mapped, linkState: linkState, className: className, size: size, justify: justify }));
}
