import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { useTranslation } from "@/hooks/useTranslation";
import { localeSectionPath } from "@/lib/localeRoutes";
import { withListViewMode } from "@/lib/listViewMode";
import { trilhaShared } from "../trilhaAssets";
import { TRILHA_CHAPTERS, chapterKicker } from "./chapters";
import { useTrilhaJump } from "./jump";
import { LessonSection, PillLink, VideoFrame, trilhaSectionClass } from "./ui";
const YT_APRENDENDO_AGE = "https://www.youtube.com/embed/fT66Hc4XcRo";
const BATTLE_SIM = "https://www.aom-battlesimulator.net/#/";
export function IntroPanel() {
    const { t } = useTranslation();
    const jump = useTrilhaJump();
    const archaic = getTokenAssetUrl("aomr_archaic_age_icon");
    const wonder = getTokenAssetUrl("aomr_wonder_age_icon");
    const lessons = TRILHA_CHAPTERS.filter((chapter) => chapter.id !== "inicio");
    return (_jsx("section", { id: "inicio", className: `${trilhaSectionClass} px-5 pb-8 pt-10 md:px-12 md:pt-16`, children: _jsxs("div", { className: "mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.32em] text-amber-300/90", children: t("pages.trilha.index.trilhaLabel") }), _jsxs("h1", { className: "mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-50 md:text-7xl", children: [_jsxs("span", { className: "flex flex-wrap items-center gap-x-4 gap-y-2", children: [_jsx("span", { children: t("pages.trilha.index.titlePrefix") }), _jsxs("span", { className: "inline-flex items-center gap-3 text-amber-200", children: [t("pages.trilha.index.titleNoob"), archaic ? _jsx("img", { src: archaic, alt: "", className: "h-12 w-12 object-contain md:h-16 md:w-16" }) : null] })] }), _jsxs("span", { className: "mt-2 flex flex-wrap items-center gap-x-4 gap-y-2", children: [_jsx("span", { children: t("pages.trilha.index.titleJoin") }), _jsxs("span", { className: "inline-flex items-center gap-3 text-sky-200", children: [t("pages.trilha.index.titlePro"), wonder ? _jsx("img", { src: wonder, alt: "", className: "h-12 w-12 object-contain md:h-16 md:w-16" }) : null] })] })] }), _jsx("p", { className: "mt-6 max-w-xl text-lg leading-relaxed text-zinc-100 md:text-xl", children: t("pages.trilha.index.pageDescription") }), _jsxs("figure", { className: "mt-8 flex items-center gap-4", children: [_jsx("img", { src: trilhaShared("ScoobyManiaco_Perfil.webp"), alt: "", className: "h-16 w-16 rounded-full object-cover ring-2 ring-amber-300/50" }), _jsxs("figcaption", { className: "text-lg leading-relaxed text-zinc-100", children: [_jsx("span", { className: "font-semibold text-amber-200", children: "Scooby. " }), t("pages.trilha.index.callout")] })] }), _jsxs("button", { type: "button", onClick: () => jump("forcas"), className: "mt-8 inline-flex items-center gap-3 rounded-full bg-zinc-50 px-7 py-3.5 text-lg font-semibold text-zinc-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300", children: [t("pages.trilha.deck.startCta"), _jsx("span", { "aria-hidden": true, children: "\u2192" })] })] }), _jsx("ol", { className: "divide-y divide-white/10 border-y border-white/10", children: lessons.map((chapter, index) => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => jump(chapter.id), className: "group flex w-full items-start gap-4 py-4 text-left transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300", children: [_jsx("span", { className: "w-10 shrink-0 pt-0.5 font-[family-name:var(--font-display)] text-xl text-amber-200/80", children: String(index + 1).padStart(2, "0") }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-lg font-medium text-zinc-50 md:text-xl", children: t(chapter.titleKey) }), _jsx("span", { className: "mt-1 block text-base leading-relaxed text-zinc-300", children: t(chapter.blurbKey) })] }), _jsx("span", { "aria-hidden": true, className: "pt-1 text-xl text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-amber-200", children: "\u2192" })] }) }, chapter.id))) })] }) }));
}
export function ErasPanel() {
    const { t, locale } = useTranslation();
    return (_jsx(LessonSection, { id: "eras", slide: true, center: true, kicker: chapterKicker(t, "eras"), title: t("pages.trilha.index.step2"), lede: t("pages.trilha.index.step2Body"), children: _jsx(PillLink, { to: localeSectionPath(locale, "eras"), children: t("pages.trilha.deck.openEras") }) }));
}
export function UnidadesPanel() {
    const { t, locale } = useTranslation();
    return (_jsx(LessonSection, { id: "unidades", slide: true, center: true, kicker: chapterKicker(t, "unidades"), title: t("pages.trilha.index.step3"), lede: t("pages.trilha.index.step3Body"), children: _jsx(PillLink, { to: withListViewMode(localeSectionPath(locale, "unidades"), "planilha"), children: t("pages.trilha.deck.openUnits") }) }));
}
export function StartsPanel() {
    const { t, locale } = useTranslation();
    return (_jsx(LessonSection, { id: "starts", slide: true, center: true, kicker: chapterKicker(t, "starts"), title: t("pages.trilha.index.step5"), lede: t("pages.trilha.index.step5Body"), children: _jsx(PillLink, { to: localeSectionPath(locale, "starts"), children: t("pages.trilha.deck.openStarts") }) }));
}
export function VideoPanel() {
    const { t } = useTranslation();
    const chapters = [
        t("pages.trilha.index.step7Chapter1"),
        t("pages.trilha.index.step7Chapter2"),
        t("pages.trilha.index.step7Chapter3"),
        t("pages.trilha.index.step7Chapter4"),
    ];
    return (_jsx(LessonSection, { id: "video", center: true, kicker: chapterKicker(t, "video"), title: t("pages.trilha.index.step7"), lede: t("pages.trilha.index.step7Body"), children: _jsxs("div", { className: "mx-auto max-w-4xl text-left", children: [_jsx(VideoFrame, { src: YT_APRENDENDO_AGE, title: t("pages.trilha.index.step7VideoTitle") }), _jsx("ol", { className: "mt-8 space-y-3", children: chapters.map((chapter, index) => (_jsxs("li", { className: "flex gap-4 text-lg text-zinc-100 md:text-xl", children: [_jsx("span", { className: "font-[family-name:var(--font-display)] text-amber-200", children: String(index + 1).padStart(2, "0") }), _jsx("span", { children: chapter })] }, chapter))) })] }) }));
}
export function SimPanel() {
    const { t } = useTranslation();
    return (_jsx(LessonSection, { id: "simulador", slide: true, center: true, kicker: chapterKicker(t, "simulador"), title: t("pages.trilha.index.step8"), lede: _jsxs(_Fragment, { children: [_jsx("em", { children: t("pages.trilha.index.step8Credits") }), " ", t("pages.trilha.index.step8Desc")] }), children: _jsx(PillLink, { to: BATTLE_SIM, external: true, children: t("pages.trilha.deck.openSim") }) }));
}
