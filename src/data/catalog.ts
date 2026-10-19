import aldeoesJson from "./locale/pt/aldeoes.json";
import construcoesJson from "./locale/pt/construcoes.json";
import deusesJson from "./locale/pt/deuses_aom.json";
import erasJson from "./locale/pt/eras.json";
import godpowersJson from "./locale/pt/godpowers.json";
import mapasJson from "./locale/pt/mapas.json";
import reliquiasJson from "./locale/pt/reliquias.json";

/** Entrada em `mapas.json` — campos sim/não são booleanos para i18n. */
export type Mapa = {
  nome: string;
  ingles: string;
  mapas_da_ranqueada: boolean;
  saiu_da_ranqueada: boolean;
  origem: string[];
  padrao: boolean;
  partidas_rapidas: boolean;
  tipo: string;
  /** Token `aomr_…` em `token_asset_map` (preenchido no JSON; não deriva de `ingles`). */
  icon: string | null;
  /** Rollover curto do seletor de mapas (`STR_MAP_*_DESC`). */
  descricao_resumida?: string;
  /** Texto da tela de carregamento (`STR_MAP_*_DESC_LOAD`), se diferente do curto. */
  historia?: string;
};
import { buildIndexSlugMaps, buildRecordSlugMaps } from "@/lib/entitySlug";
import { buildTecnologiaNotionIdIndexMap } from "@/lib/tecnologiaIndex";
import type { EntityNumRef } from "@/lib/entityRefs";
import type { UnidadeMultiplicadorItem } from "@/lib/unidadeMultiplicador";
import type { UnidadeTipoItem } from "@/lib/unidadeTipo";

import panteoesJson from "./locale/pt/panteoes.json";
import startsBuildOrderJson from "./locale/pt/starts_build_order.json";
import tecnologiasJson from "./locale/pt/tecnologias.json";
import unidadesJson from "./locale/pt/unidades_aom.json";

export type StartTableRow = {
  description: string;
  food: string | null;
  wood: string | null;
  gold: string | null;
  favor: string | null;
  pop: string | null;
  type: string | null;
};

/** Valores de `StartTableRow.type` usados no CSS (`StartStructuredContent`). */
export const START_TABLE_ROW_TYPE_OPTIONS = [
  { value: "", label: "(padrão)" },
  { value: "hint", label: "hint — dica" },
  { value: "blue", label: "blue — destaque azul" },
  { value: "pink", label: "pink — era / marco" },
  { value: "teal", label: "teal" },
  { value: "orange", label: "orange" },
  { value: "red", label: "red" },
  { value: "gray", label: "gray (como hint)" },
] as const;

export type StartLeadBlock =
  | { kind: "callout"; text: string }
  | { kind: "heading"; level: 1 | 2 | 3; text: string };

/** Rodapé após a tabela: parágrafos simples, títulos ou callouts. */
export type StartFooterBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "callout"; text: string }
  | { kind: "heading"; level: 1 | 2 | 3; text: string };

export type StartBuildSegment = {
  lead?: StartLeadBlock[];
  table?: StartTableRow[];
  footer?: StartFooterBlock[];
};

export type StartStructured = {
  segments: StartBuildSegment[];
};

/** Blocos do corpo legado Notion (`page-body`) para deuses com hierarquia Maior. */
export type DeusExplicacaoBloco =
  | { tipo: "citacao"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "titulo"; texto: string }
  | { tipo: "paragrafo"; texto: string };

export type DeusExplicacaoMaior = {
  blocos: DeusExplicacaoBloco[];
};

export type StartBuildOrderAuthor = {
  name: string;
  imageUrl?: string;
};

export type StartBuildOrder = {
  id: number;
  /** Rota `/starts/:slug` — derivado de título + autores (ver `buildStartSlug`). */
  slug: string;
  /** Ex.: `"new"` — lista em `/starts` coloca no topo e mostra etiqueta «Novo!». */
  status?: string;
  titulo: string;
  /** Autor(es) do build (após « - por » no Notion); vários separados por | no texto original. */
  author: StartBuildOrderAuthor[];
  /** Deuses major/minor inferidos do título ou da civilização. */
  god: string[];
  /**
   * Chave em `token_asset_map.json`: ícone do deus (se `god` tiver 1 nome) ou do panteão.
   * @see panteoes.json `icon` / deuses `icon`
   */
  image: string;
  /** Nome do panteão em `panteoes.json` (ex.: Grego, Chinês); opcional se não houver match. */
  pantheon?: string;
  youtube: string[];
  descricao_curta: string;
  /** Conteúdo em dados (mini-markup), sem HTML do Notion. */
  structured: StartStructured;
};

export const startsBuildOrder = startsBuildOrderJson as StartBuildOrder[];
export const startById = new Map(startsBuildOrder.map((s) => [s.id, s]));
export const startBySlug = new Map(startsBuildOrder.map((s) => [s.slug, s]));

export const aldeoes = aldeoesJson;
export const construcoes = construcoesJson;
export const deuses = deusesJson;
export const eras = erasJson;
export const mapas = mapasJson as Mapa[];

/** Referência `{ id, nome }` nos arrays `deuses`, `vill` e `starts` de `panteoes.json`. */
export type PanteaoRef = EntityNumRef;

/** Entrada em `godpowers.json` — deus, era e panteão como listas de {@link EntityNumRef}. */
export type Godpower = {
  id: number;
  nome: string;
  god: EntityNumRef[];
  era: EntityNumRef[];
  panteao: EntityNumRef[];
  icon: string;
  ingles?: string;
  cooldown_seg?: number;
  duracao_no_mapa_seg?: number;
  custo_repetir?: number;
  incremento_por_uso?: string | number;
  descricao_resumida?: string;
  descricao_avancada?: string;
};

export const godpowers = godpowersJson as Godpower[];

/** Entrada em `reliquias.json` — bônus de mapa obtidos em templos. */
export type Relic = {
  id: number;
  nome: string;
  ingles?: string;
  icon?: string;
  descricao_resumida?: string;
  descricao_avancada?: string;
};

export const reliquias = reliquiasJson as Relic[];

/** Entrada em `tecnologias.json` — custos e textos opcionais conforme a linha. */
export type Tecnologia = {
  nome: string;
  eras: EntityNumRef[];
  construcao_origem: EntityNumRef[] | string;
  /** `"Geral"` ou lista quando há `panteoes` civ‑específico no dado. */
  panteoes?: string | EntityNumRef[];
  god_especifico?: string | EntityNumRef[];
  beneficia?: string;
  /** Cada item = um efeito mecânico (parágrafo do corpo da página Notion). */
  campo?: string[];
  /** Rollover curto do jogo (`STR_TECH_*_LR`). */
  descricao_resumida?: string;
  /** Enciclopédia do jogo (`STR_HISTORY_TECHS_*`). */
  historia?: string;
  comida?: number;
  favor?: number;
  icon: string;
  ingles?: string;
  madeira?: number;
  ouro?: number;
  tempo_s?: number;
  tipo?: string;
  todas_as_tecnologias?: string;
};

export const tecnologias = tecnologiasJson as Tecnologia[];

/** Habilidade especial de unidade (extraída do jogo). */
export type UnidadeHabilidade = {
  nome: string;
  descricao?: string;
  /** Token em `token_asset_map.json` (sem `:`). */
  icon?: string;
};

/** Entrada em `unidades_aom.json` — campos de combate/recursos opcionais conforme o tipo de unidade. */
export type Unidade = {
  id: number;
  nome: string;
  panteao: EntityNumRef[];
  era: EntityNumRef[];
  tipo: UnidadeTipoItem[];
  icon: string;
  ingles?: string;
  counter_de?: string;
  multiplicador?: UnidadeMultiplicadorItem[];
  categoria?: UnidadeTipoItem[];
  forte_contra?: string;
  fraco_contra?: string;
  construcao?: EntityNumRef[];
  god_dono?: EntityNumRef[];
  /** Rollover curto do jogo (SR). */
  descricao_resumida?: string;
  /** Rollover longo do jogo (LR), quando difere do curto. */
  descricao_avancada?: string;
  /** Habilidades especiais (Gore, Volley, transformações, etc.). */
  habilidades?: UnidadeHabilidade[];
  /** Texto de enciclopédia do jogo (`STR_HISTORY_UNITS_*`). */
  historia?: string;
  pontos_de_vida?: number;
  dano_cortante?: number;
  dano_perfurante?: number;
  dano_contundente?: number;
  /** Alias legado de crush em alguns registros do JSON. */
  dano_contusao?: number;
  dano_divino?: number;
  dano_area?: number;
  alcance?: number;
  velocidade_de_ataque_atk_s?: number;
  dps?: number;
  armadura_anticorte?: number;
  armadura_antiperfurante?: number;
  comida?: number;
  madeira?: number;
  ouro?: number;
  favor?: number;
  custo_total?: number;
  populacao?: number;
  tempo_treinamento?: number;
  velocidade_movimento?: number;
  forca_atributos?: number;
};

export const unidades = unidadesJson as Unidade[];

export const panteoes = panteoesJson;

export const deusById = new Map(deuses.map((d) => [d.id, d]));
export const panteaoById = new Map(panteoes.map((p) => [p.id, p]));
export const eraById = new Map(eras.map((e) => [e.id, e]));
export const godpowerById = new Map(godpowers.map((g) => [g.id, g]));
export const reliquiaById = new Map(reliquias.map((r) => [r.id, r]));
export const construcaoById = new Map(construcoes.map((c) => [c.id, c]));
export const unidadeById = new Map(unidades.map((u) => [u.id, u]));
export const aldeaoById = new Map(aldeoes.map((a) => [a.id, a]));

const deusSlugMaps = buildRecordSlugMaps(deuses, (d) => d.nome);
export const deusBySlug = deusSlugMaps.bySlug;
export const deusSlugById = deusSlugMaps.slugById;

const panteaoSlugMaps = buildRecordSlugMaps(panteoes, (p) => p.nome);
export const panteaoBySlug = panteaoSlugMaps.bySlug;
export const panteaoSlugById = panteaoSlugMaps.slugById;

const eraSlugMaps = buildRecordSlugMaps(eras, (e) => e.nome);
export const eraBySlug = eraSlugMaps.bySlug;
export const eraSlugById = eraSlugMaps.slugById;

const godpowerSlugMaps = buildRecordSlugMaps(godpowers, (g) => g.nome);
export const godpowerBySlug = godpowerSlugMaps.bySlug;
export const godpowerSlugById = godpowerSlugMaps.slugById;

const reliquiaSlugMaps = buildRecordSlugMaps(reliquias, (r) => r.nome);
export const reliquiaBySlug = reliquiaSlugMaps.bySlug;
export const reliquiaSlugById = reliquiaSlugMaps.slugById;

const construcaoSlugMaps = buildRecordSlugMaps(construcoes, (c) => c.nome);
export const construcaoBySlug = construcaoSlugMaps.bySlug;
export const construcaoSlugById = construcaoSlugMaps.slugById;

const unidadeSlugMaps = buildRecordSlugMaps(unidades, (u) => u.nome);
export const unidadeBySlug = unidadeSlugMaps.bySlug;
export const unidadeSlugById = unidadeSlugMaps.slugById;

const aldeaoSlugMaps = buildRecordSlugMaps(aldeoes, (a) => a.nome);
export const aldeaoBySlug = aldeaoSlugMaps.bySlug;
export const aldeaoSlugById = aldeaoSlugMaps.slugById;

const tecnologiaSlugMaps = buildIndexSlugMaps(tecnologias, (t) => t.nome ?? "");
export const tecnologiaBySlug = tecnologiaSlugMaps.bySlug;
export const tecnologiaSlugByIndex = tecnologiaSlugMaps.slugByIndex;
export const tecnologiaIndexByNotionId = buildTecnologiaNotionIdIndexMap(
  tecnologias,
  construcoes as { tecnologias?: string; tecnologias_ids?: string[]; tecnologias_id?: string }[],
  deuses as { tecnologias?: { id: string | number; nome: string }[] }[],
);

const mapaSlugMaps = buildIndexSlugMaps(mapas, (m) => m.nome ?? "");
export const mapaBySlug = mapaSlugMaps.bySlug;
export const mapaSlugByIndex = mapaSlugMaps.slugByIndex;

