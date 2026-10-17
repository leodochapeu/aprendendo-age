/**
 * Deuses menores, nomes divinos e heróis gregos nos starts: texto puro no JSON;
 * na renderização → highlight + :aomr_*: (heróis laranja, divindades roxo).
 *
 * Evita ícone duplicado quando o nome segue logo após «:aomr_*: » (ex.: títulos).
 */
import { A, B, isInsideHighlightTag, NOT_IF_ICON, U } from "@/lib/startKeywordBoundaries";

function phraseSource(phrase: string): string {
  return phrase
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

function endsWithAomrTokenColonSpace(before: string): boolean {
  return /:aomr_[a-z0-9_-]+:\s+$/i.test(before.trimEnd());
}

type GodHeroWrap = "orange" | "purple";

/** Frases longas primeiro (ex.: «Inari Okami» antes de nomes curtos). */
const START_GOD_HERO_RAW: Array<{
  phrase: string;
  token: string;
  wrap: GodHeroWrap;
}> = [
  { phrase: "Ame-No-Uzume", token: "aomr_ame-no-uzume_icon", wrap: "purple" },
  { phrase: "Malinalxochitl", token: "aomr_malinalxochitl_icon", wrap: "purple" },
  { phrase: "Minakatatomi", token: "aomr_minakatatomi_icon", wrap: "purple" },
  { phrase: "Inari Okami", token: "aomr_inari_okami_icon", wrap: "purple" },
  { phrase: "Takemikazuchi", token: "aomr_takemikazuchi_icon", wrap: "purple" },
  { phrase: "por Mina", token: "aomr_minakatatomi_icon", wrap: "purple" },
  { phrase: "Prometeus", token: "aomr_prometheus_icon", wrap: "purple" },
  { phrase: "Huehuecóyotl", token: "aomr_huehuecoyotl_icon", wrap: "purple" },
  { phrase: "Patecatl", token: "aomr_patecatl_icon", wrap: "purple" },
  { phrase: "Nephthys", token: "aomr_nephthys_icon", wrap: "purple" },
  { phrase: "Ocenano", token: "aomr_oceanus_icon", wrap: "purple" },
  { phrase: "Afrodite", token: "aomr_aphrodite_icon", wrap: "purple" },
  { phrase: "Hermes", token: "aomr_hermes_icon", wrap: "purple" },
  { phrase: "Heimdall", token: "aomr_heimdall_icon", wrap: "purple" },
  { phrase: "Forseti", token: "aomr_forseti_icon", wrap: "purple" },
  { phrase: "Quetzalcoatl", token: "aomr_quetzalcoatl_icon", wrap: "purple" },
  { phrase: "Amaterasu", token: "aomr_amaterasu_icon", wrap: "purple" },
  { phrase: "Shennong", token: "aomr_shennong_icon", wrap: "purple" },
  { phrase: "Susanoo", token: "aomr_susanoo_icon", wrap: "purple" },
  { phrase: "Tsukuyomi", token: "aomr_tsukuyomi_icon", wrap: "purple" },
  { phrase: "Watatsumi", token: "aomr_watatsumi_icon", wrap: "purple" },
  { phrase: "Hefesto", token: "aomr_hephaestus_icon", wrap: "purple" },
  { phrase: "Néftis", token: "aomr_nephthys_icon", wrap: "purple" },
  { phrase: "Oceano", token: "aomr_oceanus_icon", wrap: "purple" },
  { phrase: "Oceanus", token: "aomr_oceanus_icon", wrap: "purple" },
  { phrase: "Chiyou", token: "aomr_chiyou_icon", wrap: "purple" },
  { phrase: "Anubis", token: "aomr_anubis_icon", wrap: "purple" },
  { phrase: "Atena", token: "aomr_athena_icon", wrap: "purple" },
  { phrase: "Leto", token: "aomr_leto_icon", wrap: "purple" },
  { phrase: "Theia", token: "aomr_theia_icon", wrap: "purple" },
  { phrase: "Ptah", token: "aomr_ptah_icon", wrap: "purple" },
  { phrase: "Sobek", token: "aomr_sobek_icon", wrap: "purple" },
  { phrase: "Bast", token: "aomr_bast_icon", wrap: "purple" },
  { phrase: "Ullr", token: "aomr_ullr_icon", wrap: "purple" },
  { phrase: "Aegir", token: "aomr_aegir_icon", wrap: "purple" },
  { phrase: "Freyja", token: "aomr_freyja_icon", wrap: "purple" },
  { phrase: "Freya", token: "aomr_freyja_icon", wrap: "purple" },
  { phrase: "Vidar", token: "aomr_vidar_icon", wrap: "purple" },
  { phrase: "Raijin", token: "aomr_raijin_icon", wrap: "purple" },
  { phrase: "Fujin", token: "aomr_fujin_icon", wrap: "purple" },
  { phrase: "Kronos", token: "aomr_kronos_icon", wrap: "purple" },
  { phrase: "Nuwa", token: "aomr_nuwa_icon", wrap: "purple" },
  { phrase: "Fuxi", token: "aomr_fuxi_icon", wrap: "purple" },
  { phrase: "Poseidon", token: "aomr_poseidon_icon", wrap: "purple" },
  { phrase: "Hades", token: "aomr_hades_icon", wrap: "purple" },
  { phrase: "Thor", token: "aomr_thor_icon", wrap: "purple" },
  { phrase: "Loki", token: "aomr_loki_icon", wrap: "purple" },
  { phrase: "Freyr", token: "aomr_freyr_icon", wrap: "purple" },
  { phrase: "Gaia", token: "aomr_gaia_icon", wrap: "purple" },
  { phrase: "Ísis", token: "aomr_isis_icon", wrap: "purple" },
  { phrase: "Rá", token: "aomr_ra_icon", wrap: "purple" },
  { phrase: "Set", token: "aomr_set_icon", wrap: "purple" },
  { phrase: "Jazão", token: "aomr_jason_icon", wrap: "orange" },
  { phrase: "Ajax", token: "aomr_ajax_icon", wrap: "orange" },
  { phrase: "Teseu", token: "aomr_theseus_icon", wrap: "orange" },
  { phrase: "Aquiles", token: "aomr_achilles_icon", wrap: "orange" },
  { phrase: "Hércules", token: "aomr_heracles_icon", wrap: "orange" },
  { phrase: "Atalanta", token: "aomr_atalanta_icon", wrap: "orange" },
];

const START_GOD_HERO_RULES = (() => {
  const seen = new Set<string>();
  const out: typeof START_GOD_HERO_RAW = [];
  for (const r of [...START_GOD_HERO_RAW].sort(
    (a, b) => b.phrase.length - a.phrase.length,
  )) {
    const k = `${r.phrase}\0${r.token}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
})();

export function expandStartGodHeroKeywords(text: string): string {
  if (!text) return text;
  let t = text;
  for (const { phrase, token, wrap } of START_GOD_HERO_RULES) {
    const re = new RegExp(
      `${B}(${phraseSource(phrase)})${NOT_IF_ICON}${A}`,
      U,
    );
    t = t.replace(re, (match, p1: string, offset: number, full: string) => {
      if (isInsideHighlightTag(full, offset)) return match;
      const before = full.slice(0, offset);
      if (endsWithAomrTokenColonSpace(before)) return match;
      return `<highlight-${wrap}>${p1}</highlight-${wrap}> :${token}:`;
    });
  }
  return t;
}

const NOT_IF_CLASSICAL = String.raw`(?!\s*:aomr_classical_age_icon:)`;

const CLASSICAL_INLINE_PHRASES = [
  "Depois da passagem de Era",
  "Antes de subir",
  "75% do UP",
  "lutar Clássica",
  "para a Clássica",
  "até a Clássica",
  "na Clássica",
];

const CLASSICAL_INLINE_SORTED = [...CLASSICAL_INLINE_PHRASES].sort(
  (a, b) => b.length - a.length,
);

/** Mencões à Era Clássica no meio da frase (não só no cabeçalho Subindo/Subiu). */
export function expandClassicalAgeInlineKeywords(text: string): string {
  if (!text) return text;
  let t = text;
  for (const ph of CLASSICAL_INLINE_SORTED) {
    const re = new RegExp(
      `${B}(${phraseSource(ph)})${NOT_IF_CLASSICAL}`,
      U,
    );
    t = t.replace(re, (match) => `${match} :aomr_classical_age_icon:`);
  }
  return t;
}
