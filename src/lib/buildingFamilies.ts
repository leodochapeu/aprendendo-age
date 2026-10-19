/**
 * Construções que só mudam o visual (e, às vezes, o texto) entre panteões ou deuses.
 * A ficha canônica fica na lista; as outras continuam no catálogo para o botão puxar
 * descrição, história e tecnologias, mas não aparecem como cartões próprios.
 */

export type BuildingFamilyMember = {
  sourceId: number;
  pantheonId: number;
  deusId?: number;
};

export type BuildingFamily = {
  canonicalId: number;
  /** `upgrade`: mesma construção, botões com o ícone de cada variante. Sem isso, a lista mostra "Geral". */
  kind?: "upgrade";
  members: BuildingFamilyMember[];
};

function family(
  canonicalId: number,
  rows: Array<[sourceId: number, pantheonId: number, deusId?: number]>,
  kind?: "upgrade",
): BuildingFamily {
  return {
    canonicalId,
    kind,
    members: rows.map(([sourceId, pantheonId, deusId]) => ({ sourceId, pantheonId, deusId })),
  };
}

const FAMILIES: BuildingFamily[] = [
  family(27, [
    [27, 1],
    [28, 2],
    [29, 3],
    [31, 4],
    [32, 5],
    [33, 6],
  ]),
  family(46, [
    [46, 1],
    [47, 2],
    [48, 3],
    [49, 4],
    [50, 5],
    [78, 6],
    [79, 7],
  ]),
  family(51, [
    [51, 1],
    [52, 2],
    [53, 3],
    [54, 4],
    [55, 5],
    [56, 6],
    [80, 7],
  ]),
  family(71, [
    [81, 1, 1],
    [82, 1, 2],
    [83, 1, 3],
    [84, 1, 78],
    [100, 2, 4],
    [85, 2, 5],
    [86, 2, 6],
    [87, 3, 7],
    [88, 3, 8],
    [89, 3, 9],
    [101, 3, 16],
    [102, 4, 10],
    [90, 4, 11],
    [103, 4, 12],
    [91, 5, 13],
    [92, 5, 14],
    [93, 5, 15],
    [94, 6, 17],
    [95, 6, 18],
    [96, 6, 19],
    [97, 7, 82],
    [98, 7, 83],
    [99, 7, 84],
  ]),
  family(64, [
    [64, 6],
    [119, 6],
  ], "upgrade"),
  family(125, [
    [125, 2],
    [126, 2],
    [127, 2],
    [128, 2],
    [129, 2, 4],
    [130, 2, 5],
    [131, 2, 6],
  ], "upgrade"),
];

const byMemberId = new Map<number, BuildingFamily>();
const byCanonicalId = new Map<number, BuildingFamily>();
for (const entry of FAMILIES) {
  byCanonicalId.set(entry.canonicalId, entry);
  for (const member of entry.members) byMemberId.set(member.sourceId, entry);
}

/** Slugs antigos da ficha que virou o nome curto (Grego era o título canônico). */
const LEGACY_SLUGS: Record<string, number> = {
  "armaria-grega": 27,
  "doca-grego": 46,
  "mercado-grego": 51,
};

const VARIANT_FIELDS = [
  "descricao_resumida",
  "descricao_avancada",
  "historia",
  "tecnologias",
  "tecnologias_ids",
  "tecnologias_id",
  "unidades",
  "unidades_ids",
  "unidades_id",
  "panteao",
  "panteao_id",
  "madeira",
  "ouro",
  "custo",
  "guarnicao",
  "pontos_de_vida",
  "dano_perfurante",
  "alcance",
  "dps",
  "velocidade_de_ataque_atk_s",
  "no_projeteis",
  "comida",
  "tempo_construir_segundos",
  "era",
  "era_id",
  "armadura_anticorte",
  "armadura_antiperfurante",
  "armadura_anticontucao",
  "armadura_anticontusao",
] as const;

/** Famílias que reúnem vários panteões aparecem como "Geral" na lista. */
export function familyListedAsGeneral(id: number): boolean {
  const entry = byCanonicalId.get(id);
  return entry != null && entry.kind !== "upgrade";
}

export function variantButtonLabel(row: { nome: string }): string {
  const rotulo = (row as { rotulo?: string }).rotulo;
  return rotulo?.trim() || row.nome;
}

export function buildingFamilyOf(id: number): BuildingFamily | undefined {
  return byMemberId.get(id) ?? byCanonicalId.get(id);
}

export function isFamilyCanonical(id: number): boolean {
  return byCanonicalId.has(id);
}

export function isHiddenFamilyMember(id: number): boolean {
  const entry = byMemberId.get(id);
  return entry != null && entry.canonicalId !== id;
}

export function legacyBuildingSlugId(slug: string): number | undefined {
  return LEGACY_SLUGS[slug];
}

export function selectedFamilyMember(entry: BuildingFamily, raw: string | null): BuildingFamilyMember {
  const id = Number(raw);
  return entry.members.find((member) => member.sourceId === id) ?? entry.members[0];
}

export function familyMemberForPantheon(canonicalId: number, pantheonId: number): number | undefined {
  return byCanonicalId.get(canonicalId)?.members.find((member) => member.pantheonId === pantheonId)?.sourceId;
}

export function construcaoPublicId(id: number): number {
  return byMemberId.get(id)?.canonicalId ?? id;
}

/** Query da variante, vazia quando o id já é a ficha canônica. */
export function construcaoVariantQuery(id: number): string {
  const entry = byMemberId.get(id);
  if (!entry || id === entry.canonicalId) return "";
  return `?v=${id}`;
}

export function variantGodLabel(nome: string): string {
  const match = nome.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() || nome;
}

export function presentFamilyMember<T extends { id: number; nome: string; ingles?: string; icon?: string }>(
  canonical: T,
  member: T,
): T {
  const next = { ...canonical } as T & Record<string, unknown>;
  const source = member as T & Record<string, unknown>;
  for (const key of VARIANT_FIELDS) {
    if (key in source) next[key] = source[key];
    else delete next[key];
  }
  next.id = canonical.id;
  next.nome = canonical.nome;
  next.ingles = canonical.ingles;
  next.icon = canonical.icon;
  return next;
}
