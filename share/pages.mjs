import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const aldeoesPt = require("../src/data/locale/pt/aldeoes.json");
const construcoesPt = require("../src/data/locale/pt/construcoes.json");
const deusesPt = require("../src/data/locale/pt/deuses_aom.json");
const erasPt = require("../src/data/locale/pt/eras.json");
const godpowersPt = require("../src/data/locale/pt/godpowers.json");
const mapasPt = require("../src/data/locale/pt/mapas.json");
const panteoesPt = require("../src/data/locale/pt/panteoes.json");
const reliquiasPt = require("../src/data/locale/pt/reliquias.json");
const startsPt = require("../src/data/locale/pt/starts_build_order.json");
const tecnologiasPt = require("../src/data/locale/pt/tecnologias.json");
const unidadesPt = require("../src/data/locale/pt/unidades_aom.json");

const aldeoesEn = require("../src/data/locale/en/aldeoes.json");
const construcoesEn = require("../src/data/locale/en/construcoes.json");
const deusesEn = require("../src/data/locale/en/deuses_aom.json");
const erasEn = require("../src/data/locale/en/eras.json");
const godpowersEn = require("../src/data/locale/en/godpowers.json");
const mapasEn = require("../src/data/locale/en/mapas.json");
const panteoesEn = require("../src/data/locale/en/panteoes.json");
const reliquiasEn = require("../src/data/locale/en/reliquias.json");
const tecnologiasEn = require("../src/data/locale/en/tecnologias.json");
const unidadesEn = require("../src/data/locale/en/unidades_aom.json");

const NOTION_TOKEN = /:[a-z0-9_-]+:/gi;

const HOME = {
  title: "Aprendendo Age — AoM",
  description:
    "Catálogo de Age of Mythology Retold: starts, deuses, unidades, mapas e a comunidade.",
  lang: "pt",
};

const HOME_EN = {
  title: "Aprendendo Age — AoM",
  description: "Age of Mythology Retold catalog: starts, gods, units, maps, and the community.",
  lang: "en",
};

function plain(raw) {
  return String(raw ?? "")
    .replace(NOTION_TOKEN, " ")
    .replace(/<\/?[a-z0-9-]+>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(raw, max = 200) {
  const text = plain(raw);
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = (space > 80 ? cut.slice(0, space) : cut).replace(/[.,;: ]+$/, "");
  return `${base}…`;
}

function slugify(raw) {
  const noTokens = String(raw ?? "").replace(NOTION_TOKEN, " ");
  return noTokens
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function uniqueSlugs(items, getBase, mode) {
  const used = new Set();
  const out = [];
  items.forEach((item, index) => {
    let base = slugify(getBase(item, index));
    if (!base) base = mode === "index" ? `idx-${index}` : `id-${item.id}`;
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    out.push({ slug, item, index });
  });
  return out;
}

function joinNames(list) {
  if (!Array.isArray(list)) return "";
  return list
    .map((entry) => plain(typeof entry === "string" ? entry : entry?.nome || entry?.name))
    .filter(Boolean)
    .join(", ");
}

function describeCatalog(item, lang, noun) {
  const title = plain(item.nome) || noun[lang];
  const description =
    clip(item.descricao_resumida) ||
    (lang === "en"
      ? `${title} in the Age of Mythology Retold catalog.`
      : `${title} no catálogo de Age of Mythology Retold.`);
  return { title, description };
}

function describeLong(item, lang, noun) {
  const title = plain(item.nome) || noun[lang];
  const description =
    clip(item.description) ||
    (lang === "en" ? `${title} in Age of Mythology Retold.` : `${title} em Age of Mythology Retold.`);
  return { title, description };
}

function describeGod(item, lang) {
  const title = plain(item.nome) || (lang === "en" ? "God" : "Deus");
  const pantheon = joinNames(item.panteao);
  const hierRaw = plain(item.hierarquia);
  const hier =
    lang === "en" && /^maior$/i.test(hierRaw) ? "Major" : lang === "en" && /^menor$/i.test(hierRaw) ? "Minor" : hierRaw;
  const foco = plain(item.foco);
  const parts = [pantheon, hier, foco ? `${lang === "en" ? "Focus" : "Foco"}: ${foco}` : ""].filter(Boolean);
  return {
    title,
    description:
      clip(parts.join(" · ")) ||
      (lang === "en"
        ? `${title} — god from Age of Mythology Retold.`
        : `${title} — deus de Age of Mythology Retold.`),
  };
}

function describeVillager(item, lang) {
  const title = plain(item.nome) || (lang === "en" ? "Villager" : "Aldeão");
  const pantheon = joinNames(item.panteao);
  const description =
    lang === "en"
      ? pantheon
        ? `${pantheon} worker — gather rates and civilization variants.`
        : `${title} — gather rates and worker variants.`
      : pantheon
        ? `Trabalhador ${pantheon} — coleta e variações da civilização.`
        : `${title} — coleta e variações de aldeão.`;
  return { title, description: clip(description) };
}

function describeStart(item) {
  const title = plain(item.titulo) || "Start";
  const authors = joinNames(item.author);
  const gods = joinNames(item.god);
  const bits = [];
  if (authors) bits.push(`por ${authors}`);
  if (gods) bits.push(gods);
  const lead = bits.join(" · ");
  const body = plain(item.descricao_curta) || "Build order de Age of Mythology Retold.";
  return { title, description: clip(lead ? `${lead}. ${body}` : body) };
}

function normalizePath(pathname) {
  let path = String(pathname ?? "/");
  try {
    path = decodeURIComponent(path);
  } catch {
    /* mantém o valor original */
  }
  if (!path.startsWith("/") || path.includes("\\") || path.includes("://")) return "/";
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function buildPages() {
  const exact = Object.create(null);

  const put = (path, title, description, lang) => {
    exact[path] = { title, description: clip(description), lang };
  };

  const lists = [
    ["/", HOME.title, HOME.description, "pt"],
    ["/home", HOME.title, HOME.description, "pt"],
    [
      "/starts",
      "Starts & build orders",
      "Build orders prontas por deus e panteão — economia, marcos de era e intenção de jogo explicados.",
      "pt",
    ],
    [
      "/panteoes",
      "Panteões",
      "Visão geral de cada civilização jogável e o estilo de jogo de cada panteão.",
      "pt",
    ],
    [
      "/pantheons",
      "Pantheons",
      "Overview of each playable civilization and every pantheon's playstyle.",
      "en",
    ],
    [
      "/astecas",
      "Astecas",
      "Hub do Obsidian Mirror: deuses, unidades, construções e starts do panteão asteca em um só lugar.",
      "pt",
    ],
    [
      "/deuses",
      "Deuses",
      "Maiores e menores com bônus, foco de jogo e referências para montar sua estratégia.",
      "pt",
    ],
    [
      "/gods",
      "Gods",
      "Major and minor gods with bonuses, focus, and references to shape your strategy.",
      "en",
    ],
    [
      "/eras",
      "Eras",
      "Progressão Arcaica → Maravilha: o que desbloqueia em cada salto de era.",
      "pt",
    ],
    ["/ages", "Ages", "Archaic → Wonder progression: what unlocks with each age advance.", "en"],
    [
      "/poderes",
      "Poderes divinos",
      "Poderes divinos com cooldown, custo de repetição e quando vale a pena gastar.",
      "pt",
    ],
    [
      "/god-powers",
      "God powers",
      "God powers with cooldown, repeat cost, and when they're worth spending.",
      "en",
    ],
    [
      "/construcoes",
      "Construções",
      "Edifícios por panteão e era — do centro da cidade às produções militares.",
      "pt",
    ],
    [
      "/buildings",
      "Buildings",
      "Buildings by pantheon and age — from town center to military production.",
      "en",
    ],
    [
      "/unidades",
      "Unidades",
      "Humanos, mitológicas e heróis — stats, papéis e multiplicadores de combate.",
      "pt",
    ],
    [
      "/units",
      "Units",
      "Human, myth, and hero units — stats, roles, and combat multipliers.",
      "en",
    ],
    [
      "/aldeoes",
      "Aldeões e trabalhadores",
      "Coleta, variações por civilização e diferenças do aldeão asteca.",
      "pt",
    ],
    [
      "/villagers",
      "Villagers and workers",
      "Gathering, civilization variants, and how the Aztec villager differs.",
      "en",
    ],
    [
      "/mapas",
      "Mapas",
      "Pool ranqueado, origem do mapa e tipo de terreno para se preparar antes da partida.",
      "pt",
    ],
    [
      "/maps",
      "Maps",
      "Ranked pool, map origin, and terrain type so you can prep before queueing.",
      "en",
    ],
    [
      "/reliquias",
      "Relíquias",
      "Bônus de mapa para capturar com heróis e guarnecer no templo.",
      "pt",
    ],
    ["/relics", "Relics", "Map bonuses to capture with heroes and garrison in a temple.", "en"],
    [
      "/tecnologias",
      "Tecnologias",
      "Melhorias e upgrades — busque por deus, panteão ou efeito.",
      "pt",
    ],
    [
      "/technologies",
      "Technologies",
      "Upgrades and tech — search by god, pantheon, or effect.",
      "en",
    ],
    [
      "/videos-comunidade",
      "Vídeos da comunidade",
      "Tutoriais, partidas e dicas enviados pela galera — com tags e busca.",
      "pt",
    ],
    [
      "/jogadores-aom",
      "Jogadores AoM",
      "Perfis sincronizados ao AoM Stats, corrida por RR e ranking da comunidade.",
      "pt",
    ],
    [
      "/aom-players",
      "AoM Players",
      "Profiles synced to AoM Stats, the RR race, and the community leaderboard.",
      "en",
    ],
    [
      "/jogadores-aom?tab=jogadores",
      "Jogadores",
      "Jogadores da comunidade com perfil sincronizado ao AoM Stats.",
      "pt",
    ],
    [
      "/aom-players?tab=jogadores",
      "Players",
      "Community players with profiles synced to AoM Stats.",
      "en",
    ],
    [
      "/jogadores-aom?tab=rank",
      "Rank (RR)",
      "Sistema experimental de divisões (Bronze → Diamante) calibrado com a base do Retold.",
      "pt",
    ],
    [
      "/aom-players?tab=rank",
      "Rank (RR)",
      "Experimental tier system (Bronze → Diamond) calibrated on the Retold player base.",
      "en",
    ],
    [
      "/rank",
      "Rank (RR)",
      "Sistema experimental de divisões (Bronze → Diamante) calibrado com a base do Retold.",
      "pt",
    ],
    [
      "/rank/form",
      "Formulário de Rank (RR)",
      "Envie o RR do seu perfil para o ranking da comunidade Aprendendo Age.",
      "pt",
    ],
    [
      "/clans",
      "Clãs",
      "Elencos BR com RR, vitórias e deuses favoritos de cada clã.",
      "pt",
    ],
    [
      "/links-streamers",
      "Links de streamers",
      "Canais oficiais de streamers e hubs da comunidade — com status ao vivo.",
      "pt",
    ],
    [
      "/streamer-links",
      "Streamer links",
      "Official streamer channels and community hubs — with live status.",
      "en",
    ],
    [
      "/trilha-de-aprendizado",
      "Do Noob ao Pro",
      "Roteiro do básico ao avançado — forças e fraquezas, eras, unidades, atalhos, starts e estratégias.",
      "pt",
    ],
    [
      "/trilha-de-aprendizado/tipos-unidades-multiplicadores",
      "Tipos de Unidades e Multiplicadores",
      "O que é forte contra o que e como ler multiplicadores de combate.",
      "pt",
    ],
    [
      "/trilha-de-aprendizado/atalhos-importantes",
      "Atalhos importantes",
      "Teclas para construir rápido, achar unidades e gerenciar grupos.",
      "pt",
    ],
    [
      "/trilha-de-aprendizado/rush-turtle-boom",
      "Rush, Turtle ou Boom",
      "Agressivo, defensivo e econômico — como os arquétipos costumam se contrapor.",
      "pt",
    ],
    [
      "/battle",
      "Simulador de Batalha",
      "Treine counters e categorias em confrontos didáticos 1×1.",
      "pt",
    ],
    [
      "/battle/random",
      "Batalha aleatória",
      "10 rodadas por eras — escolha a unidade certa para vencer.",
      "pt",
    ],
    ["/entrar", "Entrar", "Acesse sua conta na comunidade Aprendendo Age.", "pt"],
    ["/login", "Log in", "Sign in to the Aprendendo Age community.", "en"],
    ["/cadastro", "Cadastro", "Crie sua conta na comunidade Aprendendo Age.", "pt"],
    ["/register", "Register", "Create your Aprendendo Age account.", "en"],
    ["/perfil", "Perfil", "Seu perfil de jogador no Aprendendo Age.", "pt"],
    ["/profile", "Profile", "Your player profile on Aprendendo Age.", "en"],
    [
      "/notificacoes",
      "Notificações",
      "Avisos e novidades da comunidade Aprendendo Age.",
      "pt",
    ],
    ["/notifications", "Notifications", "Updates and news from the Aprendendo Age community.", "en"],
  ];

  for (const [path, title, description, lang] of lists) put(path, title, description, lang);

  const idSections = [
    ["unidades", "units", unidadesPt, unidadesEn, (item, lang) => describeCatalog(item, lang, { pt: "Unidade", en: "Unit" })],
    ["construcoes", "buildings", construcoesPt, construcoesEn, (item, lang) => describeCatalog(item, lang, { pt: "Construção", en: "Building" })],
    ["poderes", "god-powers", godpowersPt, godpowersEn, (item, lang) => describeCatalog(item, lang, { pt: "Poder divino", en: "God power" })],
    ["reliquias", "relics", reliquiasPt, reliquiasEn, (item, lang) => describeCatalog(item, lang, { pt: "Relíquia", en: "Relic" })],
    ["deuses", "gods", deusesPt, deusesEn, describeGod],
    ["panteoes", "pantheons", panteoesPt, panteoesEn, (item, lang) => describeLong(item, lang, { pt: "Panteão", en: "Pantheon" })],
    ["eras", "ages", erasPt, erasEn, (item, lang) => describeLong(item, lang, { pt: "Era", en: "Age" })],
    ["aldeoes", "villagers", aldeoesPt, aldeoesEn, describeVillager],
  ];

  for (const [pt, en, ptItems, enItems, describe] of idSections) {
    const enById = new Map(enItems.map((item) => [item.id, item]));
    for (const { slug, item } of uniqueSlugs(ptItems, (entry) => entry.nome ?? "", "id")) {
      const localized = enById.get(item.id) ?? item;
      const ptCopy = describe(item, "pt");
      const enCopy = describe(localized, "en");
      put(`/${pt}/${slug}`, ptCopy.title, ptCopy.description, "pt");
      if (en !== pt) put(`/${en}/${slug}`, enCopy.title, enCopy.description, "en");
    }
  }

  const indexSections = [
    ["tecnologias", "technologies", tecnologiasPt, tecnologiasEn, { pt: "Tecnologia", en: "Technology" }],
    ["mapas", "maps", mapasPt, mapasEn, { pt: "Mapa", en: "Map" }],
  ];

  for (const [pt, en, ptItems, enItems, noun] of indexSections) {
    for (const { slug, item, index } of uniqueSlugs(ptItems, (entry) => entry.nome ?? "", "index")) {
      const localized = enItems[index] ?? item;
      const ptCopy = describeCatalog(item, "pt", noun);
      const enCopy = describeCatalog(localized, "en", noun);
      put(`/${pt}/${slug}`, ptCopy.title, ptCopy.description, "pt");
      put(`/${en}/${slug}`, enCopy.title, enCopy.description, "en");
    }
  }

  for (const start of startsPt) {
    if (!start.slug) continue;
    const copy = describeStart(start);
    put(`/starts/${start.slug}`, copy.title, copy.description, "pt");
  }

  return exact;
}

let exactPages;

function pages() {
  exactPages ??= buildPages();
  return exactPages;
}

const EN_ROOTS = new Set([
  "units",
  "gods",
  "pantheons",
  "ages",
  "god-powers",
  "buildings",
  "villagers",
  "maps",
  "relics",
  "technologies",
  "aom-players",
  "login",
  "register",
  "profile",
  "notifications",
  "player",
  "streamer-links",
]);

function page(path, search) {
  const exact = pages();
  const players = path === "/jogadores-aom" || path === "/aom-players";
  if (players) {
    const tab = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("tab");
    if (tab === "rank" || tab === "jogadores") return exact[`${path}?tab=${tab}`] ?? exact[path];
    return exact[path];
  }

  if (exact[path]) return exact[path];

  const compare = path.match(
    /^\/(unidades|units|poderes|god-powers|aldeoes|villagers)\/compare\/([^/]+)\/([^/]+)$/,
  );
  if (compare) {
    const segment = compare[1];
    const en = segment === "units" || segment === "god-powers" || segment === "villagers";
    const left = exact[`/${segment}/${compare[2]}`]?.title ?? compare[2];
    const right = exact[`/${segment}/${compare[3]}`]?.title ?? compare[3];
    return {
      title: `${left} vs ${right}`,
      description: en
        ? `Side-by-side comparison of ${left} and ${right}.`
        : `Comparação lado a lado entre ${left} e ${right}.`,
      lang: en ? "en" : "pt",
    };
  }

  const battle = path.match(/^\/battle\/random\/([^/]+)$/);
  if (battle) {
    const name = exact[`/panteoes/${battle[1]}`]?.title ?? "Panteão";
    return {
      title: `Batalha — ${name}`,
      description: `Simulador de batalha com o deck de ${name}. Treine counters em confrontos 1×1.`,
      lang: "pt",
    };
  }

  if (/^\/(?:jogador|player)\/[^/]+$/.test(path)) {
    const en = path.startsWith("/player/");
    return {
      title: en ? "Player" : "Jogador",
      description: en
        ? "Community player profile on Aprendendo Age, synced with AoM Stats."
        : "Perfil de jogador da comunidade Aprendendo Age, sincronizado ao AoM Stats.",
      lang: en ? "en" : "pt",
    };
  }

  if (/^\/clans\/[^/]+$/.test(path)) {
    return {
      title: "Clã",
      description: "Elenco, RR e deuses favoritos de um clã da comunidade Aprendendo Age.",
      lang: "pt",
    };
  }

  if (/^\/videos-comunidade\/[^/]+$/.test(path)) {
    return {
      title: "Vídeo da comunidade",
      description: "Tutorial, partida ou dica enviado pela comunidade Aprendendo Age.",
      lang: "pt",
    };
  }

  if (path.startsWith("/notificacoes")) return exact["/notificacoes"];
  if (path.startsWith("/notifications")) return exact["/notifications"];

  const root = path.split("/")[1] ?? "";
  return EN_ROOTS.has(root) ? HOME_EN : HOME;
}

export function resolveSharePage(pathname, search = "") {
  const path = normalizePath(pathname);
  const resolved = page(path, search);
  return { ...resolved, pathname: path };
}
