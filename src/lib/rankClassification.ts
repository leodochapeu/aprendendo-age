export type RankTierId = "bronze" | "prata" | "ouro" | "esmeralda" | "diamante";

/** Visual dos cards de conquista (alinhado ao `RankPage` / `TierAchievement`). */
export const TIER_ACHIEVEMENT_THEME: Record<
  RankTierId,
  {
    surfaceClass: string;
    /** Fundo do card de membro no elenco do clã — degradê por tier, sem afetar bordas/stats do clã. */
    clanMemberCardBg: string;
    titleRankClass: string;
    stepRing: string;
    stepAccent: string;
    iconBlurClass: string;
  }
> = {
  bronze: {
    surfaceClass:
      "bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(180,83,9,0.22),transparent)] bg-zinc-950 ring-1 ring-amber-900/35",
    clanMemberCardBg:
      "bg-zinc-950 bg-[radial-gradient(ellipse_110%_72%_at_50%_-8%,rgba(180,83,9,0.26),transparent_52%),radial-gradient(ellipse_50%_42%_at_100%_100%,rgba(146,64,14,0.14),transparent),linear-gradient(168deg,rgba(69,26,3,0.42)_0%,rgba(9,9,11,0.9)_46%,rgb(9,9,11)_100%)]",
    titleRankClass: "text-amber-100",
    stepRing: "ring-amber-600/40",
    stepAccent: "text-amber-200/95",
    iconBlurClass: "bg-amber-800/25",
  },
  prata: {
    surfaceClass:
      "bg-[radial-gradient(ellipse_80%_55%_at_50%_18%,rgba(161,161,170,0.2),transparent)] bg-zinc-950 ring-1 ring-zinc-500/30",
    clanMemberCardBg:
      "bg-zinc-950 bg-[radial-gradient(ellipse_105%_68%_at_50%_-6%,rgba(212,212,216,0.2),transparent_50%),radial-gradient(ellipse_48%_40%_at_0%_100%,rgba(113,113,122,0.12),transparent),linear-gradient(168deg,rgba(39,39,42,0.55)_0%,rgba(9,9,11,0.9)_46%,rgb(9,9,11)_100%)]",
    titleRankClass: "text-zinc-100",
    stepRing: "ring-zinc-500/45",
    stepAccent: "text-zinc-200",
    iconBlurClass: "bg-zinc-400/15",
  },
  ouro: {
    surfaceClass:
      "bg-[radial-gradient(ellipse_80%_55%_at_50%_18%,rgba(234,179,8,0.18),transparent)] bg-zinc-950 ring-1 ring-amber-500/25",
    clanMemberCardBg:
      "bg-zinc-950 bg-[radial-gradient(ellipse_108%_70%_at_50%_-8%,rgba(234,179,8,0.24),transparent_52%),radial-gradient(ellipse_52%_44%_at_100%_95%,rgba(202,138,4,0.13),transparent),linear-gradient(168deg,rgba(69,26,3,0.35)_0%,rgba(9,9,11,0.9)_46%,rgb(9,9,11)_100%)]",
    titleRankClass: "text-amber-50",
    stepRing: "ring-amber-400/35",
    stepAccent: "text-amber-200",
    iconBlurClass: "bg-amber-500/20",
  },
  esmeralda: {
    surfaceClass:
      "bg-[radial-gradient(ellipse_80%_55%_at_50%_18%,rgba(16,185,129,0.16),transparent)] bg-zinc-950 ring-1 ring-emerald-700/30",
    clanMemberCardBg:
      "bg-zinc-950 bg-[radial-gradient(ellipse_108%_70%_at_50%_-8%,rgba(16,185,129,0.22),transparent_52%),radial-gradient(ellipse_50%_42%_at_0%_100%,rgba(5,150,105,0.12),transparent),linear-gradient(168deg,rgba(6,78,59,0.38)_0%,rgba(9,9,11,0.9)_46%,rgb(9,9,11)_100%)]",
    titleRankClass: "text-emerald-100",
    stepRing: "ring-emerald-500/40",
    stepAccent: "text-emerald-200/95",
    iconBlurClass: "bg-emerald-500/20",
  },
  diamante: {
    surfaceClass:
      "bg-[radial-gradient(ellipse_75%_50%_at_50%_15%,rgba(56,189,248,0.2),transparent)] bg-zinc-950 ring-1 ring-sky-500/35",
    clanMemberCardBg:
      "bg-zinc-950 bg-[radial-gradient(ellipse_105%_68%_at_50%_-6%,rgba(56,189,248,0.2),transparent_52%),radial-gradient(ellipse_55%_42%_at_85%_100%,rgba(14,165,233,0.1),transparent),linear-gradient(165deg,rgba(8,47,73,0.36)_0%,rgba(9,9,11,0.9)_48%,rgb(9,9,11)_100%)]",
    titleRankClass: "text-sky-100",
    stepRing: "ring-sky-400/45",
    stepAccent: "text-sky-200",
    iconBlurClass: "bg-sky-500/25",
  },
};

/** Subdivisão I / II / III — mesmas faixas que `getRankClassification` e `RANK_GUIDE_TIERS`. */
export type RankRomanStep = "I" | "II" | "III";

export function rankRomanStepFromRr(rr: number): RankRomanStep {
  const n = Number.isFinite(rr) ? Math.max(0, Math.floor(rr)) : 0;
  if (n < 1000) {
    if (n < 800) return "III";
    if (n < 900) return "II";
    return "I";
  }
  if (n < 1300) {
    if (n < 1100) return "III";
    if (n < 1200) return "II";
    return "I";
  }
  if (n < 1600) {
    if (n < 1400) return "III";
    if (n < 1500) return "II";
    return "I";
  }
  if (n < 1800) {
    if (n < 1700) return "III";
    if (n < 1750) return "II";
    return "I";
  }
  if (n < 1900) return "III";
  if (n < 2000) return "II";
  return "I";
}

/** Superfície do selo romano (gradiente + borda) — alinhado ao overlay HUD Meta. */
/** Fundo do retrato quando o avatar é o ícone padrão (PNG transparente). */
const RANK_AVATAR_DISC: Record<RankTierId, string> = {
  bronze: "radial-gradient(circle at 38% 32%, #e8b07a 0%, #a15c28 42%, #4a2812 78%, #1c100a 100%)",
  prata: "radial-gradient(circle at 38% 32%, #f4f4f5 0%, #a1a1aa 40%, #3f3f46 78%, #18181b 100%)",
  ouro: "radial-gradient(circle at 38% 32%, #fde68a 0%, #d4a017 40%, #7c4a10 76%, #2a1a06 100%)",
  esmeralda: "radial-gradient(circle at 38% 32%, #6ee7b7 0%, #059669 42%, #064e3b 78%, #022c22 100%)",
  diamante: "radial-gradient(circle at 38% 32%, #bae6fd 0%, #38bdf8 36%, #0369a1 74%, #082f49 100%)",
};

export function rankAvatarDiscBackground(tierId: RankTierId): string {
  return RANK_AVATAR_DISC[tierId];
}

export function rankRomanMedallionClass(tierId: RankTierId): string {
  const map: Record<RankTierId, string> = {
    bronze:
      "border-amber-800/55 bg-[radial-gradient(circle_at_35%_25%,rgba(251,191,36,0.22),rgba(28,25,23,0.95)_45%,rgba(12,10,8,1))] text-amber-50",
    prata:
      "border-zinc-400/45 bg-[radial-gradient(circle_at_35%_25%,rgba(228,228,231,0.2),rgba(39,39,42,0.95)_45%,rgba(9,9,11,1))] text-zinc-50",
    ouro:
      "border-amber-500/40 bg-[radial-gradient(circle_at_35%_25%,rgba(250,204,21,0.18),rgba(66,32,6,0.92)_42%,rgba(15,10,4,1))] text-amber-50",
    esmeralda:
      "border-emerald-600/45 bg-[radial-gradient(circle_at_35%_25%,rgba(52,211,153,0.2),rgba(6,46,32,0.92)_42%,rgba(3,15,10,1))] text-emerald-50",
    diamante:
      "border-sky-500/45 bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.22),rgba(12,44,68,0.92)_42%,rgba(3,12,22,1))] text-sky-50",
  };
  return map[tierId];
}

export type RankClassification = {
  tierId: RankTierId;
  /** Texto completo da categoria (ex.: Diamante | Titã). */
  categoryLabel: string;
  /** Ex.: Diamante I */
  subcategoryLabel: string;
  hintCategory: string;
  hintSub: string;
  /** Token de ícone da era (borda / identidade visual). */
  ageToken: string;
  avatarGlowClass: string;
  avatarRingClass: string;
};

export type RankRrBounds = {
  min: number;
  max: number | null;
};

/** Faixa de RR da subdivisão atual (I / II / III) — espelha `getRankClassification`. */
export function getRankRrBounds(rr: number): RankRrBounds {
  const n = Number.isFinite(rr) ? Math.max(0, Math.floor(rr)) : 0;
  if (n < 800) return { min: 0, max: 799 };
  if (n < 900) return { min: 800, max: 899 };
  if (n < 1000) return { min: 900, max: 999 };
  if (n < 1100) return { min: 1000, max: 1099 };
  if (n < 1200) return { min: 1100, max: 1199 };
  if (n < 1300) return { min: 1200, max: 1299 };
  if (n < 1400) return { min: 1300, max: 1399 };
  if (n < 1500) return { min: 1400, max: 1499 };
  if (n < 1600) return { min: 1500, max: 1599 };
  if (n < 1700) return { min: 1600, max: 1699 };
  if (n < 1750) return { min: 1700, max: 1749 };
  if (n < 1800) return { min: 1750, max: 1799 };
  if (n < 1900) return { min: 1800, max: 1899 };
  if (n < 2000) return { min: 1900, max: 1999 };
  return { min: 2000, max: null };
}

/** Alinhado ao form-retold (locales pt): Diamante | Titã, etc. */
export function getRankClassification(rr: number): RankClassification {
  if (rr < 1000) {
    const sub =
      rr < 800 ? { label: "Bronze III", hint: "Bronze III → 0 – 799 RR" } : rr < 900 ? { label: "Bronze II", hint: "Bronze II → 800 – 899 RR" } : { label: "Bronze I", hint: "Bronze I → 900 – 999 RR" };
    return {
      tierId: "bronze",
      categoryLabel: "Bronze | Arcáico",
      subcategoryLabel: sub.label,
      hintCategory: "Bronze → Abaixo de 1000 RR",
      hintSub: sub.hint,
      ageToken: "aomr_archaic_age_icon",
      avatarGlowClass: "bg-amber-600/35",
      avatarRingClass: "ring-amber-500/55 border-amber-400/40",
    };
  }
  if (rr < 1300) {
    const sub =
      rr < 1100
        ? { label: "Prata III", hint: "Prata III → 1000 – 1099 RR" }
        : rr < 1200
          ? { label: "Prata II", hint: "Prata II → 1100 – 1199 RR" }
          : { label: "Prata I", hint: "Prata I → 1200 – 1299 RR" };
    return {
      tierId: "prata",
      categoryLabel: "Prata | Clássico",
      subcategoryLabel: sub.label,
      hintCategory: "Prata → 1000 – 1299 RR",
      hintSub: sub.hint,
      ageToken: "aomr_classical_age_icon",
      avatarGlowClass: "bg-zinc-400/25",
      avatarRingClass: "ring-zinc-400/50 border-zinc-300/35",
    };
  }
  if (rr < 1600) {
    const sub =
      rr < 1400
        ? { label: "Ouro III", hint: "Ouro III → 1300 – 1399 RR" }
        : rr < 1500
          ? { label: "Ouro II", hint: "Ouro II → 1400 – 1499 RR" }
          : { label: "Ouro I", hint: "Ouro I → 1500 – 1599 RR" };
    return {
      tierId: "ouro",
      categoryLabel: "Ouro | Heróico",
      subcategoryLabel: sub.label,
      hintCategory: "Ouro → 1300 – 1599 RR",
      hintSub: sub.hint,
      ageToken: "aomr_heroic_age_icon",
      avatarGlowClass: "bg-amber-400/30",
      avatarRingClass: "ring-amber-300/50 border-amber-200/35",
    };
  }
  if (rr < 1800) {
    const sub =
      rr < 1700
        ? { label: "Esmeralda III", hint: "Esmeralda III → 1600 – 1699 RR" }
        : rr < 1750
          ? { label: "Esmeralda II", hint: "Esmeralda II → 1700 – 1749 RR" }
          : { label: "Esmeralda I", hint: "Esmeralda I → 1750 – 1799 RR" };
    return {
      tierId: "esmeralda",
      categoryLabel: "Esmeralda | Mítico",
      subcategoryLabel: sub.label,
      hintCategory: "Esmeralda → 1600 – 1799 RR",
      hintSub: sub.hint,
      ageToken: "aomr_mythic_age_icon",
      avatarGlowClass: "bg-emerald-500/30",
      avatarRingClass: "ring-emerald-400/50 border-emerald-300/35",
    };
  }
  const sub =
    rr < 1900
      ? { label: "Diamante III", hint: "Diamante III → 1800 – 1899 RR" }
      : rr < 2000
        ? { label: "Diamante II", hint: "Diamante II → 1900 – 1999 RR" }
        : { label: "Diamante I", hint: "Diamante I → 2000+ RR" };
  return {
    tierId: "diamante",
    categoryLabel: "Diamante | Titã",
    subcategoryLabel: sub.label,
    hintCategory: "Diamante → 1800+ RR",
    hintSub: sub.hint,
    ageToken: "aomr_wonder_age_icon",
    avatarGlowClass: "bg-sky-500/35",
    avatarRingClass: "ring-sky-400/55 border-sky-300/45",
  };
}
