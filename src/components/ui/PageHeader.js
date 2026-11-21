import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useListHeaderCollapse } from "@/components/layout/listHeaderCollapse";
import { AppTag } from "@/components/ui/AppTag";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
export function PageHeaderBlock({ title, description, headerIconSrc, descriptionTag = false, descriptionTagVariant = "amber", align = "start", className, titleClassName, titleAccessory, }) {
    const icon = headerIconSrc ? (_jsx("img", { src: headerIconSrc, alt: "", "aria-hidden": true, className: "h-20 w-20 shrink-0 rounded-xl border border-aom-border bg-zinc-900/60 object-contain p-1.5 shadow-sm shadow-black/30" })) : null;
    const hasDescription = description != null && (typeof description !== "string" || description !== "");
    const useDescriptionTag = descriptionTag && hasDescription;
    const descriptionBody = useDescriptionTag ? (_jsx(AppTag, { variant: descriptionTagVariant, className: "mt-2 align-top leading-snug [word-break:break-word] normal-case", children: description })) : hasDescription ? (typeof description === "string" ? (_jsx("p", { className: "mt-2 max-w-2xl text-sm text-zinc-400", children: description })) : (_jsx("div", { className: "mt-2 max-w-2xl text-sm text-zinc-400", children: description }))) : null;
    const isEnd = align === "end";
    const inner = (_jsxs("div", { className: cn("inline-flex max-w-full min-w-0 items-start gap-4", isEnd ? "flex-row-reverse" : false, !isEnd ? className : false), children: [icon, _jsxs("div", { className: cn("min-w-0", isEnd && "text-right"), children: [_jsxs("h1", { className: cn("font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-100", titleAccessory ? "inline-flex max-w-full items-center gap-3" : false, titleClassName ?? "text-3xl"), children: [titleAccessory ? _jsx("span", { className: "min-w-0", children: title }) : title, titleAccessory] }), descriptionBody] })] }));
    if (isEnd) {
        return _jsx("div", { className: cn("flex min-w-0 justify-end", className), children: inner });
    }
    return inner;
}
function ListHeaderCollapseButton() {
    const { t } = useTranslation();
    const collapse = useListHeaderCollapse();
    if (!collapse)
        return null;
    const label = collapse.open ? t("common.collapseHeader") : t("common.expandHeader");
    return (_jsxs("button", { type: "button", onClick: collapse.toggle, "aria-expanded": collapse.open, "aria-controls": collapse.controlsId, title: label, "aria-label": label, className: "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/50 text-amber-100/90 transition hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: [_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, className: cn("transition-transform", collapse.open && "rotate-180"), children: _jsx("path", { d: "M6 9l6 6 6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }), collapse.marked && !collapse.open ? (_jsx("span", { className: "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400", "aria-hidden": true })) : null] }));
}
export function PageHeader({ title, description, headerIconSrc, descriptionTag, descriptionTagVariant, actions, siblingNav, className, }) {
    const collapse = useListHeaderCollapse();
    const expanded = collapse?.open ?? true;
    const trailing = (expanded && actions) || siblingNav ? (_jsxs("div", { className: "flex shrink-0 items-start gap-2", children: [expanded && actions ? actions : null, siblingNav] })) : null;
    return (_jsxs("header", { className: cn("mb-8 flex w-full max-w-full gap-3", siblingNav
            ? "flex-row items-start justify-between"
            : "flex-col sm:flex-row sm:items-start sm:justify-between", className), children: [_jsx(PageHeaderBlock, { title: title, description: expanded ? description : undefined, headerIconSrc: headerIconSrc, descriptionTag: descriptionTag, descriptionTagVariant: descriptionTagVariant, titleAccessory: collapse ? _jsx(ListHeaderCollapseButton, {}) : undefined, className: siblingNav ? "min-w-0 flex-1" : undefined }), trailing] }));
}
