import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BattleAgeUpOverlay } from "@/components/battle/BattleAgeUpOverlay";
import { BattleConfirmModal } from "@/components/battle/BattleConfirmModal";
import { BattleFavorModal } from "@/components/battle/BattleFavorModal";
import { BattleUnitPortrait } from "@/components/battle/BattleUnitPortrait";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { buildBattleResultIndex, buildRoundPlan, filterAttackerPool, INITIAL_FAVOR, isUnitFromPreviousEra, pickRandomUniqueIds, pickDefender, purchaseFavorEffect, resolvePlayerChoice, rewardFavor, summarizeRun, willAgeUp, } from "@/lib/battleGame";
import { cn } from "@/lib/cn";
import { firstNome } from "@/lib/entityRefs";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import { NotionText } from "@/components/ui/NotionText";
function outcomeClass(outcome) {
    if (outcome === "win")
        return "border-emerald-500/50 bg-emerald-950/50 text-emerald-200";
    if (outcome === "loss")
        return "border-rose-500/50 bg-rose-950/50 text-rose-200";
    return "border-amber-500/40 bg-amber-950/40 text-amber-100";
}
function initialDefender(units, eraId) {
    const defender = pickDefender(units, eraId, []);
    return {
        defenderId: defender?.id ?? null,
        used: defender ? [defender.id] : [],
    };
}
export function BattleRandomPage() {
    const { pantheonSlug } = useParams();
    const { t } = useTranslation();
    const catalog = useCatalog();
    const { panteaoBySlug } = catalog;
    const pantheon = pantheonSlug ? panteaoBySlug.get(pantheonSlug) : undefined;
    const [index, setIndex] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [bootKey, setBootKey] = useState(0);
    useEffect(() => {
        let cancelled = false;
        void import("@/data/unidades_aom_battle_results.json")
            .then((mod) => {
            if (cancelled)
                return;
            const rows = (mod.default ?? mod);
            setIndex(buildBattleResultIndex(rows));
        })
            .catch(() => {
            if (!cancelled)
                setLoadError(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    if (!pantheonSlug || !pantheon) {
        return _jsx(Navigate, { to: "/battle/random", replace: true });
    }
    if (loadError) {
        return (_jsx("div", { className: "rounded-2xl border border-rose-500/40 bg-rose-950/30 p-6 text-rose-100", children: t("pages.battle.loadError") }));
    }
    if (!index) {
        return (_jsx("div", { className: "flex min-h-48 items-center justify-center text-sm text-zinc-400", children: t("pages.battle.loading") }));
    }
    return (_jsx(BattleRandomSession, { pantheon: pantheon, index: index, catalog: catalog, onRestart: () => setBootKey((k) => k + 1) }, `${pantheon.id}-${bootKey}`));
}
function BattleRandomSession({ pantheon, index, catalog, onRestart, }) {
    const { t } = useTranslation();
    const { unidades, unidadeById, eras, eraById } = catalog;
    const plan = useMemo(() => buildRoundPlan(), []);
    const firstEra = (plan[0]?.eraId ?? 2);
    const first = initialDefender(unidades, firstEra);
    const [phase, setPhase] = useState("playing");
    const [roundIndex, setRoundIndex] = useState(0);
    const [defenderId, setDefenderId] = useState(first.defenderId);
    const [usedDefenderIds, setUsedDefenderIds] = useState(first.used);
    const [pendingAttackerId, setPendingAttackerId] = useState(null);
    const [history, setHistory] = useState([]);
    const [lastResult, setLastResult] = useState(null);
    const [ageUpEraId, setAgeUpEraId] = useState(null);
    const [favor, setFavor] = useState(INITIAL_FAVOR);
    const [favorModalOpen, setFavorModalOpen] = useState(false);
    const [revealDefenderCategory, setRevealDefenderCategory] = useState(false);
    const [revealDeckUnitArmed, setRevealDeckUnitArmed] = useState(false);
    const [revealedAttackerId, setRevealedAttackerId] = useState(null);
    const [unlockedPreviousAgeUnitIds, setUnlockedPreviousAgeUnitIds] = useState([]);
    const currentEraId = (plan[roundIndex]?.eraId ?? 2);
    const currentEra = eraById.get(currentEraId);
    const attackerPool = useMemo(() => filterAttackerPool(unidades, pantheon.id, currentEraId), [unidades, pantheon.id, currentEraId]);
    const previousAgeUnitIds = useMemo(() => attackerPool
        .filter((unit) => isUnitFromPreviousEra(unit, currentEraId))
        .map((unit) => unit.id), [attackerPool, currentEraId]);
    const unlockedPreviousAgeUnitIdSet = useMemo(() => new Set(unlockedPreviousAgeUnitIds), [unlockedPreviousAgeUnitIds]);
    const lockedPreviousAgeUnitIds = previousAgeUnitIds.filter((id) => !unlockedPreviousAgeUnitIdSet.has(id));
    const defender = defenderId != null ? unidadeById.get(defenderId) : undefined;
    const pendingAttacker = pendingAttackerId != null ? unidadeById.get(pendingAttackerId) : undefined;
    const wins = history.filter((h) => h.outcome === "win").length;
    const losses = history.filter((h) => h.outcome === "loss").length;
    const draws = history.filter((h) => h.outcome === "draw").length;
    const deckUnitRevealPurchased = revealDeckUnitArmed || revealedAttackerId != null;
    const selectAttacker = (attackerId) => {
        setPendingAttackerId(attackerId);
        if (revealDeckUnitArmed && revealedAttackerId == null) {
            setRevealedAttackerId(attackerId);
            setRevealDeckUnitArmed(false);
        }
    };
    const buyDefenderReveal = () => {
        const nextFavor = purchaseFavorEffect(favor, "revealDefenderCategory");
        if (nextFavor == null || revealDefenderCategory)
            return;
        setFavor(nextFavor);
        setRevealDefenderCategory(true);
    };
    const buyDeckUnitReveal = () => {
        const nextFavor = purchaseFavorEffect(favor, "revealDeckUnitCategory");
        if (nextFavor == null || deckUnitRevealPurchased)
            return;
        setFavor(nextFavor);
        setRevealDeckUnitArmed(true);
        setFavorModalOpen(false);
    };
    const buyPreviousAgeUnlock = () => {
        const nextFavor = purchaseFavorEffect(favor, "unlockPreviousAgeUnits");
        if (nextFavor == null ||
            unlockedPreviousAgeUnitIds.length > 0 ||
            lockedPreviousAgeUnitIds.length === 0) {
            return;
        }
        const unlocked = pickRandomUniqueIds(lockedPreviousAgeUnitIds, 2);
        setFavor(nextFavor);
        setUnlockedPreviousAgeUnitIds(unlocked);
        setFavorModalOpen(false);
    };
    const confirmAttack = useCallback(() => {
        if (!pendingAttacker || !defender || phase !== "playing")
            return;
        const resolved = resolvePlayerChoice(index, pendingAttacker.id, defender.id);
        if (!resolved)
            return;
        const record = {
            index: roundIndex,
            eraId: currentEraId,
            defenderId: defender.id,
            attackerId: pendingAttacker.id,
            outcome: resolved.outcome,
            mode: resolved.result.mode,
        };
        setHistory((prev) => [...prev, record]);
        setLastResult({
            outcome: resolved.outcome,
            mode: resolved.result.mode,
            attacker: pendingAttacker,
            defender,
        });
        setFavor((current) => rewardFavor(current, resolved.outcome));
        setPendingAttackerId(null);
        setPhase("result");
    }, [pendingAttacker, defender, phase, index, roundIndex, currentEraId]);
    const continueAfterResult = useCallback(() => {
        const nextIndex = roundIndex + 1;
        if (nextIndex >= plan.length) {
            setPhase("summary");
            return;
        }
        setRevealDefenderCategory(false);
        setRevealDeckUnitArmed(false);
        setRevealedAttackerId(null);
        setUnlockedPreviousAgeUnitIds([]);
        setFavorModalOpen(false);
        if (willAgeUp(plan, roundIndex)) {
            setAgeUpEraId(plan[nextIndex].eraId);
            setPhase("age_up");
            return;
        }
        const nextEra = plan[nextIndex].eraId;
        const nextDefender = pickDefender(unidades, nextEra, usedDefenderIds);
        setRoundIndex(nextIndex);
        setDefenderId(nextDefender?.id ?? null);
        if (nextDefender) {
            setUsedDefenderIds((prev) => prev.includes(nextDefender.id) ? prev : [...prev, nextDefender.id]);
        }
        setLastResult(null);
        setPhase("playing");
    }, [roundIndex, plan, unidades, usedDefenderIds]);
    const finishAgeUp = useCallback(() => {
        const nextIndex = roundIndex + 1;
        const nextEra = plan[nextIndex]?.eraId ?? currentEraId;
        const nextDefender = pickDefender(unidades, nextEra, usedDefenderIds);
        setRoundIndex(nextIndex);
        setDefenderId(nextDefender?.id ?? null);
        if (nextDefender) {
            setUsedDefenderIds((prev) => prev.includes(nextDefender.id) ? prev : [...prev, nextDefender.id]);
        }
        setAgeUpEraId(null);
        setLastResult(null);
        setPhase("playing");
    }, [roundIndex, plan, currentEraId, unidades, usedDefenderIds]);
    if (defenderId == null) {
        return (_jsx("div", { className: "rounded-2xl border border-rose-500/40 bg-rose-950/30 p-6 text-rose-100", children: t("pages.battle.noDefender") }));
    }
    if (phase === "summary") {
        const summary = summarizeRun(history);
        return (_jsxs("div", { className: "mx-auto max-w-3xl", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-3xl font-semibold tracking-wide text-amber-100", children: t("pages.battle.summaryTitle") }), _jsx("p", { className: "mt-2 text-sm text-zinc-400", children: t("pages.battle.summaryDescription") }), _jsxs("div", { className: "mt-6 grid grid-cols-3 gap-3", children: [_jsx(StatCard, { label: t("pages.battle.wins"), value: summary.wins, tone: "win" }), _jsx(StatCard, { label: t("pages.battle.losses"), value: summary.losses, tone: "loss" }), _jsx(StatCard, { label: t("pages.battle.draws"), value: summary.draws, tone: "draw" })] }), _jsx("div", { className: "mt-6 grid gap-3 sm:grid-cols-3", children: [2, 3, 4].map((eraId) => {
                        const era = eraById.get(eraId);
                        const stats = summary.byEra[eraId];
                        return (_jsxs("div", { className: "rounded-xl border border-aom-border bg-zinc-950/70 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-zinc-500", children: era?.nome ?? `Era ${eraId}` }), _jsx("p", { className: "mt-2 text-sm text-zinc-300", children: t("pages.battle.eraStats", {
                                        wins: String(stats.wins),
                                        losses: String(stats.losses),
                                        draws: String(stats.draws),
                                    }) })] }, eraId));
                    }) }), _jsx("ul", { className: "mt-6 space-y-2", children: summary.history.map((row) => {
                        const atk = unidadeById.get(row.attackerId);
                        const def = unidadeById.get(row.defenderId);
                        const era = eras.find((e) => e.id === row.eraId);
                        return (_jsxs("li", { className: cn("flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-sm", outcomeClass(row.outcome)), children: [_jsxs("span", { className: "font-semibold", children: ["#", row.index + 1] }), _jsx("span", { className: "text-zinc-400", children: era?.nome }), _jsxs("span", { children: [atk?.nome ?? row.attackerId, " \u2192 ", def?.nome ?? row.defenderId] }), _jsx("span", { className: "ml-auto font-semibold uppercase", children: t(`pages.battle.outcome.${row.outcome}`) })] }, row.index));
                    }) }), _jsxs("div", { className: "mt-8 flex flex-col gap-2 sm:flex-row", children: [_jsx("button", { type: "button", onClick: onRestart, className: "rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30", children: t("pages.battle.playAgain") }), _jsx(Link, { to: "/battle", className: "rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-2.5 text-center text-sm font-medium text-zinc-200 transition hover:border-zinc-500", children: t("pages.battle.backToMenu") })] })] }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-5xl", children: [_jsxs("header", { className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/80", children: t("pages.battle.randomBattle") }), _jsx("h1", { className: "mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-amber-50 sm:text-3xl", children: pantheon.nome }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: t("pages.battle.roundProgress", {
                                    current: String(roundIndex + 1),
                                    total: String(plan.length),
                                }) }), _jsxs("button", { type: "button", disabled: phase !== "playing", onClick: () => setFavorModalOpen(true), className: "mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/35 px-3 py-1.5 text-sm font-semibold text-blue-100 shadow-sm shadow-blue-950/40 transition hover:border-blue-300/55 hover:bg-blue-950/55 focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-55", children: [getIconFieldUrl("favoraom") ? (_jsx("img", { src: getIconFieldUrl("favoraom"), alt: "", "aria-hidden": true, className: "size-5 object-contain" })) : null, _jsx("span", { className: "tabular-nums", children: favor }), _jsx("span", { className: "font-medium text-blue-200/75", children: t("pages.battle.favor") })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [_jsx(ScorePill, { label: t("pages.battle.wins"), value: wins, tone: "win" }), _jsx(ScorePill, { label: t("pages.battle.losses"), value: losses, tone: "loss" }), _jsx(ScorePill, { label: t("pages.battle.draws"), value: draws, tone: "draw" })] })] }), _jsxs("div", { className: "mb-6 flex items-center gap-3 rounded-xl border border-aom-border bg-zinc-950/70 px-4 py-3", children: [currentEra?.icon ? (_jsx("img", { src: getIconFieldUrl(currentEra.icon), alt: "", "aria-hidden": true, className: "size-10 object-contain" })) : null, _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wider text-zinc-500", children: t("pages.battle.currentAge") }), _jsx("p", { className: "font-semibold text-amber-100", children: currentEra?.nome ?? `Era ${currentEraId}` })] }), _jsx("div", { className: "ml-auto flex gap-1", children: plan.map((r) => (_jsx("span", { className: cn("size-2.5 rounded-full", r.index < roundIndex
                                ? "bg-amber-400"
                                : r.index === roundIndex
                                    ? "bg-amber-200 ring-2 ring-amber-400/40"
                                    : "bg-zinc-700"), title: `#${r.index + 1}` }, r.index))) })] }), _jsxs("section", { className: "grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start", children: [_jsxs("div", { className: "rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-300/90", children: t("pages.battle.yourDeck") }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: t("pages.battle.pickUnitHint") }), _jsx("ul", { className: "mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6", children: attackerPool.map((u) => {
                                    const locked = isUnitFromPreviousEra(u, currentEraId) &&
                                        !unlockedPreviousAgeUnitIdSet.has(u.id);
                                    return (_jsx("li", { className: "flex justify-center", children: _jsx(BattleUnitPortrait, { nome: u.nome, icon: u.icon, size: "sm", locked: locked, disabled: phase !== "playing" || locked, selected: pendingAttackerId === u.id, onClick: () => selectAttacker(u.id) }) }, u.id));
                                }) }), attackerPool.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-rose-300", children: t("pages.battle.emptyDeck") })) : null] }), _jsx("div", { className: "hidden items-center justify-center lg:flex", children: _jsx("span", { className: "font-[family-name:var(--font-display)] text-3xl font-bold text-amber-400", children: "VS" }) }), _jsxs("div", { className: "rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-rose-300/90", children: t("pages.battle.enemy") }), defender ? (_jsxs("div", { className: "mt-4 flex flex-col items-center gap-3 text-center", children: [_jsx(BattleUnitPortrait, { nome: defender.nome, icon: defender.icon, size: "lg" }), _jsx("p", { className: "font-semibold text-amber-50", children: defender.nome }), revealDefenderCategory ? (_jsx(UnidadeTipoLine, { tipo: defender.tipo, colored: true, className: "justify-center" })) : null, firstNome(defender.panteao) ? (_jsx("p", { className: "text-xs text-zinc-400", children: _jsx(NotionText, { text: firstNome(defender.panteao) }) })) : null] })) : (_jsx("p", { className: "mt-4 text-sm text-zinc-400", children: t("pages.battle.noDefender") }))] })] }), phase === "result" && lastResult ? (_jsxs("div", { className: cn("mt-6 rounded-2xl border p-5", outcomeClass(lastResult.outcome)), children: [_jsx("p", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold", children: t(`pages.battle.outcome.${lastResult.outcome}`) }), _jsxs("p", { className: "mt-1 text-sm opacity-90", children: [lastResult.attacker.nome, " vs ", lastResult.defender.nome] }), _jsx("p", { className: "mt-2 text-xs uppercase tracking-wider opacity-70", children: lastResult.mode === "mode_category_battle"
                            ? t("pages.battle.modeCategory")
                            : t("pages.battle.modeAttributes") }), _jsx("button", { type: "button", onClick: continueAfterResult, className: "mt-4 rounded-xl border border-white/20 bg-black/25 px-4 py-2.5 text-sm font-semibold transition hover:bg-black/40", children: roundIndex + 1 >= plan.length
                            ? t("pages.battle.seeSummary")
                            : t("pages.battle.continue") })] })) : null, _jsx(BattleConfirmModal, { open: pendingAttackerId != null && phase === "playing", attacker: pendingAttacker ?? null, defender: defender ?? null, revealAttackerCategory: pendingAttackerId != null &&
                    pendingAttackerId === revealedAttackerId, revealDefenderCategory: revealDefenderCategory, onClose: () => setPendingAttackerId(null), onConfirm: confirmAttack }), _jsx(BattleFavorModal, { open: favorModalOpen && phase === "playing", favor: favor, defenderRevealed: revealDefenderCategory, deckUnitRevealPurchased: deckUnitRevealPurchased, hasLockedPreviousAgeUnits: lockedPreviousAgeUnitIds.length > 0, previousAgeUnitsUnlocked: unlockedPreviousAgeUnitIds.length > 0, onClose: () => setFavorModalOpen(false), onRevealDefender: buyDefenderReveal, onRevealDeckUnit: buyDeckUnitReveal, onUnlockPreviousAgeUnits: buyPreviousAgeUnlock }), _jsx(BattleAgeUpOverlay, { open: phase === "age_up" && ageUpEraId != null, eraId: ageUpEraId ?? 3, eraName: eraById.get(ageUpEraId ?? 3)?.nome ?? "", eraIcon: eraById.get(ageUpEraId ?? 3)?.icon, onDone: finishAgeUp })] }));
}
function ScorePill({ label, value, tone, }) {
    return (_jsxs("span", { className: cn("rounded-full border px-3 py-1 font-semibold tabular-nums", tone === "win" && "border-emerald-500/40 bg-emerald-950/40 text-emerald-200", tone === "loss" && "border-rose-500/40 bg-rose-950/40 text-rose-200", tone === "draw" && "border-amber-500/40 bg-amber-950/40 text-amber-100"), children: [label, ": ", value] }));
}
function StatCard({ label, value, tone, }) {
    return (_jsxs("div", { className: cn("rounded-xl border p-4 text-center", outcomeClass(tone === "win" ? "win" : tone === "loss" ? "loss" : "draw")), children: [_jsx("p", { className: "text-xs uppercase tracking-wider opacity-80", children: label }), _jsx("p", { className: "mt-1 text-3xl font-bold tabular-nums", children: value })] }));
}
