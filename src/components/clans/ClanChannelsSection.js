import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChannelGrid } from "@/components/channels/ChannelCard";
import { getClanAbout } from "@/data/clanAbout";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
export function ClanChannelsSection({ channels, theme }) {
    const { t } = useTranslation();
    if (channels.length === 0)
        return null;
    return (_jsxs("section", { children: [_jsx(SectionHeading, { icon: _jsx(GlobeIcon, { className: theme.sectionIcon }), title: t("pages.clans.detail.linksTitle"), subtitle: t("pages.clans.detail.linksSubtitle") }), _jsx(ChannelGrid, { channels: channels, compact: true })] }));
}
function SectionHeading({ icon, title, subtitle }) {
    return (_jsxs("div", { className: "mb-5 flex items-start gap-3", children: [_jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-aom-border/50 bg-zinc-950/80 shadow-inner", children: icon }), _jsxs("div", { children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-100 sm:text-xl", children: title }), _jsx("p", { className: "mt-0.5 text-sm text-zinc-500", children: subtitle })] })] }));
}
export function ClanAboutSection({ slug, theme }) {
    const { t, locale } = useTranslation();
    const about = getClanAbout(slug, locale);
    return (_jsxs("section", { children: [_jsx(SectionHeading, { icon: _jsx(AboutIcon, { className: theme.sectionIcon }), title: t("pages.clans.detail.aboutTitle"), subtitle: t("pages.clans.detail.aboutSubtitle") }), about ? (_jsxs("article", { className: cn("overflow-hidden rounded-2xl border bg-zinc-950/55 shadow-inner", theme.accentBorder), children: [_jsx("div", { className: "divide-y divide-white/[0.06]", children: about.blocks.map((block, index) => (_jsxs("div", { className: "px-5 py-7 sm:px-8 sm:py-9", children: [_jsxs("header", { children: [_jsx("p", { className: cn("font-mono text-[11px] font-medium tracking-[0.34em]", theme.accentText), children: String(index + 1).padStart(2, "0") }), _jsx("h3", { className: cn("mt-2 font-[family-name:var(--font-display)] text-[1.65rem] font-semibold leading-tight tracking-wide sm:text-3xl", theme.accentText), children: block.title }), _jsx("div", { className: cn("mt-4 h-px w-14 bg-current opacity-70", theme.accentText), "aria-hidden": true })] }), _jsx("div", { className: "mt-5 max-w-3xl space-y-4", children: block.paragraphs.map((paragraph) => (_jsx("p", { className: "text-[15px] leading-8 text-zinc-300 sm:text-base sm:leading-8", children: _jsx(EmphasisText, { text: paragraph, accentClass: theme.accentText }) }, paragraph))) })] }, block.title))) }), _jsxs("blockquote", { className: "relative border-t border-white/[0.06] px-6 py-10 text-center sm:px-12 sm:py-12", children: [_jsx("span", { "aria-hidden": true, className: cn("pointer-events-none absolute left-5 top-3 font-[family-name:var(--font-display)] text-6xl leading-none opacity-30 sm:left-8 sm:top-4 sm:text-7xl", theme.accentText), children: "\u201C" }), _jsx("p", { className: "relative mx-auto max-w-2xl font-[family-name:var(--font-display)] text-xl leading-snug tracking-wide text-zinc-50 sm:text-2xl", children: about.motto })] })] })) : (_jsxs("div", { className: cn("overflow-hidden rounded-2xl border bg-zinc-950/50", theme.accentBorder), children: [_jsx("div", { className: "border-b border-zinc-800/80 px-4 py-3 sm:px-5", children: _jsx("span", { className: "inline-flex items-center rounded-full border border-zinc-600/50 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500", children: t("pages.clans.detail.comingSoon") }) }), _jsxs("div", { className: "space-y-3 px-4 py-6 sm:px-5 sm:py-8", children: [_jsx("div", { className: "h-3 w-4/5 max-w-md rounded-full bg-zinc-800/80", "aria-hidden": true }), _jsx("div", { className: "h-3 w-full rounded-full bg-zinc-800/60", "aria-hidden": true }), _jsx("div", { className: "h-3 w-11/12 rounded-full bg-zinc-800/50", "aria-hidden": true }), _jsx("p", { className: "pt-2 text-sm text-zinc-500", children: t("pages.clans.detail.aboutPlaceholder") })] })] }))] }));
}
function EmphasisText({ text, accentClass }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (_jsx("span", { className: cn("font-medium", accentClass), children: part.slice(2, -2) }, index));
        }
        return _jsx("span", { children: part }, index);
    });
}
function AboutIcon({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: cn("h-5 w-5", className), fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: [_jsx("path", { d: "M12 6.5v.01M12 10v7.5", strokeLinecap: "round" }), _jsx("circle", { cx: "12", cy: "12", r: "9" })] }));
}
function GlobeIcon({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: cn("h-5 w-5", className), fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" })] }));
}
