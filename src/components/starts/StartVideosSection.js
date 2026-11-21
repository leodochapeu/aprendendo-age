import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toYouTubeEmbedUrl } from "@/lib/youtubeEmbed";
export function StartVideosSection({ title, urls, sectionHeading = "Vídeos de referência" }) {
    if (!urls.length)
        return null;
    return (_jsxs("div", { className: "mt-10 space-y-6 border-t border-aom-border/60 pt-10", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100/95", children: sectionHeading }), urls.map((url) => {
                const embed = toYouTubeEmbedUrl(url);
                if (!embed) {
                    return (_jsx("p", { className: "text-sm text-zinc-400", children: _jsx("a", { href: url, className: "text-amber-200 underline-offset-2 hover:underline", target: "_blank", rel: "noreferrer", children: url }) }, url));
                }
                return (_jsx("div", { className: "overflow-hidden rounded-xl border border-aom-border bg-black/40", children: _jsx("div", { className: "aspect-video w-full", children: _jsx("iframe", { title: title, src: embed, className: "h-full w-full", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", allowFullScreen: true }) }) }, url));
            })] }));
}
