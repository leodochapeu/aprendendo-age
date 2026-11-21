import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { countryLabelFromStored, flagIsoFromStoredCountry } from "@/lib/playerCountry";
/** Bandeiras em que o desenho ocupa a largura inteira — o corte central apaga faixas ou o brasão. */
const FULL_FLAG = new Set(["mx", "rs", "ro", "fr"]);
/** Estandarte pendurado, no formato de bandeira de tecido com barra e ponta. */
export function FlagPennant({ country, tier, className, }) {
    const iso = flagIsoFromStoredCountry(country);
    const label = countryLabelFromStored(country);
    if (!iso || !label)
        return null;
    return (_jsxs("div", { className: cn("flag-pennant", tier && `flag-pennant--${tier}`, className), role: "img", "aria-label": label, title: label, children: [_jsx("div", { className: "flag-pennant__rod", "aria-hidden": true }), _jsxs("div", { className: "flag-pennant__cloth", "aria-hidden": true, children: [_jsx("img", { src: `/assets/flags/${iso}.svg`, alt: "", draggable: false, className: cn(iso === "us" && "flag-pennant__cloth-img--hoist", FULL_FLAG.has(iso) && "flag-pennant__cloth-img--full") }), _jsx("div", { className: "flag-pennant__folds" })] })] }));
}
