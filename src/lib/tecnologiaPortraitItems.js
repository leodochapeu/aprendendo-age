import { localeSectionPath } from "@/lib/localeRoutes";
import { getTecnologiaAssetUrl } from "@/lib/tecnologiaAssetUrl";
import { resolveTecnologiaIndex } from "@/lib/tecnologiaIndex";
export function tecnologiaPortraitItemsFromRefs(catalog, refs) {
    const { locale, tecnologias, tecnologiaSlugByIndex, tecnologiaIndexByNotionId } = catalog;
    return refs.map((ref, i) => {
        const idx = resolveTecnologiaIndex(tecnologias, tecnologiaIndexByNotionId, ref);
        const t = idx >= 0 ? tecnologias[idx] : undefined;
        const slug = idx >= 0 ? tecnologiaSlugByIndex.get(idx) : undefined;
        return {
            key: `tec-${ref.id}-${i}`,
            to: slug
                ? localeSectionPath(locale, "tecnologias", slug)
                : localeSectionPath(locale, "tecnologias"),
            nome: ref.nome,
            src: t ? getTecnologiaAssetUrl(t) : undefined,
        };
    });
}
export function tecnologiaPortraitItemsFromNames(catalog, names) {
    const { locale, tecnologias, tecnologiaSlugByIndex } = catalog;
    return names.map((nome, i) => {
        const idx = tecnologias.findIndex((t) => t.nome === nome);
        const t = idx >= 0 ? tecnologias[idx] : undefined;
        const slug = idx >= 0 ? tecnologiaSlugByIndex.get(idx) : undefined;
        return {
            key: `tec-${slug ?? nome}-${i}`,
            to: slug
                ? localeSectionPath(locale, "tecnologias", slug)
                : localeSectionPath(locale, "tecnologias"),
            nome,
            src: t ? getTecnologiaAssetUrl(t) : undefined,
        };
    });
}
