import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveMultiplicadorIcon } from "@/lib/unidadeMultiplicador";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
function parseSimpleMultiplier(value) {
    const normalized = value.trim().replace(",", ".").replace(/x$/i, "");
    if (!/^\d+(?:\.\d+)?$/.test(normalized))
        return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}
export function UnidadeMultiplierDamagePreview({ unidade }) {
    const { t, locale } = useTranslation();
    const multipliers = unidade.multiplicador ?? [];
    const damageTypes = [
        {
            value: unidade.dano_cortante,
            icon: "hackdamage",
            label: t("spreadsheet.unidades.hackDamage"),
        },
        {
            value: unidade.dano_perfurante,
            icon: "piercedamage",
            label: t("spreadsheet.unidades.pierceDamage"),
        },
    ].filter((damage) => damage.value != null);
    const rows = damageTypes.flatMap((damage) => multipliers.flatMap((multiplier, index) => {
        const factor = parseSimpleMultiplier(multiplier.value);
        if (factor == null)
            return [];
        return [{
                key: `${damage.icon}-${multiplier.type}-${index}`,
                damage,
                multiplier,
                factor,
                calculatedDamage: damage.value * factor,
            }];
    }));
    if (!rows.length)
        return null;
    const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const betterIcon = resolveTokenIconSrc("aomr_better_icon");
    const worseIcon = resolveTokenIconSrc("aomr_worse_icon");
    return (_jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3", children: rows.map(({ key, damage, multiplier, factor, calculatedDamage }) => {
            const damageIcon = resolveTokenIconSrc(damage.icon);
            const targetToken = resolveMultiplicadorIcon(multiplier);
            const targetIcon = targetToken ? resolveTokenIconSrc(targetToken) : undefined;
            const favorable = factor >= 1;
            const resultIcon = favorable ? betterIcon : worseIcon;
            return (_jsxs("div", { title: `${damage.label} × ${multiplier.type} (${numberFormatter.format(factor)}x)`, className: "flex min-w-0 items-center gap-1.5 rounded-lg border border-zinc-800/90 bg-zinc-900/65 px-2.5 py-2", children: [damageIcon ? _jsx("img", { src: damageIcon, alt: "", "aria-hidden": true, className: "size-5 shrink-0 object-contain" }) : null, _jsx("span", { className: favorable ? "text-xs font-semibold tabular-nums text-emerald-400" : "text-xs font-semibold tabular-nums text-red-400", children: numberFormatter.format(calculatedDamage) }), targetIcon ? (_jsx("img", { src: targetIcon, alt: "", "aria-hidden": true, className: "size-3.5 shrink-0 object-contain" })) : (_jsx("span", { className: "max-w-16 truncate text-[9px] text-zinc-400", children: multiplier.type })), resultIcon ? (_jsx("img", { src: resultIcon, alt: "", "aria-hidden": true, className: "size-3.5 shrink-0 object-contain" })) : null] }, key));
        }) }));
}
