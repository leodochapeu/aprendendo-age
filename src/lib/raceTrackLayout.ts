import type { RankTierId } from "@/lib/rankClassification";

/** RR máximo exibido no topo da pista (Diamante I+). */
export const RACE_TRACK_MAX_RR = 2100;

export const RACE_TRACK_MIN_RR = 0;

/** Tamanho do avatar renderizado (px) — moldura compacta mobile/tablet. */
export const RACE_AVATAR_RENDER_PX = 64;

/** Avatar na pista em viewport lg+. */
export const RACE_AVATAR_RENDER_PX_LG = 88;

/** Desconto top/bottom da faixa (top-16 + bottom-32) para o portal de elo não ser cortado. */
export const RACE_TRACK_LANE_INSET_PX = 192;

/** Espaço extra no topo/base para o brilho da moldura não ser cortado. */
export const RACE_AVATAR_GLOW_PAD_PX = 28;

/** Classe Tailwind da faixa útil da pista (alinha com a linha vertical). */
export const RACE_TRACK_LANE_CLASS = "absolute inset-x-0 bottom-32 top-16";

export type RaceTierBand = {
  tierId: RankTierId;
  rrMin: number;
  rrMax: number;
};

export const RACE_TIER_BANDS: RaceTierBand[] = [
  { tierId: "bronze", rrMin: 0, rrMax: 999 },
  { tierId: "prata", rrMin: 1000, rrMax: 1299 },
  { tierId: "ouro", rrMin: 1300, rrMax: 1599 },
  { tierId: "esmeralda", rrMin: 1600, rrMax: 1799 },
  { tierId: "diamante", rrMin: 1800, rrMax: RACE_TRACK_MAX_RR },
];

const SEGMENT_HEIGHT_PERCENT = 100 / RACE_TIER_BANDS.length;

export type RaceAvatarPlacement = {
  id: string;
  /** Centro do avatar (% a partir da base da pista). */
  bottomPercent: number;
  zIndex: number;
};

export type RaceTierMarker = {
  tierId: RankTierId;
  /** RR no início da faixa (badge à direita). */
  rrStart: number;
  /** 0 = ponta inferior da pista; 100 = ponta superior. */
  percent: number;
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Início de cada faixa na pista (Bronze = 0% = ponta inferior). */
function tierSegmentStartPercent(segmentIndex: number): number {
  return segmentIndex * SEGMENT_HEIGHT_PERCENT;
}

export const RACE_TIER_MARKERS: RaceTierMarker[] = RACE_TIER_BANDS.map((band, index) => ({
  tierId: band.tierId,
  rrStart: band.rrMin,
  percent: tierSegmentStartPercent(index),
}));

function findTierBand(rr: number): { band: RaceTierBand; index: number } {
  const clampedRr = Math.max(RACE_TRACK_MIN_RR, rr);
  for (let i = 0; i < RACE_TIER_BANDS.length; i += 1) {
    const band = RACE_TIER_BANDS[i]!;
    if (clampedRr >= band.rrMin && clampedRr <= band.rrMax) {
      return { band, index: i };
    }
  }
  const lastIndex = RACE_TIER_BANDS.length - 1;
  return { band: RACE_TIER_BANDS[lastIndex]!, index: lastIndex };
}

/** Altura mínima visível de cada faixa de elo (quando vazia ou pouco povoada). */
export const RACE_BAND_MIN_HEIGHT_PX = 196;

/** Folga vertical interna da faixa (px) reservada acima/abaixo dos avatares. */
const RACE_BAND_PADDING_PX = 56;

/** Conta quantos jogadores caem em cada faixa de elo. */
function bandPlayerCounts(players: Array<{ rr: number }>): number[] {
  const counts = new Array<number>(RACE_TIER_BANDS.length).fill(0);
  for (const player of players) {
    counts[findTierBand(player.rr).index] += 1;
  }
  return counts;
}

/**
 * Altura (px) de cada faixa de elo na pista.
 * Faixas com mais jogadores crescem para caber todos sem sobreposição.
 */
function bandHeightsPx(
  players: Array<{ rr: number }>,
  avatarMinGapPx: number,
  edgeClearancePx: number,
): number[] {
  const counts = bandPlayerCounts(players);
  return counts.map((count) => {
    const body = Math.max(count, 1) * avatarMinGapPx + RACE_BAND_PADDING_PX;
    return Math.max(RACE_BAND_MIN_HEIGHT_PX, body + edgeClearancePx * 2);
  });
}

/**
 * Reposiciona avatares dentro de uma faixa, garantindo folga mínima
 * sem ultrapassar os limites [bandMin, bandMax].
 */
function resolveBandCollisions(
  bandPlayers: Array<{ id: string; rr: number }>,
  ideals: Map<string, number>,
  bandMin: number,
  bandMax: number,
  minGap: number,
): Map<string, number> {
  if (bandPlayers.length === 0) return new Map();

  const sorted = [...bandPlayers].sort(
    (a, b) => ideals.get(a.id)! - ideals.get(b.id)! || a.rr - b.rr || a.id.localeCompare(b.id),
  );
  const n = sorted.length;
  const pos = sorted.map((p) => clamp(ideals.get(p.id)!, bandMin, bandMax));

  for (let i = 1; i < n; i += 1) {
    if (pos[i]! < pos[i - 1]! + minGap) pos[i] = pos[i - 1]! + minGap;
  }

  if (n > 0 && pos[n - 1]! > bandMax) {
    const shift = pos[n - 1]! - bandMax;
    for (let i = 0; i < n; i += 1) pos[i] = pos[i]! - shift;
  }

  for (let i = n - 2; i >= 0; i -= 1) {
    if (pos[i]! > pos[i + 1]! - minGap) pos[i] = pos[i + 1]! - minGap;
  }

  if (n > 0 && pos[0]! < bandMin) {
    const shift = bandMin - pos[0]!;
    for (let i = 0; i < n; i += 1) pos[i] = Math.min(pos[i]! + shift, bandMax);
  }

  const positions = new Map<string, number>();
  sorted.forEach((player, i) => positions.set(player.id, clampPercent(pos[i]!)));
  return positions;
}

export type RaceTrackLayout = {
  /** Altura mínima do container externo (faixa + insets). */
  containerMinHeightPx: number;
  /** Altura útil da faixa (px). */
  laneHeightPx: number;
  /** Marcos de elo (0, 1000, 1300…) com percentuais dinâmicos. */
  markers: RaceTierMarker[];
  /** Avatares posicionados na linha vertical. */
  avatars: RaceAvatarPlacement[];
};

/**
 * Layout completo da pista com faixas de altura flexível.
 * O espaço entre os marcos cresce conforme a quantidade de jogadores na faixa.
 */
export type RaceTrackLayoutOptions = {
  avatarRenderPx?: number;
  avatarGlowPadPx?: number;
  /** Metade da altura do portal de elo (px). Avatares ficam fora dessa faixa. */
  gateClearancePx?: number;
};

export function computeRaceTrackLayout(
  players: Array<{ id: string; rr: number }>,
  options?: RaceTrackLayoutOptions,
): RaceTrackLayout {
  const avatarRenderPx = options?.avatarRenderPx ?? RACE_AVATAR_RENDER_PX;
  const avatarGlowPadPx = options?.avatarGlowPadPx ?? RACE_AVATAR_GLOW_PAD_PX;
  const gateClearancePx = options?.gateClearancePx ?? 0;
  const edgeClearancePx = avatarRenderPx / 2 + avatarGlowPadPx + gateClearancePx;
  const avatarMinGapPx = avatarRenderPx * 1.5;

  const heights = bandHeightsPx(players, avatarMinGapPx, edgeClearancePx);
  const laneHeightPx = Math.max(
    heights.reduce((sum, h) => sum + h, 0),
    RACE_BAND_MIN_HEIGHT_PX * RACE_TIER_BANDS.length,
  );

  // Percentual inicial (base) de cada faixa, acumulado de baixo para cima.
  const bandStartPercent: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < heights.length; i += 1) {
    bandStartPercent[i] = (cumulative / laneHeightPx) * 100;
    cumulative += heights[i]!;
  }
  const bandTopPercent = (index: number): number =>
    index + 1 < heights.length ? bandStartPercent[index + 1]! : 100;

  const markers: RaceTierMarker[] = RACE_TIER_BANDS.map((band, index) => ({
    tierId: band.tierId,
    rrStart: band.rrMin,
    percent: bandStartPercent[index]!,
  }));

  if (players.length === 0) {
    return {
      containerMinHeightPx: laneHeightPx + RACE_TRACK_LANE_INSET_PX,
      laneHeightPx,
      markers,
      avatars: [],
    };
  }

  const maxRr = Math.max(...players.map((p) => p.rr));
  const minGap = (avatarMinGapPx / laneHeightPx) * 100;
  const edgeInset = (edgeClearancePx / laneHeightPx) * 100;

  const positions = new Map<string, number>();

  for (let bandIndex = 0; bandIndex < RACE_TIER_BANDS.length; bandIndex += 1) {
    const bandPlayers = players.filter((p) => findTierBand(p.rr).index === bandIndex);
    if (bandPlayers.length === 0) continue;

    const band = RACE_TIER_BANDS[bandIndex]!;
    const bandMin = bandStartPercent[bandIndex]!;
    const bandMax = bandTopPercent(bandIndex);

    // Área útil dentro da faixa — avatares ficam abaixo da linha do próximo tier.
    const usableMin = bandMin + edgeInset;
    const usableMax = bandMax - edgeInset;
    if (usableMax <= usableMin) continue;

    const ideals = new Map<string, number>();
    for (const player of bandPlayers) {
      let rrCeiling = band.rrMax;
      if (band.tierId === "diamante") {
        rrCeiling = Math.max(maxRr, band.rrMax, player.rr);
      }
      const span = Math.max(rrCeiling - band.rrMin, 1);
      const t = clamp((player.rr - band.rrMin) / span, 0, 1);
      ideals.set(player.id, usableMin + t * (usableMax - usableMin));
    }

    const bandPositions = resolveBandCollisions(bandPlayers, ideals, usableMin, usableMax, minGap);
    for (const [id, pos] of bandPositions) positions.set(id, pos);
  }

  const avatars = [...players]
    .sort((a, b) => a.rr - b.rr || a.id.localeCompare(b.id))
    .map((player) => {
      const bottomPercent = positions.get(player.id)!;
      return {
        id: player.id,
        bottomPercent,
        zIndex: Math.min(22, 10 + Math.round(bottomPercent / 15)),
      };
    });

  return {
    containerMinHeightPx: laneHeightPx + RACE_TRACK_LANE_INSET_PX,
    laneHeightPx,
    markers,
    avatars,
  };
}

/** @deprecated Mantido para compatibilidade; avatares ficam na linha central. */
export function horizontalSpreadIndex(_index: number, _total: number): number {
  return 0;
}

/** @deprecated Agrupamento por banda de RR — use layoutRaceAvatars. */
export function groupPlayersByRrBand<T extends { id: string; rr: number }>(players: T[]): Map<number, T[]> {
  const bands = new Map<number, T[]>();
  for (const p of players) {
    const band = Math.floor(p.rr / 25) * 25;
    const list = bands.get(band) ?? [];
    list.push(p);
    bands.set(band, list);
  }
  return bands;
}
