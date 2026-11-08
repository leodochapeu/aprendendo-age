/**
 * País gravado na importação do AoM Stats.
 * A API manda ISO 3166-1 alpha-2 (`br`) e o hud converte para o slug legado (`brasil`).
 * Os dois formatos resolvem para o mesmo arquivo em `/assets/flags/{iso}.svg`.
 */
const COUNTRIES: { iso: string; legacy: string; label: string }[] = [
  { iso: "za", legacy: "africadosul", label: "África do Sul" },
  { iso: "al", legacy: "albania", label: "Albânia" },
  { iso: "de", legacy: "alemanha", label: "Alemanha" },
  { iso: "ad", legacy: "andorra", label: "Andorra" },
  { iso: "ar", legacy: "argentina", label: "Argentina" },
  { iso: "am", legacy: "armenia", label: "Armênia" },
  { iso: "au", legacy: "australia", label: "Austrália" },
  { iso: "at", legacy: "austria", label: "Áustria" },
  { iso: "az", legacy: "azerbaijao", label: "Azerbaijão" },
  { iso: "bd", legacy: "bangladesh", label: "Bangladesh" },
  { iso: "bb", legacy: "barbados", label: "Barbados" },
  { iso: "be", legacy: "belgica", label: "Bélgica" },
  { iso: "by", legacy: "bielorrussia", label: "Bielorrússia" },
  { iso: "bo", legacy: "bolivia", label: "Bolívia" },
  { iso: "ba", legacy: "bosnia", label: "Bósnia" },
  { iso: "br", legacy: "brasil", label: "Brasil" },
  { iso: "bg", legacy: "bulgaria", label: "Bulgária" },
  { iso: "ca", legacy: "canada", label: "Canadá" },
  { iso: "kz", legacy: "cazaquistao", label: "Cazaquistão" },
  { iso: "cz", legacy: "chequia", label: "Chéquia" },
  { iso: "cl", legacy: "chile", label: "Chile" },
  { iso: "cn", legacy: "china", label: "China" },
  { iso: "cy", legacy: "chipre", label: "Chipre" },
  { iso: "co", legacy: "colombia", label: "Colômbia" },
  { iso: "kr", legacy: "coreia", label: "Coreia do Sul" },
  { iso: "cr", legacy: "costarica", label: "Costa Rica" },
  { iso: "hr", legacy: "croacia", label: "Croácia" },
  { iso: "cu", legacy: "cuba", label: "Cuba" },
  { iso: "dk", legacy: "dinamarca", label: "Dinamarca" },
  { iso: "eg", legacy: "egito", label: "Egito" },
  { iso: "sv", legacy: "elsalvador", label: "El Salvador" },
  { iso: "ec", legacy: "equador", label: "Equador" },
  { iso: "gb", legacy: "reinounido", label: "Reino Unido" },
  { iso: "sk", legacy: "eslovaquia", label: "Eslováquia" },
  { iso: "si", legacy: "eslovenia", label: "Eslovênia" },
  { iso: "es", legacy: "espanha", label: "Espanha" },
  { iso: "us", legacy: "estadosunidos", label: "Estados Unidos" },
  { iso: "ee", legacy: "estonia", label: "Estônia" },
  { iso: "fi", legacy: "finlandia", label: "Finlândia" },
  { iso: "fr", legacy: "franca", label: "França" },
  { iso: "ge", legacy: "georgia", label: "Geórgia" },
  { iso: "gr", legacy: "grecia", label: "Grécia" },
  { iso: "gt", legacy: "guatemala", label: "Guatemala" },
  { iso: "gy", legacy: "guiana", label: "Guiana" },
  { iso: "ht", legacy: "haiti", label: "Haiti" },
  { iso: "nl", legacy: "holanda", label: "Holanda" },
  { iso: "hn", legacy: "honduras", label: "Honduras" },
  { iso: "hk", legacy: "hongkong", label: "Hong Kong" },
  { iso: "hu", legacy: "hungria", label: "Hungria" },
  { iso: "in", legacy: "india", label: "Índia" },
  { iso: "id", legacy: "indonesia", label: "Indonésia" },
  { iso: "ir", legacy: "ira", label: "Irã" },
  { iso: "ie", legacy: "irlanda", label: "Irlanda" },
  { iso: "il", legacy: "israel", label: "Israel" },
  { iso: "is", legacy: "islandia", label: "Islândia" },
  { iso: "it", legacy: "italia", label: "Itália" },
  { iso: "jm", legacy: "jamaica", label: "Jamaica" },
  { iso: "jp", legacy: "japao", label: "Japão" },
  { iso: "lv", legacy: "letonia", label: "Letônia" },
  { iso: "li", legacy: "liechtenstein", label: "Liechtenstein" },
  { iso: "lt", legacy: "lituania", label: "Lituânia" },
  { iso: "lu", legacy: "luxemburgo", label: "Luxemburgo" },
  { iso: "mk", legacy: "macedonia", label: "Macedônia do Norte" },
  { iso: "mt", legacy: "malta", label: "Malta" },
  { iso: "mx", legacy: "mexico", label: "México" },
  { iso: "md", legacy: "moldavia", label: "Moldávia" },
  { iso: "mc", legacy: "monaco", label: "Mônaco" },
  { iso: "mn", legacy: "mongolia", label: "Mongólia" },
  { iso: "me", legacy: "montenegro", label: "Montenegro" },
  { iso: "ni", legacy: "nicaragua", label: "Nicarágua" },
  { iso: "no", legacy: "noruega", label: "Noruega" },
  { iso: "nz", legacy: "novazelandia", label: "Nova Zelândia" },
  { iso: "pa", legacy: "panama", label: "Panamá" },
  { iso: "pk", legacy: "paquistao", label: "Paquistão" },
  { iso: "py", legacy: "paraguai", label: "Paraguai" },
  { iso: "pe", legacy: "peru", label: "Peru" },
  { iso: "pl", legacy: "polonia", label: "Polônia" },
  { iso: "pt", legacy: "portugal", label: "Portugal" },
  { iso: "do", legacy: "republicadominicana", label: "República Dominicana" },
  { iso: "ro", legacy: "romenia", label: "Romênia" },
  { iso: "ru", legacy: "russia", label: "Rússia" },
  { iso: "sm", legacy: "sanmarino", label: "San Marino" },
  { iso: "rs", legacy: "servia", label: "Sérvia" },
  { iso: "sg", legacy: "singapura", label: "Singapura" },
  { iso: "se", legacy: "suecia", label: "Suécia" },
  { iso: "ch", legacy: "suica", label: "Suíça" },
  { iso: "sr", legacy: "suriname", label: "Suriname" },
  { iso: "th", legacy: "tailandia", label: "Tailândia" },
  { iso: "tw", legacy: "taiwan", label: "Taiwan" },
  { iso: "tt", legacy: "trindade", label: "Trinidad e Tobago" },
  { iso: "tn", legacy: "tunisia", label: "Tunísia" },
  { iso: "tr", legacy: "turquia", label: "Turquia" },
  { iso: "ua", legacy: "ucrania", label: "Ucrânia" },
  { iso: "uy", legacy: "uruguai", label: "Uruguai" },
  { iso: "ve", legacy: "venezuela", label: "Venezuela" },
  { iso: "gb-eng", legacy: "inglaterra", label: "Inglaterra" },
  { iso: "gb-sct", legacy: "escocia", label: "Escócia" },
  { iso: "gb-wls", legacy: "gales", label: "País de Gales" },
  { iso: "gb-nir", legacy: "irlandanorte", label: "Irlanda do Norte" },
];

const LEGACY_TO_ISO = new Map(COUNTRIES.map((country) => [country.legacy, country.iso]));
const ISO_TO_LABEL = new Map(COUNTRIES.map((country) => [country.iso, country.label]));
const KNOWN_ISO = new Set(COUNTRIES.map((country) => country.iso));

const ISO_ALIASES: Record<string, string> = {
  uk: "gb",
  en: "gb-eng",
  eng: "gb-eng",
  sct: "gb-sct",
  wls: "gb-wls",
  nir: "gb-nir",
};

export function flagIsoFromStoredCountry(value: string | null | undefined): string | null {
  const raw = value?.trim().toLowerCase() ?? "";
  if (!raw || raw === "null") return null;
  const fromLegacy = LEGACY_TO_ISO.get(raw);
  if (fromLegacy) return fromLegacy;
  const alias = ISO_ALIASES[raw] ?? raw;
  return KNOWN_ISO.has(alias) ? alias : null;
}

export function countryLabelFromStored(value: string | null | undefined): string | null {
  const iso = flagIsoFromStoredCountry(value);
  if (!iso) return null;
  return ISO_TO_LABEL.get(iso) ?? null;
}
