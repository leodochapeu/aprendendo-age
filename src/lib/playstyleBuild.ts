export type PlaystyleStatKey = "rush" | "turtle" | "eco";

export type PlaystyleBuildMode = {
  id: PlaystyleStatKey;
  short: string;
  label: string;
  statKey: PlaystyleStatKey;
  img: string;
  titleClass: string;
  cardClass: string;
  accent: string;
  bar: string;
  ring: string;
  tabActive: string;
  tabIdle: string;
};

export const PLAYSTYLE_BUILD_MODES: PlaystyleBuildMode[] = [
  {
    id: "rush",
    short: "Rush",
    label: "Rush (agressivo)",
    statKey: "rush",
    img: "Modo_Aggro.webp",
    titleClass: "text-pink-200",
    cardClass: "border-pink-900/40 bg-pink-950/20",
    accent: "text-pink-300",
    bar: "bg-pink-400",
    ring: "ring-pink-500/30",
    tabActive: "border-pink-500/70 bg-pink-950/50 text-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.15)]",
    tabIdle: "border-zinc-700/80 bg-zinc-900/40 text-zinc-400 hover:border-pink-800/50 hover:text-pink-200",
  },
  {
    id: "turtle",
    short: "Turtle",
    label: "Turtle (defensivo)",
    statKey: "turtle",
    img: "Modo_Turtle.webp",
    titleClass: "text-teal-200",
    cardClass: "border-teal-900/40 bg-teal-950/20",
    accent: "text-teal-300",
    bar: "bg-teal-400",
    ring: "ring-teal-500/30",
    tabActive: "border-teal-500/70 bg-teal-950/45 text-teal-100 shadow-[0_0_20px_rgba(45,212,191,0.12)]",
    tabIdle: "border-zinc-700/80 bg-zinc-900/40 text-zinc-400 hover:border-teal-800/50 hover:text-teal-200",
  },
  {
    id: "eco",
    short: "Eco",
    label: "Eco (econômico)",
    statKey: "eco",
    img: "Modo_Eco.webp",
    titleClass: "text-blue-200",
    cardClass: "border-blue-900/40 bg-blue-950/25",
    accent: "text-blue-300",
    bar: "bg-blue-400",
    ring: "ring-blue-500/30",
    tabActive: "border-blue-500/70 bg-blue-950/45 text-blue-100 shadow-[0_0_20px_rgba(96,165,250,0.12)]",
    tabIdle: "border-zinc-700/80 bg-zinc-900/40 text-zinc-400 hover:border-blue-800/50 hover:text-blue-200",
  },
];

/** Nota 1–5 da avaliação de build (Rush / Turtle / Eco). */
export function buildAvaliacaoLabel(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  switch (n) {
    case 5:
      return "Excelente";
    case 4:
      return "Ótimo";
    case 3:
      return "Bom";
    case 2:
      return "Ruim";
    case 1:
      return "Péssimo";
    default:
      return String(n);
  }
}

/** Cor do texto conforme a nota (5 verde → 1 vermelho). */
export function buildAvaliacaoScoreClassName(n: number | null | undefined): string {
  const base = "text-xs font-semibold leading-tight";
  if (n == null || Number.isNaN(n)) return `${base} text-zinc-500`;
  switch (n) {
    case 5:
      return `${base} text-emerald-400`;
    case 4:
      return `${base} text-lime-300`;
    case 3:
      return `${base} text-yellow-400`;
    case 2:
      return `${base} text-orange-400`;
    case 1:
      return `${base} text-red-400`;
    default:
      return `${base} text-zinc-400`;
  }
}
