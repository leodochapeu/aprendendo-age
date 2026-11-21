import { jsx as _jsx } from "react/jsx-runtime";
import { NotionText } from "@/components/ui/NotionText";
import { Section } from "@/components/ui/Section";
import { useTranslation } from "@/hooks/useTranslation";
/**
 * Corpo explicativo dos deuses maiores (export Notion), com ícones via {@link NotionText} / token_asset_map.
 */
export function DeusExplicacaoMaiorSection({ blocos, className }) {
    const { t } = useTranslation();
    if (!blocos.length)
        return null;
    return (_jsx(Section, { title: t("common.bonusesAndTraits"), className: className, children: _jsx("div", { className: "space-y-5", children: blocos.map((b, i) => (_jsx(DeusExplicacaoBlocoView, { bloco: b }, i))) }) }));
}
function DeusExplicacaoBlocoView({ bloco }) {
    switch (bloco.tipo) {
        case "citacao":
            return (_jsx("blockquote", { className: "border-l-[3px] border-amber-500/45 bg-zinc-900/35 py-2.5 pl-4 pr-3 text-sm leading-relaxed text-zinc-200", children: _jsx(NotionText, { text: bloco.texto }) }));
        case "lista":
            return (_jsx("ul", { className: "list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-zinc-500", children: bloco.itens.map((item, j) => (_jsx("li", { children: _jsx(NotionText, { text: item }) }, j))) }));
        case "titulo":
            return (_jsx("h3", { className: "font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-100/95", children: _jsx(NotionText, { text: bloco.texto }) }));
        case "paragrafo":
            return (_jsx("p", { className: "text-sm leading-relaxed text-zinc-300", children: _jsx(NotionText, { text: bloco.texto }) }));
        default:
            return null;
    }
}
