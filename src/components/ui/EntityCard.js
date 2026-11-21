import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AppTag } from "@/components/ui/AppTag";
import { cn } from "@/lib/cn";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { cssUrl, watermarkStripImageStyle } from "@/lib/watermarkImageStyle";
export function EntityCard({ to, linkState, title, subtitle, meta, watermarkSrc, backgroundCoverSrc, backgroundCoverFallbackSrc, subtitleTag = true, subtitleTagVariant = "amber", subtitleMinLines = 2, className, compareMode, selected, onToggleSelect, selectDisabled, cardTint, titleIcons, rankedHighlight = false, hoverPreview, }) {
    const [coverSrc, setCoverSrc] = useState(backgroundCoverSrc);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
    const anchorRef = useRef(null);
    const previewRef = useRef(null);
    const previewId = useId();
    useEffect(() => {
        setCoverSrc(backgroundCoverSrc);
    }, [backgroundCoverSrc]);
    useLayoutEffect(() => {
        if (!previewOpen || !hoverPreview)
            return;
        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor)
                return;
            const pad = 10;
            const gap = 10;
            const anchorRect = anchor.getBoundingClientRect();
            const previewWidth = previewRef.current?.offsetWidth ?? 416;
            const previewHeight = previewRef.current?.offsetHeight ?? 180;
            const left = Math.max(pad, Math.min(anchorRect.left + anchorRect.width / 2 - previewWidth / 2, window.innerWidth - previewWidth - pad));
            const below = anchorRect.bottom + gap;
            const above = anchorRect.top - previewHeight - gap;
            const top = below + previewHeight <= window.innerHeight - pad
                ? below
                : Math.max(pad, above);
            setPreviewPosition({ top, left });
        };
        updatePosition();
        const resizeObserver = previewRef.current ? new ResizeObserver(updatePosition) : null;
        if (previewRef.current && resizeObserver)
            resizeObserver.observe(previewRef.current);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [hoverPreview, previewOpen]);
    useEffect(() => {
        if (!previewOpen)
            return;
        const closeOnEscape = (event) => {
            if (event.key === "Escape")
                setPreviewOpen(false);
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [previewOpen]);
    const hasTint = Boolean(cardTint);
    const hasBgCover = Boolean(coverSrc);
    const useCoverFallbackProbe = Boolean(backgroundCoverSrc &&
        backgroundCoverFallbackSrc &&
        backgroundCoverSrc !== backgroundCoverFallbackSrc);
    const useSubtitleTag = subtitleTag && subtitle != null && subtitle !== "";
    const subtitleBody = useSubtitleTag ? (_jsx(AppTag, { variant: subtitleTagVariant, className: "align-top leading-snug [word-break:break-word] normal-case", children: subtitle })) : (subtitle);
    const shellClass = cn("group relative block overflow-hidden rounded-xl border p-4 transition-colors", !hasTint && !hasBgCover && "bg-zinc-900/40", !hasTint && hasBgCover && "bg-transparent", compareMode ? "cursor-pointer" : false, rankedHighlight
        ? "entity-card-ranked border-amber-400/75 shadow-[0_0_0_1px_rgba(251,191,36,0.28),0_0_14px_rgba(245,158,11,0.18)] hover:border-amber-300/90"
        : "border-aom-border hover:border-amber-500/35", !hasTint && !hasBgCover && "hover:bg-zinc-900/70", selected && compareMode && !hasTint && !hasBgCover ? "border-amber-500/50 bg-zinc-900/70 ring-1 ring-amber-500/30" : false, selected && compareMode && hasTint ? "border-amber-500/50 ring-1 ring-amber-500/30" : false, selected && compareMode && hasBgCover && !hasTint ? "border-amber-500/50 ring-1 ring-amber-500/30" : false, selectDisabled && compareMode && !selected ? "opacity-60" : false, className);
    const tintLayers = hasTint && cardTint ? (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": true, className: cn("pointer-events-none absolute inset-0 rounded-[inherit]", hasBgCover && "z-[2]"), style: { backgroundColor: cardTint } }), _jsx("div", { "aria-hidden": true, className: cn("pointer-events-none absolute inset-0 rounded-[inherit] bg-zinc-900/40 transition-colors", "group-hover:bg-zinc-900/70", selected && compareMode && "bg-zinc-900/70", hasBgCover && "z-[3]") })] })) : null;
    const bgCoverLayers = hasBgCover ? (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]", children: _jsx("div", { className: "absolute inset-0 bg-cover bg-center saturate-125 opacity-[0.5] transition-opacity group-hover:opacity-[0.5]", style: { backgroundImage: cssUrl(coverSrc) } }) }), _jsx("div", { "aria-hidden": true, className: cn("pointer-events-none absolute inset-0 z-[1] rounded-[inherit] bg-zinc-900/40 transition-colors", "group-hover:bg-zinc-900/70", selected && compareMode && !hasTint && "bg-zinc-900/70") })] })) : null;
    const wmZ = hasBgCover ? "z-[4]" : "z-0";
    const contentZ = hasBgCover ? "z-[5]" : "z-[1]";
    const inner = (_jsxs(_Fragment, { children: [watermarkSrc ? (_jsx("div", { "aria-hidden": true, className: cn("pointer-events-none absolute inset-y-0 right-0 w-[min(52%,20rem)] overflow-hidden", wmZ), children: _jsx("div", { className: "absolute inset-0 saturate-125 opacity-[0.3] transition-opacity group-hover:opacity-[0.3]", style: watermarkStripImageStyle(watermarkSrc) }) })) : null, _jsxs("div", { className: cn("relative", contentZ), children: [_jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [compareMode ? (_jsx("input", { type: "checkbox", checked: !!selected, disabled: selectDisabled && !selected, onChange: (e) => {
                                    e.stopPropagation();
                                    if (selectDisabled && !selected)
                                        return;
                                    onToggleSelect?.();
                                }, onClick: (e) => e.stopPropagation(), className: "mt-1 size-4 shrink-0 rounded border-aom-border bg-zinc-900 text-amber-600 focus:ring-amber-500/40 disabled:cursor-not-allowed", "aria-label": "Selecionar para comparar" })) : null, _jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-2", children: [_jsx("span", { className: "min-w-0 flex-1 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100 group-hover:text-amber-50", children: title }), titleIcons?.length ? (_jsx("span", { className: "flex shrink-0 items-center gap-1", children: titleIcons.map((ti, idx) => {
                                            const src = ti.src ?? (ti.icon ? resolveTokenIconSrc(ti.icon) : undefined);
                                            const key = ti.src ?? ti.icon ?? ti.label;
                                            return (_jsx("span", { title: ti.label, className: "inline-flex", children: src ? (_jsx("img", { src: src, alt: "", draggable: false, className: "size-5 object-contain" })) : (_jsx("span", { className: "max-w-[7rem] truncate text-xs font-normal normal-case text-amber-200/85", children: ti.icon ?? ti.label })) }, `${key}-${idx}`));
                                        }) })) : null] })] }), subtitleMinLines === 3 ? (_jsx("p", { className: "mt-2 line-clamp-3 min-h-[3lh] text-sm leading-relaxed text-zinc-400", children: subtitle != null ? subtitleBody : "\u00A0" })) : subtitle ? (_jsx("p", { className: "mt-2 line-clamp-2 text-sm text-zinc-400", children: subtitleBody })) : null, meta ? _jsx("div", { className: "mt-2 text-xs text-zinc-500", children: meta }) : null] })] }));
    const coverProbe = useCoverFallbackProbe && hasBgCover && backgroundCoverFallbackSrc ? (_jsx("img", { src: backgroundCoverSrc, alt: "", className: "pointer-events-none h-px w-px max-h-0 max-w-0 overflow-hidden border-0 opacity-0", onError: () => {
            if (backgroundCoverFallbackSrc)
                setCoverSrc(backgroundCoverFallbackSrc);
        } }, backgroundCoverSrc)) : null;
    const preview = previewOpen && hoverPreview && typeof document !== "undefined"
        ? createPortal(_jsxs("div", { ref: previewRef, id: previewId, role: "tooltip", className: "pointer-events-none fixed z-[300] w-[min(26rem,calc(100vw-1.25rem))] overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/95 text-left shadow-xl shadow-black/60 backdrop-blur-sm", style: { top: previewPosition.top, left: previewPosition.left }, children: [_jsx("div", { className: "border-b border-zinc-800/90 px-3.5 py-2.5", children: _jsx("p", { className: "font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-amber-100", children: title }) }), _jsx("div", { className: "px-3.5 py-3", children: hoverPreview })] }), document.body)
        : null;
    const previewHandlers = hoverPreview
        ? {
            onMouseEnter: () => setPreviewOpen(true),
            onMouseLeave: () => setPreviewOpen(false),
            onFocus: () => setPreviewOpen(true),
            onBlur: (event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setPreviewOpen(false);
            },
            "aria-describedby": previewOpen ? previewId : undefined,
        }
        : {};
    if (compareMode) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { ref: (node) => {
                        anchorRef.current = node;
                    }, role: "button", tabIndex: 0, className: shellClass, onClick: () => {
                        if (selectDisabled && !selected)
                            return;
                        onToggleSelect?.();
                    }, onKeyDown: (e) => {
                        if (e.key !== "Enter" && e.key !== " ")
                            return;
                        e.preventDefault();
                        if (selectDisabled && !selected)
                            return;
                        onToggleSelect?.();
                    }, ...previewHandlers, children: [coverProbe, bgCoverLayers, tintLayers, inner] }), preview] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Link, { ref: (node) => {
                    anchorRef.current = node;
                }, to: to, className: shellClass, state: linkState, ...previewHandlers, children: [coverProbe, bgCoverLayers, tintLayers, inner] }), preview] }));
}
