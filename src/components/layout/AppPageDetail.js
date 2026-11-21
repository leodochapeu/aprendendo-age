import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BackLink } from "@/components/ui/BackLink";
import { listIndexReturnTo } from "@/lib/listIndexReturnState";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
/** Mesmo fade do detalhe de mapa: opaco no topo, some para baixo. */
const HERO_BACKGROUND_MASK = "linear-gradient(to bottom, #000 0%, #000 18%, rgba(0,0,0,0.45) 42%, transparent 100%)";
/**
 * Esqueleto comum de página de detalhe: volta + cabeçalho + corpo opcionalmente com hero de fundo.
 */
export function AppPageDetail({ backTo, backLabel, title, description, headerIconSrc, descriptionTag, actions, siblingNav, heroBackgroundSrc, heroBackgroundFallbackSrc, pageHeaderClassName, className, children, }) {
    const { state: navState } = useLocation();
    const backHref = listIndexReturnTo(backTo, navState);
    const [heroSrc, setHeroSrc] = useState(heroBackgroundSrc);
    useEffect(() => {
        setHeroSrc(heroBackgroundSrc);
    }, [heroBackgroundSrc]);
    return (_jsxs("div", { className: cn(className), children: [_jsxs("div", { className: "relative -mx-4 -mt-6 mb-8 md:-mx-10 md:-mt-10", children: [heroSrc ? (_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(46vh,400px)] overflow-hidden", children: _jsx("img", { src: heroSrc, alt: "", className: "h-full w-full object-cover object-center opacity-[0.22] saturate-125", style: {
                                maskImage: HERO_BACKGROUND_MASK,
                                WebkitMaskImage: HERO_BACKGROUND_MASK,
                            }, draggable: false, onError: () => {
                                if (heroBackgroundFallbackSrc && heroSrc === heroBackgroundSrc) {
                                    setHeroSrc(heroBackgroundFallbackSrc);
                                }
                            } }) })) : null, _jsxs("div", { className: "relative z-10 px-4 pt-6 md:px-10 md:pt-10", children: [_jsx(BackLink, { to: backHref, children: backLabel }), _jsx(PageHeader, { title: title, description: description, headerIconSrc: headerIconSrc, descriptionTag: descriptionTag, actions: actions, siblingNav: siblingNav, className: cn("mb-0", pageHeaderClassName) })] })] }), children] }));
}
