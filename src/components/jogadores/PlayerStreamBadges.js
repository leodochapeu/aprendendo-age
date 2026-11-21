import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/lib/cn";
const ICON = "h-7 w-7 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]";
const INLINE_ICON = "h-9 w-9 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]";
const COMPACT_ICON = "h-8 w-8 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]";
function breathTiming(minSec, maxSec) {
    const duration = minSec + Math.random() * (maxSec - minSec);
    return {
        animationDuration: `${duration.toFixed(2)}s`,
        animationDelay: `${(-Math.random() * duration).toFixed(2)}s`,
    };
}
export function PlayerStreamBadges({ streams, placement = "floating", }) {
    const floating = placement === "floating";
    const [breath] = useState(() => floating
        ? {
            youtube: breathTiming(2.6, 4.1),
            twitch: breathTiming(3.4, 5.6),
        }
        : null);
    if (!streams.youtube && !streams.twitch)
        return null;
    const iconClass = placement === "inline" ? INLINE_ICON : placement === "compact" ? COMPACT_ICON : ICON;
    return (_jsxs("div", { className: cn("player-stream-badges", !floating && "player-stream-badges--inline"), children: [streams.youtube ? (_jsx("a", { href: streams.youtube, target: "_blank", rel: "noopener noreferrer", "aria-label": "YouTube", title: "YouTube", className: "player-stream-badges__link player-stream-badges__link--youtube", children: _jsx("span", { className: cn("player-stream-badges__breath", floating && "player-stream-badges__breath--lift"), style: breath?.youtube, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": true, className: iconClass, children: [_jsx("path", { fill: "currentColor", d: "M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6z" }), _jsx("path", { fill: "#fff", d: "M9.8 15.5V8.9l6 3.3-6 3.3z" })] }) }) })) : null, streams.twitch ? (_jsx("a", { href: streams.twitch, target: "_blank", rel: "noopener noreferrer", "aria-label": "Twitch", title: "Twitch", className: "player-stream-badges__link player-stream-badges__link--twitch", children: _jsx("span", { className: cn("player-stream-badges__breath", floating && "player-stream-badges__breath--deep"), style: breath?.twitch, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": true, className: iconClass, children: [_jsx("path", { fill: "currentColor", d: "M4.3 2 2 6.1v13.2h4.6V22l3.5-2.7h3.1L20.9 12V2H4.3zm15 9.2-2.9 2.9h-3.1l-2.7 2.7v-2.7H7.4V3.6h11.9v7.6z" }), _jsx("path", { fill: "#fff", d: "M15.5 6.2h1.6v4.7h-1.6V6.2zm-4.3 0h1.6v4.7h-1.6V6.2z" })] }) }) })) : null] }));
}
