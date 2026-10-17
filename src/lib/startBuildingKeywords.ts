/**
 * Edifícios / estruturas em starts: no `starts_build_order.json` usamos só o nome;
 * na renderização (StartMiniMarkup) expande para <highlight-*>nome</> :aomr_*:.
 * Frases mais longas primeiro (ex.: “Casa Comunal” antes de “Casa”).
 *
 * “Estábulo”/“Estábulos” têm ícones diferentes (grego vs japonês); aí o JSON
 * continua a poder usar o token explícito ao lado.
 */

import { A, B, isInsideHighlightTag, NOT_IF_ICON, U } from "./startKeywordBoundaries";

type BuildingWrap = "blue" | "orange" | "pink" | "purple";

const RAW_RULES: Array<{
  phrase: string;
  token: string;
  wrap: BuildingWrap;
}> = [
  { phrase: "Guilda Econômica", token: "aomr_economic_guild_icon", wrap: "blue" },
  { phrase: "Cofre de Érebus", token: "aomr_vaults_of_erebus_icon", wrap: "pink" },
  { phrase: "Máquinas de Cerco", token: "aomr_siege_works_icon", wrap: "blue" },
  { phrase: "Campo de Mineração", token: "aomr_mining_camp_icon", wrap: "blue" },
  { phrase: "Campo de Arqueiros", token: "aomr_archery_range_icon", wrap: "blue" },
  { phrase: "Oficina de Máquina", token: "aomr_machine_workshop", wrap: "blue" },
  { phrase: "Moinho de Água", token: "aomr_watermill_icon", wrap: "blue" },
  { phrase: "Posto de Vigia", token: "aomr_guardhouse_icon", wrap: "blue" },
  { phrase: "Campo Madeireiro", token: "aomr_lumber_camp_icon", wrap: "blue" },
  { phrase: "Campo Militar", token: "aomr_military_camp", wrap: "blue" },
  { phrase: "Academia Militar", token: "aomr_military_academy_icon", wrap: "blue" },
  { phrase: "Academia Imperial", token: "aomr_imperial_academy", wrap: "pink" },
  { phrase: "Fortaleza Migdol", token: "aomr_migdol_stronghold_icon", wrap: "blue" },
  { phrase: "Grande Salão", token: "aomr_great_hall_icon", wrap: "blue" },
  { phrase: "Casa Comunal", token: "aomr_longhouse_icon", wrap: "blue" },
  { phrase: "Quartel Militar", token: "aomr_military_barracks_icon", wrap: "blue" },
  { phrase: "Contra-Quartel", token: "aomr_counter-barracks_icon", wrap: "blue" },
  { phrase: "Contralquartel", token: "aomr_counter-barracks_icon", wrap: "blue" },
  { phrase: "Cabana de Guerra", token: "aomr_war_hut_icon", wrap: "blue" },
  { phrase: "Cabana do Nobre", token: "aomr_noble_hut_icon", wrap: "blue" },
  { phrase: "Dojos", token: "aomr_dojo_icon", wrap: "blue" },
  { phrase: "Calpulli", token: "aomr_calpulli_icon", wrap: "blue" },
  { phrase: "Quarteis", token: "aomr_barracks_icon", wrap: "blue" },
  { phrase: "Quartel", token: "aomr_barracks_icon", wrap: "blue" },
  { phrase: "Obeliscos", token: "aomr_obelisk_icon", wrap: "blue" },
  { phrase: "Obelisco", token: "aomr_obelisk_icon", wrap: "blue" },
  { phrase: "Santuário", token: "aomr_shrine_icon", wrap: "blue" },
  { phrase: "Dojo", token: "aomr_dojo_icon", wrap: "blue" },
  { phrase: "Docas", token: "aomr_dock_icon", wrap: "orange" },
  { phrase: "Monumento", token: "aomr_monuments_retold_anim", wrap: "blue" },
  { phrase: "Torres", token: "aomr_sentry_tower_icon", wrap: "blue" },
  { phrase: "Celeiro", token: "aomr_granary_icon", wrap: "blue" },
  { phrase: "Armazém", token: "aomr_storehouse_icon", wrap: "blue" },
  { phrase: "Silo", token: "aomr_silo", wrap: "blue" },
  { phrase: "Mansão", token: "aomr_manor_icon", wrap: "blue" },
  { phrase: "Mercado", token: "aomr_market_icon", wrap: "blue" },
  { phrase: "Armaria", token: "aomr_armory_icon", wrap: "blue" },
  { phrase: "Arsenal", token: "aomr_armory_icon", wrap: "blue" },
  { phrase: "Moinho", token: "aomr_watermill_icon", wrap: "orange" },
  { phrase: "Templo", token: "aomr_temple_icon", wrap: "blue" },
  { phrase: "Torre", token: "aomr_sentry_tower_icon", wrap: "blue" },
  { phrase: "Doca", token: "aomr_dock_icon", wrap: "orange" },
  { phrase: "Casas", token: "aomr_house_icon", wrap: "blue" },
  { phrase: "Casa", token: "aomr_house_icon", wrap: "blue" },
  { phrase: "Migdol", token: "aomr_migdol_stronghold_icon", wrap: "blue" },
  { phrase: "Guilda", token: "aomr_economic_guild_icon", wrap: "blue" },
];

const RULES_DEDUPED = (() => {
  const seen = new Set<string>();
  const out: typeof RAW_RULES = [];
  for (const r of [...RAW_RULES].sort(
    (a, b) => b.phrase.length - a.phrase.length,
  )) {
    const k = `${r.phrase}\0${r.token}\0${r.wrap}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
})();

const ALL_BUILDING_TOKENS = [
  ...new Set(RULES_DEDUPED.map((r) => r.token)),
] as const;

function phraseSource(phrase: string): string {
  return phrase
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

/**
 * Aplica a expansão de nomes de edifício/estrutura (nome puro no JSON).
 */
export function expandBuildingKeywords(text: string): string {
  if (!text) return text;
  let t = text;
  for (const { phrase, token, wrap } of RULES_DEDUPED) {
    const re = new RegExp(
      `${B}(${phraseSource(phrase)})${NOT_IF_ICON}${A}`,
      U,
    );
    t = t.replace(re, (match, p1: string, offset: number, full: string) => {
      if (isInsideHighlightTag(full, offset)) return match;
      return `<highlight-${wrap}>${p1}</highlight-${wrap}> :${token}:`;
    });
  }
  return t;
}

/**
 * Normalizar texto de dados: remover :aomr_*: de edifícios mapeados e
 * o <highlight-*> em volta, para o JSON conter só o nome.
 * Corrige também o markup partido `</h><h>:aomr_*:`
 */
export function stripStartTextForData(text: string): string {
  if (!text) return text;
  let t = text;
  t = t.replace(
    /<\/highlight-([a-z-]+)><highlight-\1>:(aomr_[^:\s]+:)<\/highlight-\1>/g,
    "</highlight-$1>",
  );
  for (const token of ALL_BUILDING_TOKENS) {
    t = t.split(`:${token}:`).join("");
  }
  for (const { phrase, wrap } of RULES_DEDUPED) {
    const re = new RegExp(
      `<highlight-${wrap}>(${phraseSource(phrase)})<\/highlight-${wrap}>`,
      "giu",
    );
    t = t.replace(re, (_f, p1) => p1);
  }
  t = t.replace(/ {2,}/g, " ");
  t = t.replace(/[ \t]+$/gm, "");
  return t;
}
