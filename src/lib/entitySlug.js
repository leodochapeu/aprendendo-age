import { slugifyStartSegment } from "@/lib/startSlug";
/**
 * Slug de URL a partir do título (`nome`) de entidades em catálogo.
 * Colisões no mesmo conjunto viram sufixos `-2`, `-3`, …
 */
export function buildRecordSlugMaps(items, getTitle) {
    const bySlug = new Map();
    const slugById = new Map();
    const used = new Set();
    for (const item of items) {
        let base = slugifyStartSegment(getTitle(item));
        if (!base)
            base = `id-${item.id}`;
        let slug = base;
        let n = 2;
        while (used.has(slug)) {
            slug = `${base}-${n++}`;
        }
        used.add(slug);
        bySlug.set(slug, item);
        slugById.set(item.id, slug);
    }
    return { bySlug, slugById };
}
/** Para listas sem `id` no JSON (ex.: tecnologias, mapas): slug por índice no array. */
export function buildIndexSlugMaps(items, getTitle) {
    const bySlug = new Map();
    const slugByIndex = new Map();
    const used = new Set();
    items.forEach((item, index) => {
        let base = slugifyStartSegment(getTitle(item, index));
        if (!base)
            base = `idx-${index}`;
        let slug = base;
        let n = 2;
        while (used.has(slug)) {
            slug = `${base}-${n++}`;
        }
        used.add(slug);
        bySlug.set(slug, item);
        slugByIndex.set(index, slug);
    });
    return { bySlug, slugByIndex };
}
