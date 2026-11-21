import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
export function HomeShowcaseCarousel({ children, ariaLabel, prevLabel, nextLabel, className, }) {
    const trackRef = useRef(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const updateScrollState = useCallback(() => {
        const el = trackRef.current;
        if (!el)
            return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanScrollPrev(el.scrollLeft > 4);
        setCanScrollNext(el.scrollLeft < maxScroll - 4);
    }, []);
    useEffect(() => {
        const el = trackRef.current;
        if (!el)
            return;
        updateScrollState();
        el.addEventListener("scroll", updateScrollState, { passive: true });
        const ro = new ResizeObserver(updateScrollState);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateScrollState);
            ro.disconnect();
        };
    }, [updateScrollState, children]);
    const scrollByPage = (direction) => {
        const el = trackRef.current;
        if (!el)
            return;
        const firstCard = el.querySelector(":scope > *");
        const gap = 16;
        const amount = firstCard ? firstCard.offsetWidth + gap : el.clientWidth * 0.85;
        el.scrollBy({ left: direction * amount, behavior: "smooth" });
    };
    return (_jsxs("div", { className: cn("relative", className), children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-y-0 left-0 z-[2] w-8 bg-gradient-to-r from-zinc-950/90 to-transparent sm:w-12" }), _jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-y-0 right-0 z-[2] w-8 bg-gradient-to-l from-zinc-950/90 to-transparent sm:w-12" }), _jsx("div", { ref: trackRef, role: "region", "aria-label": ariaLabel, tabIndex: 0, className: "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", onKeyDown: (e) => {
                    if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        scrollByPage(-1);
                    }
                    if (e.key === "ArrowRight") {
                        e.preventDefault();
                        scrollByPage(1);
                    }
                }, children: children }), _jsxs("div", { className: "mt-4 flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => scrollByPage(-1), disabled: !canScrollPrev, "aria-label": prevLabel, className: cn("inline-flex size-9 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/70 text-zinc-300 transition", "hover:border-amber-500/40 hover:bg-zinc-800 hover:text-amber-100", "focus:outline-none focus:ring-2 focus:ring-amber-500/35 disabled:cursor-not-allowed disabled:opacity-35"), children: _jsx("span", { "aria-hidden": true, children: "\u2190" }) }), _jsx("button", { type: "button", onClick: () => scrollByPage(1), disabled: !canScrollNext, "aria-label": nextLabel, className: cn("inline-flex size-9 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/70 text-zinc-300 transition", "hover:border-amber-500/40 hover:bg-zinc-800 hover:text-amber-100", "focus:outline-none focus:ring-2 focus:ring-amber-500/35 disabled:cursor-not-allowed disabled:opacity-35"), children: _jsx("span", { "aria-hidden": true, children: "\u2192" }) })] })] }));
}
