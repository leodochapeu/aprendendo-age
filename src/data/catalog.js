import aldeoesJson from "./locale/pt/aldeoes.json";
import construcoesJson from "./locale/pt/construcoes.json";
import deusesJson from "./locale/pt/deuses_aom.json";
import erasJson from "./locale/pt/eras.json";
import godpowersJson from "./locale/pt/godpowers.json";
import mapasJson from "./locale/pt/mapas.json";
import reliquiasJson from "./locale/pt/reliquias.json";
import { buildIndexSlugMaps, buildRecordSlugMaps } from "@/lib/entitySlug";
import { buildTecnologiaNotionIdIndexMap } from "@/lib/tecnologiaIndex";
import panteoesJson from "./locale/pt/panteoes.json";
import startsBuildOrderJson from "./locale/pt/starts_build_order.json";
import tecnologiasJson from "./locale/pt/tecnologias.json";
import unidadesJson from "./locale/pt/unidades_aom.json";
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
];
export const startsBuildOrder = startsBuildOrderJson;
export const startById = new Map(startsBuildOrder.map((s) => [s.id, s]));
export const startBySlug = new Map(startsBuildOrder.map((s) => [s.slug, s]));
export const aldeoes = aldeoesJson;
export const construcoes = construcoesJson;
export const deuses = deusesJson;
export const eras = erasJson;
export const mapas = mapasJson;
export const godpowers = godpowersJson;
export const reliquias = reliquiasJson;
export const tecnologias = tecnologiasJson;
export const unidades = unidadesJson;
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
export const tecnologiaIndexByNotionId = buildTecnologiaNotionIdIndexMap(tecnologias, construcoes, deuses);
const mapaSlugMaps = buildIndexSlugMaps(mapas, (m) => m.nome ?? "");
export const mapaBySlug = mapaSlugMaps.bySlug;
export const mapaSlugByIndex = mapaSlugMaps.slugByIndex;
