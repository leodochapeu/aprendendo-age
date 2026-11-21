import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
export function BattleAgeUpOverlay({ open, eraName, eraIcon, onDone }) {
    const { t } = useTranslation();
    const iconSrc = getIconFieldUrl(eraIcon);
    useEffect(() => {
        if (!open)
            return;
        const timer = window.setTimeout(onDone, 2200);
        return () => window.clearTimeout(timer);
    }, [open, onDone]);
    if (!open)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4", children: [_jsxs("div", { className: "animate-[battleAgePulse_1.8s_ease-out] text-center", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.35em] text-amber-300/80", children: t("pages.battle.ageUpLabel") }), iconSrc ? (_jsx("img", { src: iconSrc, alt: "", "aria-hidden": true, className: "mx-auto mt-4 size-24 object-contain drop-shadow-[0_0_24px_rgba(251,191,36,0.45)]" })) : null, _jsx("p", { className: "mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-wide text-amber-50 sm:text-5xl", children: eraName }), _jsx("p", { className: "mt-2 text-sm text-zinc-400", children: t("pages.battle.ageUpHint") })] }), _jsx("style", { children: `
        @keyframes battleAgePulse {
          0% { opacity: 0; transform: scale(0.86); }
          25% { opacity: 1; transform: scale(1.04); }
          70% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.9; transform: scale(1); }
        }
      ` })] }), document.body);
}
