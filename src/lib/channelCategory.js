import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
const STYLES = {
    discord: {
        cardGradient: "from-indigo-950/90 via-violet-950/60 to-zinc-950",
        border: "border-indigo-500/35",
        badgeBg: "bg-indigo-500/15 text-indigo-100 border-indigo-400/40",
        accentText: "text-indigo-300",
        glow: "rgba(99,102,241,0.35)",
    },
    instagram: {
        cardGradient: "from-fuchsia-950/90 via-pink-950/50 to-zinc-950",
        border: "border-fuchsia-500/35",
        badgeBg: "bg-fuchsia-500/15 text-fuchsia-100 border-fuchsia-400/40",
        accentText: "text-fuchsia-300",
        glow: "rgba(217,70,239,0.32)",
    },
    whatsapp: {
        cardGradient: "from-emerald-950/90 via-green-950/50 to-zinc-950",
        border: "border-emerald-500/35",
        badgeBg: "bg-emerald-500/15 text-emerald-100 border-emerald-400/40",
        accentText: "text-emerald-300",
        glow: "rgba(34,197,94,0.32)",
    },
    youtube: {
        cardGradient: "from-red-950/90 via-rose-950/45 to-zinc-950",
        border: "border-red-500/35",
        badgeBg: "bg-red-500/15 text-red-100 border-red-400/40",
        accentText: "text-red-300",
        glow: "rgba(239,68,68,0.34)",
    },
    twitch: {
        cardGradient: "from-purple-950/90 via-violet-950/55 to-zinc-950",
        border: "border-purple-500/35",
        badgeBg: "bg-purple-500/15 text-purple-100 border-purple-400/40",
        accentText: "text-purple-300",
        glow: "rgba(168,85,247,0.34)",
    },
    site: {
        cardGradient: "from-cyan-950/90 via-sky-950/50 to-zinc-950",
        border: "border-cyan-500/35",
        badgeBg: "bg-cyan-500/15 text-cyan-100 border-cyan-400/40",
        accentText: "text-cyan-300",
        glow: "rgba(34,211,238,0.3)",
    },
};
export function getChannelCategoryStyle(category) {
    return STYLES[category] ?? STYLES.site;
}
export function normalizeChannelCategory(value) {
    const key = value.trim().toLowerCase();
    if (key in STYLES)
        return key;
    return "site";
}
function DiscordIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "currentColor", "aria-hidden": true, children: _jsx("path", { d: "M20.32 4.37A19.8 19.8 0 0 0 16.55 3c-.2.36-.43.85-.59 1.23a18.3 18.3 0 0 0-5.92 0A8.5 8.5 0 0 0 9.45 3a19.7 19.7 0 0 0-3.77 1.37C2.55 8.22 1.74 12 2.01 15.73a19.9 19.9 0 0 0 4.86 2.45c.39-.53.74-1.1 1.04-1.68a12.8 12.8 0 0 1-1.64-.78l.41-.3a14.5 14.5 0 0 0 11.64 0l.41.3c-.5.3-1.07.56-1.64.78.3.58.65 1.15 1.04 1.68a19.8 19.8 0 0 0 4.86-2.45c.35-4.3-.6-8.05-2.68-11.36ZM8.68 13.55c-.97 0-1.77-.88-1.77-1.96 0-1.08.78-1.96 1.77-1.96.99 0 1.79.88 1.77 1.96 0 1.08-.78 1.96-1.77 1.96Zm6.64 0c-.97 0-1.77-.88-1.77-1.96 0-1.08.78-1.96 1.77-1.96.99 0 1.79.88 1.77 1.96 0 1.08-.78 1.96-1.77 1.96Z" }) }));
}
function InstagramIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: [_jsx("rect", { x: "4", y: "4", width: "16", height: "16", rx: "4" }), _jsx("circle", { cx: "12", cy: "12", r: "3.25" }), _jsx("circle", { cx: "17.2", cy: "6.8", r: "0.75", fill: "currentColor", stroke: "none" })] }));
}
function WhatsappIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "currentColor", "aria-hidden": true, children: _jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" }) }));
}
function YoutubeIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "currentColor", "aria-hidden": true, children: _jsx("path", { d: "M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.09 5 12 5 12 5s-6.09 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.91 19 12 19 12 19s6.09 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" }) }));
}
function TwitchIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "currentColor", "aria-hidden": true, children: _jsx("path", { d: "M4 3 2 7v12h5v3l3-3h4l6-6V3H4Zm15 9-3 3h-4l-3 3v-3H6V5h13v7Zm-3-5h2v5h-2V7Zm-5 0h2v5h-2V7Z" }) }));
}
function GlobeIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" })] }));
}
const ICONS = {
    discord: DiscordIcon,
    instagram: InstagramIcon,
    whatsapp: WhatsappIcon,
    youtube: YoutubeIcon,
    twitch: TwitchIcon,
    site: GlobeIcon,
};
export function ChannelCategoryIcon({ category, className, }) {
    const Icon = ICONS[category] ?? GlobeIcon;
    return _jsx("span", { className: cn("inline-flex", className), children: Icon() });
}
