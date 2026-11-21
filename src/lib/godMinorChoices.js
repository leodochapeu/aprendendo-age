import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getTecnologiaAssetUrl } from "@/lib/tecnologiaAssetUrl";
import { resolveTecnologiaIndex } from "@/lib/tecnologiaIndex";
import { treeIconPreview } from "@/lib/treeIconPreview";
const LATER_AGES = [2, 3, 4];
export function buildGodMinorChoices(god, catalog) {
    if (god.hierarquia !== "Maior")
        return null;
    const rows = [];
    const archaic = archaicIcons(god, catalog);
    if (archaic.length)
        rows.push({ eraId: 1, icons: archaic });
    const byAge = new Map();
    for (const ref of god.god_maior_relacao ?? []) {
        const minor = catalog.deusById.get(ref.id);
        if (!minor || minor.hierarquia === "Maior")
            continue;
        const eraId = minor.era?.[0]?.id;
        if (eraId == null || !LATER_AGES.includes(eraId))
            continue;
        const group = byAge.get(eraId) ?? [];
        group.push(minorChoice(minor, catalog));
        byAge.set(eraId, group);
    }
    for (const eraId of LATER_AGES) {
        const minors = byAge.get(eraId);
        if (minors?.length)
            rows.push({ eraId, minors });
    }
    return rows.length ? rows : null;
}
function archaicIcons(god, catalog) {
    const icons = [];
    const power = powerIcon(god, catalog, "major");
    if (power)
        icons.push(power);
    catalog.tecnologias.forEach((tech, index) => {
        if (!isArchaicMajorTech(tech, god.id))
            return;
        icons.push(techIcon(catalog, tech, index));
    });
    return icons;
}
function isArchaicMajorTech(tech, majorId) {
    if (tech.eras?.[0]?.id !== 1)
        return false;
    const gods = tech.god_especifico;
    if (!Array.isArray(gods))
        return false;
    return gods.some((entry) => entry.id === majorId);
}
function minorChoice(minor, catalog) {
    const icons = [];
    const power = powerIcon(minor, catalog, `minor-${minor.id}`);
    if (power)
        icons.push(power);
    for (const unit of mythUnitsFor(minor, catalog)) {
        icons.push({
            key: `u-${minor.id}-${unit.id}`,
            nome: unit.nome,
            src: getUnidadeAssetUrl(unit),
            to: link(catalog, "unidades", catalog.unidadeSlugById.get(unit.id)),
            frame: "myth",
            preview: treeIconPreview(unit),
        });
    }
    for (const ref of minor.tecnologias ?? []) {
        const index = resolveTecnologiaIndex(catalog.tecnologias, catalog.tecnologiaIndexByNotionId, ref);
        const tech = index >= 0 ? catalog.tecnologias[index] : undefined;
        icons.push(tech
            ? techIcon(catalog, tech, index, `${minor.id}-`)
            : { key: `t-${minor.id}-${ref.id}`, nome: ref.nome, frame: "tech" });
    }
    return {
        id: minor.id,
        portrait: {
            key: `god-${minor.id}`,
            nome: minor.nome,
            src: getDeusAssetUrl(minor),
            to: link(catalog, "deuses", catalog.deusSlugById.get(minor.id)),
            frame: "portrait",
            preview: treeIconPreview({ descricao_resumida: minor.foco }),
        },
        icons,
    };
}
function powerIcon(god, catalog, prefix) {
    const powerId = god.godpower?.[0]?.id;
    if (powerId == null)
        return null;
    const power = catalog.godpowerById.get(powerId);
    if (!power)
        return null;
    return {
        key: `gp-${prefix}-${power.id}`,
        nome: power.nome,
        src: getGodPowerAssetUrl(power),
        to: link(catalog, "poderes", catalog.godpowerSlugById.get(power.id)),
        frame: "power",
        preview: treeIconPreview(power),
    };
}
function techIcon(catalog, tech, index, prefix = "") {
    return {
        key: `t-${prefix}${index}`,
        nome: tech.nome,
        src: getTecnologiaAssetUrl(tech),
        to: link(catalog, "tecnologias", catalog.tecnologiaSlugByIndex.get(index)),
        frame: "tech",
        preview: treeIconPreview(tech),
    };
}
function mythUnitsFor(minor, catalog) {
    const found = [];
    const seen = new Set();
    function add(unit) {
        if (!unit || seen.has(unit.id) || !isMythUnit(unit))
            return;
        seen.add(unit.id);
        found.push(unit);
    }
    for (const ref of minor.unidades_exclusivas ?? []) {
        const byId = catalog.unidadeById.get(ref.id);
        if (byId?.nome === ref.nome)
            add(byId);
        else
            add(findUnitByName(catalog, ref.nome));
    }
    for (const unit of catalog.unidadeById.values()) {
        const owners = unit.god_dono;
        if (!Array.isArray(owners) || !owners.some((owner) => owner.id === minor.id))
            continue;
        add(unit);
    }
    return found;
}
function findUnitByName(catalog, nome) {
    for (const unit of catalog.unidadeById.values()) {
        if (unit.nome === nome)
            return unit;
    }
    return undefined;
}
function isMythUnit(unit) {
    return (unit.tipo ?? []).some((tipo) => /m[ií]tic|myth/i.test(tipo.type ?? ""));
}
function link(catalog, section, slug) {
    if (!slug)
        return undefined;
    return localeSectionPath(catalog.locale, section, slug);
}
