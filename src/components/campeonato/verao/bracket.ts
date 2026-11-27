import type { SummerPhaseId } from "@/components/campeonato/verao/phases";

export type SummerSlot =
  | { kind: "seed"; code: string }
  | { kind: "winner"; of: string }
  | { kind: "loser"; of: string };

export type SummerMatch = {
  id: string;
  round: number;
  /** Linha da planilha. Define o alinhamento vertical da chave. */
  row: number;
  a: SummerSlot;
  b: SummerSlot;
  badge?: "final" | "third";
};

export type SummerRound = {
  name: string;
  phase: SummerPhaseId;
};

export const SUMMER_ROUNDS: SummerRound[] = [
  { name: "Pote F", phase: "green" },
  { name: "Pote E", phase: "green" },
  { name: "Pote D", phase: "yellow" },
  { name: "Avanço D", phase: "yellow" },
  { name: "Pote C", phase: "yellow" },
  { name: "Pote B", phase: "yellow" },
  { name: "Avanço B", phase: "yellow" },
  { name: "Pré-A", phase: "yellow" },
  { name: "Pote A", phase: "red" },
  { name: "Quartas", phase: "red" },
  { name: "Semifinal", phase: "red" },
  { name: "Final", phase: "red" },
];

function seed(code: string): SummerSlot {
  return { kind: "seed", code };
}

function winner(of: string): SummerSlot {
  return { kind: "winner", of };
}

function loser(of: string): SummerSlot {
  return { kind: "loser", of };
}

function match(id: string, round: number, row: number, a: SummerSlot, b: SummerSlot, badge?: SummerMatch["badge"]): SummerMatch {
  return { id, round, row, a, b, badge };
}

function buildSummerMatches(): SummerMatch[] {
  const f = [1, 2, 3, 4, 5].map((index) =>
    match(`f${index}`, 0, 4 + index * 2, seed(`F${index * 2 - 1}`), seed(`F${index * 2}`)),
  );

  const e = [
    ...f.map((item, index) => match(`e${index + 1}`, 1, item.row, winner(item.id), seed(`E${index + 1}`))),
    match("e6", 1, 16, seed("E6"), seed("E7")),
    match("e7", 1, 18, seed("E8"), seed("E9")),
    match("e8", 1, 20, seed("E10"), seed("E11")),
  ];

  const d = [
    ...e.map((item, index) => match(`d${index + 1}`, 2, item.row, winner(item.id), seed(`D${index + 1}`))),
    ...Array.from({ length: 8 }, (_, index) => {
      const left = 9 + index * 2;
      return match(`d${9 + index}`, 2, 22 + index * 2, seed(`D${left}`), seed(`D${left + 1}`));
    }),
  ];

  const advanceD = Array.from({ length: 8 }, (_, index) => {
    const left = d[index * 2];
    const right = d[index * 2 + 1];
    return match(`p${index + 1}`, 3, (left.row + right.row) / 2, winner(left.id), winner(right.id));
  });

  const c = Array.from({ length: 8 }, (_, index) => {
    const pairCode = 1 + index * 3;
    const feedCode = 3 + index * 3;
    return [
      match(`c${index * 2 + 1}`, 4, 5 + index * 4, seed(`C${pairCode}`), seed(`C${pairCode + 1}`)),
      match(`c${index * 2 + 2}`, 4, 7 + index * 4, winner(advanceD[index].id), seed(`C${feedCode}`)),
    ];
  }).flat();

  const b = c.map((item, index) => match(`b${index + 1}`, 5, item.row, winner(item.id), seed(`B${index + 1}`)));

  const advanceB = Array.from({ length: 8 }, (_, index) => {
    const left = b[index * 2];
    const right = b[index * 2 + 1];
    return match(`ab${index + 1}`, 6, (left.row + right.row) / 2, winner(left.id), winner(right.id));
  });

  const preA = Array.from({ length: 4 }, (_, index) => {
    const left = advanceB[index * 2];
    const right = advanceB[index * 2 + 1];
    return match(`af${index + 1}`, 7, (left.row + right.row) / 2, winner(left.id), winner(right.id));
  });

  const a = [
    match("a1", 8, 6, winner("af1"), seed("A1")),
    match("a2", 8, 10, seed("A2"), seed("A3")),
    match("a3", 8, 14, winner("af2"), seed("A4")),
    match("a4", 8, 18, seed("A5"), seed("A6")),
    match("a5", 8, 22, winner("af3"), seed("A7")),
    match("a6", 8, 26, seed("A8"), seed("A9")),
    match("a7", 8, 30, winner("af4"), seed("A10")),
    match("a8", 8, 34, seed("A11"), seed("A12")),
  ];

  const quarters = Array.from({ length: 4 }, (_, index) => {
    const left = a[index * 2];
    const right = a[index * 2 + 1];
    return match(`qf${index + 1}`, 9, (left.row + right.row) / 2, winner(left.id), winner(right.id));
  });

  const semi = [
    match("sf1", 10, (quarters[0].row + quarters[1].row) / 2, winner(quarters[0].id), winner(quarters[1].id)),
    match("sf2", 10, (quarters[2].row + quarters[3].row) / 2, winner(quarters[2].id), winner(quarters[3].id)),
  ];

  const final = match("final", 11, (semi[0].row + semi[1].row) / 2, winner(semi[0].id), winner(semi[1].id), "final");
  const third = match("third", 11, semi[1].row + 4, loser(semi[0].id), loser(semi[1].id), "third");

  return [...f, ...e, ...d, ...advanceD, ...c, ...b, ...advanceB, ...preA, ...a, ...quarters, ...semi, final, third];
}

export const SUMMER_MATCHES: SummerMatch[] = buildSummerMatches();
