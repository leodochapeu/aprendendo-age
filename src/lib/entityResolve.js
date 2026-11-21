import { getLocaleCatalog } from "@/data/catalogLocale";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { getTecnologiaAssetUrl } from "@/lib/tecnologiaAssetUrl";
import { resolveTecnologiaIndex } from "@/lib/tecnologiaIndex";
import { construcaoPublicId, construcaoVariantQuery } from "@/lib/buildingFamilies";
import { getConstrucaoAssetUrl, getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
export function createEntityResolver(catalog) {
    const { locale, deusById, deusSlugById, panteaoById, panteaoSlugById, eraById, eraSlugById, godpowerById, godpowerSlugById, unidadeById, unidadeSlugById, construcaoById, construcaoSlugById, tecnologias, tecnologiaSlugByIndex, tecnologiaIndexByNotionId, } = catalog;
    function resolveDeusLink(id, label) {
        const d = deusById.get(id);
        if (!d)
            return null;
        return {
            kind: "deus",
            to: localeSectionPath(locale, "deuses", deusSlugById.get(id) ?? id),
            label: label ?? d.nome,
            imageSrc: getDeusAssetUrl(d),
        };
    }
    function resolvePanteaoLink(id, label) {
        const p = panteaoById.get(id);
        if (!p)
            return null;
        return {
            kind: "panteao",
            to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(id) ?? id),
            label: label ?? p.nome,
            imageSrc: getPantheonWatermarkUrl(p),
        };
    }
    function resolveEraLink(id, label) {
        const e = eraById.get(id);
        if (!e)
            return null;
        return {
            kind: "era",
            to: localeSectionPath(locale, "eras", eraSlugById.get(id) ?? id),
            label: label ?? e.nome,
            imageSrc: getEraAssetUrl(e),
        };
    }
    function resolveGodpowerLink(id, label) {
        const g = godpowerById.get(id);
        if (!g)
            return null;
        return {
            kind: "godpower",
            to: localeSectionPath(locale, "poderes", godpowerSlugById.get(id) ?? id),
            label: label ?? g.nome,
            imageSrc: getGodPowerAssetUrl(g),
        };
    }
    function resolveUnidadeLink(id, label) {
        const u = unidadeById.get(id);
        if (!u)
            return null;
        return {
            kind: "unidade",
            to: localeSectionPath(locale, "unidades", unidadeSlugById.get(id) ?? id),
            label: label ?? u.nome,
            imageSrc: getUnidadeAssetUrl(u),
        };
    }
    function resolveConstrucaoLink(id, label) {
        const publicId = construcaoPublicId(id);
        const c = construcaoById.get(publicId);
        if (!c)
            return null;
        return {
            kind: "construcao",
            to: `${localeSectionPath(locale, "construcoes", construcaoSlugById.get(publicId) ?? publicId)}${construcaoVariantQuery(id)}`,
            label: label ?? c.nome,
            imageSrc: getConstrucaoAssetUrl(c),
        };
    }
    function resolveTecnologiaLinkByIndex(index, label) {
        const t = tecnologias[index];
        if (!t)
            return null;
        const slug = tecnologiaSlugByIndex.get(index);
        if (!slug)
            return null;
        return {
            kind: "tecnologia",
            to: localeSectionPath(locale, "tecnologias", slug),
            label: label ?? t.nome,
            imageSrc: getTecnologiaAssetUrl(t),
        };
    }
    function resolveTecnologiaLink(ref) {
        const ti = resolveTecnologiaIndex(tecnologias, tecnologiaIndexByNotionId, ref);
        if (ti < 0)
            return null;
        return resolveTecnologiaLinkByIndex(ti, ref.nome);
    }
    function resolveEntityNumRef(kind, ref) {
        switch (kind) {
            case "deus":
                return resolveDeusLink(ref.id, ref.nome);
            case "panteao":
                return resolvePanteaoLink(ref.id, ref.nome);
            case "era":
                return resolveEraLink(ref.id, ref.nome);
            case "godpower":
                return resolveGodpowerLink(ref.id, ref.nome);
            case "unidade":
                return resolveUnidadeLink(ref.id, ref.nome);
            case "construcao":
                return resolveConstrucaoLink(ref.id, ref.nome);
            default:
                return null;
        }
    }
    return {
        resolveDeusLink,
        resolvePanteaoLink,
        resolveEraLink,
        resolveGodpowerLink,
        resolveUnidadeLink,
        resolveConstrucaoLink,
        resolveTecnologiaLink,
        resolveTecnologiaLinkByIndex,
        resolveEntityNumRef,
    };
}
/** Resolvers PT-canônicos (legado); prefira `useEntityResolver()`. */
const ptResolver = createEntityResolver(getLocaleCatalog("pt"));
export const resolveDeusLink = ptResolver.resolveDeusLink;
export const resolvePanteaoLink = ptResolver.resolvePanteaoLink;
export const resolveEraLink = ptResolver.resolveEraLink;
export const resolveGodpowerLink = ptResolver.resolveGodpowerLink;
export const resolveUnidadeLink = ptResolver.resolveUnidadeLink;
export const resolveConstrucaoLink = ptResolver.resolveConstrucaoLink;
export const resolveTecnologiaLink = ptResolver.resolveTecnologiaLink;
export const resolveTecnologiaLinkByIndex = ptResolver.resolveTecnologiaLinkByIndex;
export const resolveEntityNumRef = ptResolver.resolveEntityNumRef;
