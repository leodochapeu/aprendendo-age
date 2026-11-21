import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import { FAVOR_EFFECT_COSTS } from "@/lib/battleGame";
import { cn } from "@/lib/cn";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
export function BattleFavorModal({ open, favor, defenderRevealed, deckUnitRevealPurchased, hasLockedPreviousAgeUnits, previousAgeUnitsUnlocked, onClose, onRevealDefender, onRevealDeckUnit, onUnlockPreviousAgeUnits, }) {
    const { t } = useTranslation();
    const favorIcon = getIconFieldUrl("favoraom");
    return (_jsxs(ModalApp, { open: open, onClose: onClose, title: t("pages.battle.favorShopTitle"), description: t("pages.battle.favorShopDescription"), className: "max-w-xl", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 rounded-xl border border-blue-400/25 bg-blue-950/30 px-4 py-3", children: [favorIcon ? (_jsx("img", { src: favorIcon, alt: "", "aria-hidden": true, className: "size-7 object-contain" })) : null, _jsx("span", { className: "text-lg font-bold tabular-nums text-blue-100", children: favor }), _jsx("span", { className: "text-sm text-blue-200/70", children: t("pages.battle.favor") })] }), _jsxs("div", { className: "grid gap-3", children: [_jsx(EffectButton, { title: t("pages.battle.revealDefenderCategory"), description: t("pages.battle.revealDefenderCategoryHint"), cost: FAVOR_EFFECT_COSTS.revealDefenderCategory, disabled: defenderRevealed ||
                            favor < FAVOR_EFFECT_COSTS.revealDefenderCategory, purchased: defenderRevealed, favorIcon: favorIcon, onClick: onRevealDefender }), _jsx(EffectButton, { title: t("pages.battle.revealDeckUnitCategory"), description: t("pages.battle.revealDeckUnitCategoryHint"), cost: FAVOR_EFFECT_COSTS.revealDeckUnitCategory, disabled: deckUnitRevealPurchased ||
                            favor < FAVOR_EFFECT_COSTS.revealDeckUnitCategory, purchased: deckUnitRevealPurchased, favorIcon: favorIcon, onClick: onRevealDeckUnit }), _jsx(EffectButton, { title: t("pages.battle.unlockPreviousAgeUnits"), description: t("pages.battle.unlockPreviousAgeUnitsHint"), cost: FAVOR_EFFECT_COSTS.unlockPreviousAgeUnits, disabled: !hasLockedPreviousAgeUnits ||
                            previousAgeUnitsUnlocked ||
                            favor < FAVOR_EFFECT_COSTS.unlockPreviousAgeUnits, purchased: previousAgeUnitsUnlocked, favorIcon: favorIcon, onClick: onUnlockPreviousAgeUnits })] })] }));
}
function EffectButton({ title, description, cost, disabled, purchased, favorIcon, onClick, }) {
    const { t } = useTranslation();
    return (_jsxs("button", { type: "button", disabled: disabled, onClick: onClick, className: cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left transition", disabled
            ? "cursor-not-allowed border-zinc-800 bg-zinc-900/40 opacity-55"
            : "border-blue-400/30 bg-blue-950/20 hover:border-blue-300/55 hover:bg-blue-950/35 focus:outline-none focus:ring-2 focus:ring-blue-400/30"), children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-semibold text-blue-50", children: title }), _jsx("p", { className: "mt-1 text-xs leading-relaxed text-zinc-400", children: description })] }), _jsx("span", { className: "flex shrink-0 items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-950/50 px-2.5 py-1 text-sm font-bold tabular-nums text-blue-100", children: purchased ? (t("pages.battle.effectActive")) : (_jsxs(_Fragment, { children: [favorIcon ? (_jsx("img", { src: favorIcon, alt: "", "aria-hidden": true, className: "size-4 object-contain" })) : null, cost] })) })] }));
}
