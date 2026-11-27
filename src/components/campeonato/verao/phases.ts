/** Cores das fases do Torneio de Verão, como na planilha do chaveamento: verde, amarelo e vermelho. */

export const SUMMER_SLUG = "torneio-de-verao";

export function isSummerTournament(slug: string | undefined) {
  return slug === SUMMER_SLUG;
}

export type SummerPhaseId = "green" | "yellow" | "red";

export type SummerPhase = {
  id: SummerPhaseId;
  /** Potes que entram nessa fase, na ordem em que jogam. */
  pots: Array<"A" | "B" | "C" | "D" | "E" | "F">;
  accent: string;
  ink: string;
  wash: string;
};

export const SUMMER_PHASES: SummerPhase[] = [
  {
    id: "green",
    pots: ["F", "E"],
    accent: "#00B050",
    ink: "#D8FFE8",
    wash: "rgba(0, 176, 80, 0.16)",
  },
  {
    id: "yellow",
    pots: ["D", "C", "B"],
    accent: "#FFD400",
    ink: "#FFF4C2",
    wash: "rgba(255, 212, 0, 0.14)",
  },
  {
    id: "red",
    pots: ["A"],
    accent: "#FF2A2A",
    ink: "#FFD4D4",
    wash: "rgba(255, 42, 42, 0.16)",
  },
];

export function summerPhaseById(id: SummerPhaseId) {
  const phase = SUMMER_PHASES.find((item) => item.id === id);
  if (!phase) throw new Error(`Fase desconhecida: ${id}`);
  return phase;
}
