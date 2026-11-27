import type { SummerPhaseId } from "@/components/campeonato/verao/phases";

export type SummerPotId = "A" | "B" | "C" | "D" | "E" | "F";

export type SummerPot = {
  id: SummerPotId;
  phase: SummerPhaseId;
  names: string[];
};

/** Quem pertence a cada pote. A vaga no chaveamento (F1, D1…) fica em SUMMER_DRAW. */
export const SUMMER_POTS: SummerPot[] = [
  {
    id: "A",
    phase: "red",
    names: [
      "Mosca_",
      "Tunison",
      "Borg-",
      "[KeeN]_Grass",
      "Axel_Rose",
      "Eisomarto",
      "Assem",
      "NeymarMD",
      "Veja",
      "Zapata",
      "ShaolimMatadordePorco",
      "Immortalit",
    ],
  },
  {
    id: "B",
    phase: "yellow",
    names: [
      "IamKlaus",
      "zuzuzu",
      "Phantom",
      "Zac involker",
      "Cafeína",
      "FnxllClayll",
      "Errow",
      "ThunderBR",
      "Mito",
      "GASPARZINHO",
      "Dexito",
      "Annubis",
      "Nito",
      "Motaba",
      "GUN",
      "🎀Arrow🎀",
    ],
  },
  {
    id: "C",
    phase: "yellow",
    names: [
      "ST4RC0",
      "dani..cronos",
      "SrMijo",
      "kokiri",
      "J4cK Fr0sT",
      "Carvalho",
      "MilanoGods",
      "TREMBOLONO",
      "Einherjb",
      "Pardazs",
      "Coquinha",
      "Don L",
      "JosiMythos",
      "Balerion",
      "CaOK_Berada.",
      "Hunk-",
      "IamJojo",
      "Himura",
      "PedroArthurW",
      "Light Yagami",
      "XxmelfexX",
      "Hercules",
      "Semente",
      "Tuin",
    ],
  },
  {
    id: "D",
    phase: "yellow",
    names: [
      "Carlos",
      "Forkxx",
      "Zequinha Dual God Odin e Thor",
      "Ajax Manuel",
      "ASEFGYUY",
      "Kenji",
      "Um Psicopata",
      "Pe-Vermei",
      "Banzin",
      "Pai_do_Mato",
      "xKiep",
      "LipolesSalva",
      "Hyoga de Cisne",
      "_kAbeLoOzAO",
      "Pamzita",
      "Hazity",
      "deam78",
      "Felipe Moreira",
      "ASM_Advocacia",
      "Shotokai",
      "ZeeTRETA",
      "ScoobyManíaco",
      "Kalash",
      "nemui_kuma",
    ],
  },
  {
    id: "E",
    phase: "green",
    names: [
      "TheVoidIs99",
      "HermesAOM",
      "MinhaMae~",
      "Jethro Tull",
      "marcelo.f",
      "Bo2Paraizo",
      "Cajocu01",
      "davihakodesh",
      "areczin",
      "KyllByo",
      "drcaiohistoriador (YT)",
    ],
  },
  {
    id: "F",
    phase: "green",
    names: [
      "cebolinha_H4ck3r",
      "Salahuddin",
      "Felipão",
      "Dondonees",
      "Tabuada",
      "Makise_Kurisu_00",
      "Hades",
      "NHONHO",
      "Takuje",
      "Carlos",
    ],
  },
];

const NAME_ALIAS: Record<string, string> = {
  veja: "vega",
};

export function foldSummerName(value: string) {
  return value
    .replace(/<color\b[^>]*>/gi, "")
    .replace(/<\/color>/gi, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function nameKey(value: string) {
  const folded = foldSummerName(value);
  return NAME_ALIAS[folded] ?? folded;
}

export type SummerPotPlayer = {
  id: string;
  name: string;
  /** Elo (RR). Com dois jogadores do mesmo nome, o maior elo ocupa a vaga anterior. */
  rating?: number | null;
};

export type SummerPotSlot = {
  code: string;
  sheetName: string;
  player: SummerPotPlayer | null;
};

export type LinkedSummerPot = SummerPot & {
  slots: SummerPotSlot[];
};

export function linkSummerPots(players: SummerPotPlayer[]): { pots: LinkedSummerPot[]; outside: SummerPotPlayer[] } {
  const buckets = new Map<string, SummerPotPlayer[]>();
  for (const player of players) {
    const key = nameKey(player.name);
    const list = buckets.get(key) ?? [];
    list.push(player);
    buckets.set(key, list);
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  }

  const used = new Set<string>();
  const pots = SUMMER_POTS.map((pot) => ({
    ...pot,
    slots: pot.names.map((sheetName, index) => {
      const list = buckets.get(nameKey(sheetName)) ?? [];
      const player = list.find((item) => !used.has(item.id)) ?? null;
      if (player) used.add(player.id);
      return {
        code: `${pot.id}${index + 1}`,
        sheetName: sheetName.trim(),
        player,
      };
    }),
  }));

  return {
    pots,
    outside: players.filter((player) => !used.has(player.id)),
  };
}
