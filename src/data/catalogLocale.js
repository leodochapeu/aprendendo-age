import { aldeoes as aldeoesPt, construcoes as construcoesPt, deuses as deusesPt, eras as erasPt, godpowers as godpowersPt, mapas as mapasPt, reliquias as reliquiasPt, panteoes as panteoesPt, startsBuildOrder as startsBuildOrderPt, tecnologias as tecnologiasPt, unidades as unidadesPt, deusBySlug as deusBySlugPt, deusSlugById, panteaoBySlug as panteaoBySlugPt, panteaoSlugById, eraBySlug as eraBySlugPt, eraSlugById, godpowerBySlug as godpowerBySlugPt, godpowerSlugById, reliquiaBySlug as reliquiaBySlugPt, reliquiaSlugById, construcaoBySlug as construcaoBySlugPt, construcaoSlugById, unidadeBySlug as unidadeBySlugPt, unidadeSlugById, aldeaoBySlug as aldeaoBySlugPt, aldeaoSlugById, tecnologiaBySlug as tecnologiaBySlugPt, tecnologiaSlugByIndex, tecnologiaIndexByNotionId, mapaBySlug as mapaBySlugPt, mapaSlugByIndex, } from "@/data/catalog";
import aldeoesEnJson from "@/data/locale/en/aldeoes.json";
import construcoesEnJson from "@/data/locale/en/construcoes.json";
import deusesEnJson from "@/data/locale/en/deuses_aom.json";
import erasEnJson from "@/data/locale/en/eras.json";
import godpowersEnJson from "@/data/locale/en/godpowers.json";
import mapasEnJson from "@/data/locale/en/mapas.json";
import reliquiasEnJson from "@/data/locale/en/reliquias.json";
import panteoesEnJson from "@/data/locale/en/panteoes.json";
import startsEnJson from "@/data/locale/en/starts_build_order.json";
import tecnologiasEnJson from "@/data/locale/en/tecnologias.json";
import unidadesEnJson from "@/data/locale/en/unidades_aom.json";
const aldeoesEn = aldeoesEnJson;
const construcoesEn = construcoesEnJson;
const deusesEn = deusesEnJson;
const erasEn = erasEnJson;
const godpowersEn = godpowersEnJson;
const mapasEn = mapasEnJson;
const reliquiasEn = reliquiasEnJson;
const panteoesEn = panteoesEnJson;
const startsBuildOrderEn = startsEnJson;
const tecnologiasEn = tecnologiasEnJson;
const unidadesEn = unidadesEnJson;
function byIdMap(items) {
    return new Map(items.map((item) => [item.id, item]));
}
function remapSlugMap(ptBySlug, localizedById) {
    const out = new Map();
    for (const [slug, ptEntity] of ptBySlug) {
        out.set(slug, localizedById.get(ptEntity.id) ?? ptEntity);
    }
    return out;
}
function remapIndexSlugMap(ptBySlug, ptItems, localizedItems) {
    const out = new Map();
    for (const [slug, ptEntity] of ptBySlug) {
        const idx = ptItems.indexOf(ptEntity);
        out.set(slug, idx >= 0 ? localizedItems[idx] : ptEntity);
    }
    return out;
}
function buildPtCatalog() {
    const deusById = byIdMap(deusesPt);
    const panteaoById = byIdMap(panteoesPt);
    const eraById = byIdMap(erasPt);
    const godpowerById = byIdMap(godpowersPt);
    const reliquiaById = byIdMap(reliquiasPt);
    const construcaoById = byIdMap(construcoesPt);
    const unidadeById = byIdMap(unidadesPt);
    const aldeaoById = byIdMap(aldeoesPt);
    const startById = new Map(startsBuildOrderPt.map((s) => [s.id, s]));
    const startBySlug = new Map(startsBuildOrderPt.map((s) => [s.slug, s]));
    return {
        locale: "pt",
        aldeoes: aldeoesPt,
        construcoes: construcoesPt,
        deuses: deusesPt,
        eras: erasPt,
        godpowers: godpowersPt,
        reliquias: reliquiasPt,
        mapas: mapasPt,
        panteoes: panteoesPt,
        startsBuildOrder: startsBuildOrderPt,
        tecnologias: tecnologiasPt,
        unidades: unidadesPt,
        deusById,
        panteaoById,
        eraById,
        godpowerById,
        reliquiaById,
        construcaoById,
        unidadeById,
        aldeaoById,
        startById,
        startBySlug,
        deusBySlug: deusBySlugPt,
        deusSlugById,
        panteaoBySlug: panteaoBySlugPt,
        panteaoSlugById,
        eraBySlug: eraBySlugPt,
        eraSlugById,
        godpowerBySlug: godpowerBySlugPt,
        godpowerSlugById,
        reliquiaBySlug: reliquiaBySlugPt,
        reliquiaSlugById,
        construcaoBySlug: construcaoBySlugPt,
        construcaoSlugById,
        unidadeBySlug: unidadeBySlugPt,
        unidadeSlugById,
        aldeaoBySlug: aldeaoBySlugPt,
        aldeaoSlugById,
        tecnologiaBySlug: tecnologiaBySlugPt,
        tecnologiaSlugByIndex,
        tecnologiaIndexByNotionId,
        mapaBySlug: mapaBySlugPt,
        mapaSlugByIndex,
    };
}
function buildEnCatalog() {
    const deusById = byIdMap(deusesEn);
    const panteaoById = byIdMap(panteoesEn);
    const eraById = byIdMap(erasEn);
    const godpowerById = byIdMap(godpowersEn);
    const reliquiaById = byIdMap(reliquiasEn);
    const construcaoById = byIdMap(construcoesEn);
    const unidadeById = byIdMap(unidadesEn);
    const aldeaoById = byIdMap(aldeoesEn);
    const startById = new Map(startsBuildOrderEn.map((s) => [s.id, s]));
    const startBySlug = new Map(startsBuildOrderEn.map((s) => [s.slug, s]));
    return {
        locale: "en",
        aldeoes: aldeoesEn,
        construcoes: construcoesEn,
        deuses: deusesEn,
        eras: erasEn,
        godpowers: godpowersEn,
        reliquias: reliquiasEn,
        mapas: mapasEn,
        panteoes: panteoesEn,
        startsBuildOrder: startsBuildOrderEn,
        tecnologias: tecnologiasEn,
        unidades: unidadesEn,
        deusById,
        panteaoById,
        eraById,
        godpowerById,
        reliquiaById,
        construcaoById,
        unidadeById,
        aldeaoById,
        startById,
        startBySlug,
        deusBySlug: remapSlugMap(deusBySlugPt, deusById),
        deusSlugById,
        panteaoBySlug: remapSlugMap(panteaoBySlugPt, panteaoById),
        panteaoSlugById,
        eraBySlug: remapSlugMap(eraBySlugPt, eraById),
        eraSlugById,
        godpowerBySlug: remapSlugMap(godpowerBySlugPt, godpowerById),
        godpowerSlugById,
        reliquiaBySlug: remapSlugMap(reliquiaBySlugPt, reliquiaById),
        reliquiaSlugById,
        construcaoBySlug: remapSlugMap(construcaoBySlugPt, construcaoById),
        construcaoSlugById,
        unidadeBySlug: remapSlugMap(unidadeBySlugPt, unidadeById),
        unidadeSlugById,
        aldeaoBySlug: remapSlugMap(aldeaoBySlugPt, aldeaoById),
        aldeaoSlugById,
        tecnologiaBySlug: remapIndexSlugMap(tecnologiaBySlugPt, tecnologiasPt, tecnologiasEn),
        tecnologiaSlugByIndex,
        tecnologiaIndexByNotionId,
        mapaBySlug: remapIndexSlugMap(mapaBySlugPt, mapasPt, mapasEn),
        mapaSlugByIndex,
    };
}
const catalogs = {
    pt: buildPtCatalog(),
    en: buildEnCatalog(),
};
export function getLocaleCatalog(locale) {
    return catalogs[locale];
}
/** Nome de exibição localizado; em PT mostra subtítulo inglês se existir. */
export function entityDisplayDescription(entity, locale, t) {
    if (locale === "en")
        return undefined;
    if (entity.ingles && entity.ingles !== entity.nome) {
        return t("common.englishName", { name: entity.ingles });
    }
    return undefined;
}
