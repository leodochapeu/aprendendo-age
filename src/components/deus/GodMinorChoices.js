import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TreeIconHover } from "@/components/deus/TreeIconHover";
import { TREE_ICON_FRAME } from "@/components/deus/treeIconFrames";
import {} from "@/lib/godMinorChoices";
import { cn } from "@/lib/cn";
const FRAME = {
    portrait: TREE_ICON_FRAME.portrait,
    power: TREE_ICON_FRAME.power,
    tech: TREE_ICON_FRAME.tech,
    myth: TREE_ICON_FRAME.myth,
};
export function MinorAgeContent({ row, linkState, }) {
    return (_jsxs("div", { className: "flex h-full flex-col justify-center", style: {
            gap: "calc(var(--tree-icon) * 0.16)",
            padding: "calc(var(--tree-icon) * 0.12) calc(var(--tree-icon) * 0.7) calc(var(--tree-icon) * 0.12) calc(var(--tree-icon) * 0.35)",
        }, children: [row.icons ? (_jsx("div", { className: "flex items-center", style: { gap: "calc(var(--tree-icon) * 0.12)" }, children: row.icons.map((item) => (_jsx(ChoiceIcon, { item: item, linkState: linkState }, item.key))) })) : null, row.minors?.map((minor) => (_jsxs("div", { className: "flex items-center", style: { gap: "calc(var(--tree-icon) * 0.12)" }, children: [_jsx(ChoiceIcon, { item: minor.portrait, linkState: linkState }), minor.icons.map((item) => (_jsx(ChoiceIcon, { item: item, linkState: linkState }, item.key)))] }, minor.id)))] }));
}
function ChoiceIcon({ item, linkState }) {
    const body = item.src ? (_jsx("img", { src: item.src, alt: "", className: "size-full object-contain" })) : (_jsx("span", { className: "px-0.5 text-center text-[9px] font-semibold text-zinc-400", children: item.nome.slice(0, 2) }));
    return (_jsx(TreeIconHover, { nome: item.nome, src: item.src, preview: item.preview, frameClass: FRAME[item.frame], to: item.to, linkState: linkState, className: cn("flex shrink-0 items-center justify-center transition", FRAME[item.frame]), style: {
            width: item.frame === "portrait" ? "calc(var(--tree-icon) * 1.15)" : "var(--tree-icon)",
            height: item.frame === "portrait" ? "calc(var(--tree-icon) * 1.15)" : "var(--tree-icon)",
            padding: "calc(var(--tree-icon) * 0.05)",
        }, children: _jsx("span", { className: "flex size-full items-center justify-center bg-black", children: body }) }));
}
