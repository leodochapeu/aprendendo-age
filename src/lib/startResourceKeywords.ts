/**
 * Recursos e trabalhadores nos starts: no JSON usamos só o texto;
 * na renderização expandimos para highlight + :token: (recursos) ou palavra + :token: (trabalhadores).
 *
 * Unidades / tecnologias de unidade (lista explícita): nome puro no JSON; aqui expandimos
 * highlight + :aomr_*_icon: ou só :token: quando não há cor.
 *
 * Linhas que começam com «Subindo de Era» / «Subiu Era» recebem :aomr_classical_age_icon: no início
 * (equivalente ao padrão que vinha no JSON antes do título da etapa).
 */
import { expandBuildingKeywords } from "@/lib/startBuildingKeywords";
import {
  expandClassicalAgeInlineKeywords,
  expandStartGodHeroKeywords,
} from "@/lib/startGodHeroKeywords";
import { A, B, isInsideHighlightTag, NOT_IF_ICON, U } from "@/lib/startKeywordBoundaries";

/** Remove markup legado «palavra + ícone» antes de regravar o JSON (migração). */
export function stripLegacyResourceMarkup(text: string): string {
  let t = text;
  t = t.replace(
    /<highlight-brown>([^<]*)<\/highlight-brown><highlight-brown>:woodaom:<\/highlight-brown>/gi,
    "$1",
  );
  t = t.replace(/<highlight-red>([^<]*)<\/highlight-red>\s*:foodaom:/gi, "$1");
  t = t.replace(/<highlight-brown>([^<]*)<\/highlight-brown>\s*:woodaom:/gi, "$1");
  t = t.replace(/<highlight-yellow>([^<]*)<\/highlight-yellow>\s*:goldaom:/gi, "$1");
  t = t.replace(/<highlight-blue>([^<]*)<\/highlight-blue>\s*:favoraom:/gi, "$1");
  return t;
}

/** Não expandir logo após letra/número nem após «>» de tag (ex.: <tag>Aldeão). */
const WB = String.raw`(?<![\p{L}\p{M}\p{N}_<>])`;
const WA = String.raw`(?![\p{L}\p{M}\p{N}_])`;
const WU = "giu" as const;

/**
 * Expande trabalhadores (grego, egípcio, nórdico, atlante, chinês, japonês).
 * Linhas com «Cidadão Inicial :aomr_citizen_hero_icon:» no JSON mantêm o token manual; não use só texto para esse caso.
 */
export function expandWorkerKeywords(text: string): string {
  if (!text) return text;
  let t = text;

  const rules: Array<{ re: RegExp; token: string }> = [
    { re: new RegExp(`${WB}(Aldeões\\s+iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_villager_greek_icon" },
    { re: new RegExp(`${WB}(Aldeão\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_villager_greek_icon" },
    { re: new RegExp(`${WB}(Aldeões)(?!\\s+iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_villager_greek_icon" },
    { re: new RegExp(`${WB}(Aldeão)(?!\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_villager_greek_icon" },

    { re: new RegExp(`${WB}(Trabalhadores\\s+Iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_laborer_icon" },
    { re: new RegExp(`${WB}(Trabalhador\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_laborer_icon" },
    { re: new RegExp(`${WB}(Trabalhadores)(?!\\s+[Ii]nicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_laborer_icon" },
    { re: new RegExp(`${WB}(Trabalhador)(?!\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_laborer_icon" },

    { re: new RegExp(`${WB}(Coletores\\s+do\\s+Ouro)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },
    { re: new RegExp(`${WB}(Coletor\\s+do\\s+Ouro)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },
    { re: new RegExp(`${WB}(Coletores\\s+iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },
    { re: new RegExp(`${WB}(Coletores\\s+inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },
    { re: new RegExp(`${WB}(Coletor\\s+inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },
    { re: new RegExp(`${WB}(Coletores)(?!\\s+[Ii]nicial)(?!\\s+do\\s+Ouro)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },
    { re: new RegExp(`${WB}(Coletor)(?!\\s+[Ii]nicial)(?!\\s+do\\s+Ouro)${NOT_IF_ICON}${WA}`, WU), token: "aomr_gatherer_icon" },

    { re: new RegExp(`${WB}(Anões\\s+iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_dwarf_icon" },
    { re: new RegExp(`${WB}(Anões)(?!\\s+[Ii]nicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_dwarf_icon" },
    { re: new RegExp(`${WB}(Anão)${NOT_IF_ICON}${WA}`, WU), token: "aomr_dwarf_icon" },

    {
      re: new RegExp(`${WB}(Cidadão\\s+Inicial)(?!\\s*:aomr_citizen_)`, WU),
      token: "aomr_citizen_icon",
    },
    { re: new RegExp(`${WB}(Cidadãos)(?!\\s+[Ii]nicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_citizen_icon" },
    { re: new RegExp(`${WB}(Cidadão)(?!\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_citizen_icon" },

    { re: new RegExp(`${WB}(Camponeses\\s+inicias)${NOT_IF_ICON}${WA}`, WU), token: "aomr_peasant_icon" },
    { re: new RegExp(`${WB}(Camponês\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_peasant_icon" },
    { re: new RegExp(`${WB}(Camponeses\\s+iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_peasant_icon" },
    { re: new RegExp(`${WB}(Camponeses)(?!\\s+[Ii]nicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_peasant_icon" },
    { re: new RegExp(`${WB}(Camponês)(?!\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_peasant_icon" },
    { re: new RegExp(`${WB}(Campones)${NOT_IF_ICON}${WA}`, WU), token: "aomr_peasant_icon" },

    { re: new RegExp(`${WB}(Kuafu\\s+inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_kuafu_icon" },
    { re: new RegExp(`${WB}(Kuafus)${NOT_IF_ICON}${WA}`, WU), token: "aomr_kuafu_icon" },
    { re: new RegExp(`${WB}(Kuafu)${NOT_IF_ICON}${WA}`, WU), token: "aomr_kuafu_icon" },

    { re: new RegExp(`${WB}(Plebeus\\s+Iniciais)${NOT_IF_ICON}${WA}`, WU), token: "aomr_commoner_icon" },
    { re: new RegExp(`${WB}(Plebeu\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_commoner_icon" },
    { re: new RegExp(`${WB}(Plebeus)(?!\\s+[Ii]nicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_commoner_icon" },
    { re: new RegExp(`${WB}(Plebeu)(?!\\s+Inicial)${NOT_IF_ICON}${WA}`, WU), token: "aomr_commoner_icon" },

    { re: new RegExp(`${WB}(Colonos)${NOT_IF_ICON}${WA}`, WU), token: "aomr_settler_icon" },
    { re: new RegExp(`${WB}(Colono)${NOT_IF_ICON}${WA}`, WU), token: "aomr_settler_icon" },
  ];

  for (const { re, token } of rules) {
    t = t.replace(re, (m) => `${m} :${token}:`);
  }
  return t;
}

function phraseSource(phrase: string): string {
  return phrase
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

type StartUnitWrap = "teal" | "pink" | "orange" | "blue";

const START_UNIT_RAW: Array<{
  phrase: string;
  token: string;
  wrap?: StartUnitWrap;
}> = [
  { phrase: "Sarcerdote de Guerra", token: "aomr_warrior_priest_hero_icon", wrap: "teal" },
  { phrase: "Guardiões Sagrados", token: "aomr_sacred_custodians_icon", wrap: "pink" },
  { phrase: "Cavalaria Naginata", token: "aomr_naginata_rider_icon", wrap: "teal" },
  { phrase: "Cavalaria Incursora", token: "aomr_raiding_cavalry_icon" },
  { phrase: "Arqueiros Yumi", token: "aomr_yumi_archer_icon", wrap: "blue" },
  { phrase: "Espião Quimchim", token: "aomr_quimchim_spy_icon" },
  { phrase: "Carros de Boi", token: "aomr_ox_cart_icon" },
  { phrase: "Carro de Boi", token: "aomr_ox_cart_icon" },
  { phrase: "Sarcerdotes", token: "aomr_priest_icon", wrap: "teal" },
  { phrase: "Sarcerdote", token: "aomr_priest_icon", wrap: "teal" },
  { phrase: "Oráculos", token: "aomr_oracle_hero_icon", wrap: "teal" },
  { phrase: "Oráculo", token: "aomr_oracle_hero_icon", wrap: "teal" },
  { phrase: "Kataskopos", token: "aomr_kataskopos_icon" },
  { phrase: "Pioneiro", token: "aomr_pioneer_icon" },
  { phrase: "Berserker", token: "aomr_berserk_icon", wrap: "teal" },
  { phrase: "Berseker", token: "aomr_berserk_icon", wrap: "teal" },
  { phrase: "Bushis", token: "aomr_bushi_icon", wrap: "orange" },
  { phrase: "Hersirs", token: "aomr_hersir_icon" },
  { phrase: "Hersir", token: "aomr_hersir_icon" },
  { phrase: "Faraó", token: "aomr_pharaoh_icon", wrap: "teal" },
  { phrase: "Mikos", token: "aomr_miko_icon", wrap: "teal" },
  { phrase: "Miko", token: "aomr_miko_icon", wrap: "teal" },
];

const START_UNIT_RULES = (() => {
  const seen = new Set<string>();
  const out: typeof START_UNIT_RAW = [];
  for (const r of [...START_UNIT_RAW].sort(
    (a, b) => b.phrase.length - a.phrase.length,
  )) {
    const k = `${r.phrase}\0${r.token}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
})();

/**
 * Unidades / techs de unidade com nome fixo no JSON (sem :aomr_*: nem highlight).
 */
export function expandStartUnitKeywords(text: string): string {
  if (!text) return text;
  let t = text;
  for (const { phrase, token, wrap } of START_UNIT_RULES) {
    const re = new RegExp(
      `${B}(${phraseSource(phrase)})${NOT_IF_ICON}${A}`,
      U,
    );
    if (wrap) {
      t = t.replace(re, (match, p1: string, offset: number, full: string) => {
        if (isInsideHighlightTag(full, offset)) return match;
        return `<highlight-${wrap}>${p1}</highlight-${wrap}> :${token}:`;
      });
    } else {
      t = t.replace(re, (m) => `${m} :${token}:`);
    }
  }
  return t;
}

function expandClassicalAgePrefixLine(line: string): string {
  const trimmed = line.trimStart();
  if (/^:aomr_classical_age_icon:\s/i.test(trimmed)) return line;
  if (
    /^<strong>Subindo de Era\b/i.test(trimmed) ||
    /^<strong>Subiu Era\b/i.test(trimmed) ||
    /^Subindo de Era\b/i.test(trimmed) ||
    /^Subiu Era\b/i.test(trimmed)
  ) {
    const leadLen = line.length - line.trimStart().length;
    const lead = line.slice(0, leadLen);
    return `${lead}:aomr_classical_age_icon: ${line.slice(leadLen)}`;
  }
  return line;
}

/** Ícone de Era Clássica antes de títulos «Subindo/Subiu Era» (início de linha). */
export function expandClassicalAgePrefix(text: string): string {
  if (!text) return text;
  return text.split("\n").map(expandClassicalAgePrefixLine).join("\n");
}

/**
 * Expande ocorrências isoladas das palavras-recurso para highlight + ícone.
 * Usa limites Unicode para não casar «favor» dentro de «favorável», etc.
 */
export function expandResourceKeywords(text: string): string {
  if (!text) return text;
  const boundaryBefore = String.raw`(?<![\p{L}\p{M}\p{N}_])`;
  const boundaryAfter = String.raw`(?![\p{L}\p{M}\p{N}_])`;
  const u = "giu" as const;
  let t = text;
  const wrapResource = (tag: "red" | "brown" | "yellow" | "blue", token: string) => {
    return (match: string, m: string, offset: number, full: string) => {
      if (isInsideHighlightTag(full, offset)) return match;
      return `<highlight-${tag}>${m}</highlight-${tag}>:${token}:`;
    };
  };
  t = t.replace(
    new RegExp(`${boundaryBefore}(comida)${NOT_IF_ICON}${boundaryAfter}`, u),
    wrapResource("red", "foodaom"),
  );
  t = t.replace(
    new RegExp(`${boundaryBefore}(madeira)${NOT_IF_ICON}${boundaryAfter}`, u),
    wrapResource("brown", "woodaom"),
  );
  t = t.replace(
    new RegExp(`${boundaryBefore}(ouro)${NOT_IF_ICON}${boundaryAfter}`, u),
    wrapResource("yellow", "goldaom"),
  );
  t = t.replace(
    new RegExp(`${boundaryBefore}(favor)${NOT_IF_ICON}${boundaryAfter}`, u),
    wrapResource("blue", "favoraom"),
  );
  return t;
}

/** Ordem: trabalhadores → unidades → deuses/heróis → edifícios → recursos → Era Clássica (cabeçalho + menções inline). */
export function expandStartInlineKeywords(text: string): string {
  return expandClassicalAgeInlineKeywords(
    expandClassicalAgePrefix(
      expandResourceKeywords(
        expandBuildingKeywords(
          expandStartGodHeroKeywords(
            expandStartUnitKeywords(expandWorkerKeywords(text)),
          ),
        ),
      ),
    ),
  );
}
