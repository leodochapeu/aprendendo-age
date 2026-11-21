const TIER_STYLE = {
    bronze: {
        token: "aomr_archaic_age_icon",
        surfaceClass: "bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(180,83,9,0.22),transparent)] bg-zinc-950 ring-1 ring-amber-900/35",
        titleClass: "text-amber-100",
        stepRing: "ring-amber-600/40",
        stepAccent: "text-amber-200/95",
    },
    prata: {
        token: "aomr_classical_age_icon",
        surfaceClass: "bg-[radial-gradient(ellipse_80%_55%_at_50%_18%,rgba(161,161,170,0.2),transparent)] bg-zinc-950 ring-1 ring-zinc-500/30",
        titleClass: "text-zinc-100",
        stepRing: "ring-zinc-500/45",
        stepAccent: "text-zinc-200",
    },
    ouro: {
        token: "aomr_heroic_age_icon",
        surfaceClass: "bg-[radial-gradient(ellipse_80%_55%_at_50%_18%,rgba(234,179,8,0.18),transparent)] bg-zinc-950 ring-1 ring-amber-500/25",
        titleClass: "text-amber-50",
        stepRing: "ring-amber-400/35",
        stepAccent: "text-amber-200",
    },
    esmeralda: {
        token: "aomr_mythic_age_icon",
        surfaceClass: "bg-[radial-gradient(ellipse_80%_55%_at_50%_18%,rgba(16,185,129,0.16),transparent)] bg-zinc-950 ring-1 ring-emerald-700/30",
        titleClass: "text-emerald-100",
        stepRing: "ring-emerald-500/40",
        stepAccent: "text-emerald-200/95",
    },
    diamante: {
        token: "aomr_wonder_age_icon",
        surfaceClass: "bg-[radial-gradient(ellipse_75%_50%_at_50%_15%,rgba(56,189,248,0.2),transparent)] bg-zinc-950 ring-1 ring-sky-500/35",
        titleClass: "text-sky-100",
        stepRing: "ring-sky-400/45",
        stepAccent: "text-sky-200",
    },
};
const TIER_IDS = ["bronze", "prata", "ouro", "esmeralda", "diamante"];
const STEP_KEYS = ["step3", "step2", "step1"];
function buildTier(t, id) {
    const style = TIER_STYLE[id];
    const base = `pages.rank.tiers.${id}`;
    return {
        id,
        token: style.token,
        rankName: t(`${base}.rankName`),
        eraName: t(`${base}.eraName`),
        rrBand: t(`${base}.rrBand`),
        playerShare: t(`${base}.playerShare`),
        narrative: [t(`${base}.narrative1`), t(`${base}.narrative2`)],
        steps: STEP_KEYS.map((sk) => ({
            label: t(`${base}.${sk}.label`),
            rr: t(`${base}.${sk}.rr`),
        })),
        surfaceClass: style.surfaceClass,
        titleClass: style.titleClass,
        stepRing: style.stepRing,
        stepAccent: style.stepAccent,
    };
}
/** Mesmos dados da secção TierAchievement em `RankPage`, com strings traduzidas. */
export function getRankGuideTiers(t) {
    return TIER_IDS.map((id) => buildTier(t, id));
}
