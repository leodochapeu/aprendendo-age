import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { NotionText } from "@/components/ui/NotionText";
import { TREE_ICON_FRAME } from "@/components/deus/treeIconFrames";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
const HOVER_MS = 1000;
const GLOW = "hover:shadow-[0_0_0_1px_#fff,0_0_12px_3px_rgba(255,255,255,0.9)] focus-visible:shadow-[0_0_0_1px_#fff,0_0_12px_3px_rgba(255,255,255,0.9)]";
export function TreeIconHover({ nome, src, preview, to, linkState, className, frameClass, style, children }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const anchorRef = useRef(null);
    const previewRef = useRef(null);
    const timerRef = useRef(null);
    const previewId = useId();
    function clearTimer() {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }
    function showLater() {
        clearTimer();
        if (!preview)
            return;
        timerRef.current = window.setTimeout(() => setOpen(true), HOVER_MS);
    }
    function hide() {
        clearTimer();
        setOpen(false);
    }
    useEffect(() => clearTimer, []);
    useLayoutEffect(() => {
        if (!open)
            return;
        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor)
                return;
            const pad = 10;
            const gap = 10;
            const anchorRect = anchor.getBoundingClientRect();
            const previewWidth = previewRef.current?.offsetWidth ?? 480;
            const previewHeight = previewRef.current?.offsetHeight ?? 220;
            const left = Math.max(pad, Math.min(anchorRect.left, window.innerWidth - previewWidth - pad));
            const below = anchorRect.bottom + gap;
            const above = anchorRect.top - previewHeight - gap;
            const top = below + previewHeight <= window.innerHeight - pad ? below : Math.max(pad, above);
            setPosition({ top, left });
        };
        updatePosition();
        const observer = previewRef.current ? new ResizeObserver(updatePosition) : null;
        if (previewRef.current && observer)
            observer.observe(previewRef.current);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open]);
    const boxClass = cn(className, GLOW);
    const shared = {
        "aria-label": nome,
        "aria-describedby": open ? previewId : undefined,
        onMouseEnter: showLater,
        onMouseLeave: hide,
        onFocus: showLater,
        onBlur: hide,
    };
    const box = to ? (_jsx(Link, { ref: (node) => {
            anchorRef.current = node;
        }, to: to, state: linkState, className: boxClass, style: style, ...shared, children: children })) : (_jsx("div", { ref: (node) => {
            anchorRef.current = node;
        }, className: boxClass, style: style, ...shared, children: children }));
    return (_jsxs(_Fragment, { children: [box, open && preview
                ? createPortal(_jsx(TreePreviewCard, { ref: previewRef, id: previewId, nome: nome, src: src, frameClass: frameClass, preview: preview, style: { top: position.top, left: position.left } }), document.body)
                : null] }));
}
const TreePreviewCard = forwardRef(function TreePreviewCard({ id, nome, src, frameClass, preview, style }, ref) {
    const { t } = useTranslation();
    const costs = [
        preview.food != null ? { icon: "foodaom", value: preview.food, label: t("common.food") } : null,
        preview.wood != null ? { icon: "woodaom", value: preview.wood, label: t("common.wood") } : null,
        preview.gold != null ? { icon: "goldaom", value: preview.gold, label: t("common.gold") } : null,
        preview.favor != null ? { icon: "favoraom", value: preview.favor, label: t("spreadsheet.favor") } : null,
        preview.time != null ? { icon: "aomr_time_icon", value: `${preview.time}s`, label: t("common.buildTime") } : null,
    ].filter((cost) => cost != null);
    const lines = preview.lines ?? [];
    return (_jsxs("div", { ref: ref, id: id, role: "tooltip", className: "pointer-events-none fixed z-[300] flex w-[min(30rem,calc(100vw-1.25rem))] gap-4 rounded-md border border-[#e7c98a]/80 bg-[#14110e]/95 p-4 text-left shadow-xl shadow-black/70", style: style, children: [src ? (_jsx("span", { className: cn("size-24 shrink-0 p-[3px]", frameClass ?? TREE_ICON_FRAME.portrait), children: _jsx("img", { src: src, alt: "", className: "size-full bg-black object-contain" }) })) : null, _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100", children: nome }), costs.length ? (_jsxs("p", { className: "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-zinc-100", children: [_jsxs("span", { className: "text-zinc-400", children: [t("common.cost"), ":"] }), costs.map((cost) => {
                                const iconSrc = resolveTokenIconSrc(cost.icon);
                                return (_jsxs("span", { className: "inline-flex items-center gap-1.5", title: cost.label, children: [iconSrc ? _jsx("img", { src: iconSrc, alt: "", className: "size-5 object-contain" }) : null, _jsx("span", { className: "tabular-nums", children: cost.value })] }, cost.label));
                            })] })) : null, lines.length ? (_jsx("ul", { className: "mt-2.5 space-y-1.5 text-sm leading-relaxed text-zinc-200", children: lines.map((line, index) => (_jsxs("li", { className: "flex gap-1.5", children: [_jsx("span", { "aria-hidden": true, className: "text-zinc-500", children: "\u2022" }), _jsx(NotionText, { text: line })] }, index))) })) : null] })] }));
});
