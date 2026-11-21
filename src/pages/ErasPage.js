import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EntityCard } from "@/components/ui/EntityCard";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
export function ErasPage() {
    const { t } = useTranslation();
    const { eras, eraSlugById } = useCatalog();
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: t("pages.eras.title"), description: t("pages.eras.description") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-1 lg:grid-cols-1", children: eras.map((e) => (_jsx("li", { children: _jsx(EntityCard, { to: `/eras/${eraSlugById.get(e.id) ?? e.id}`, title: e.nome, subtitle: e.hint, meta: _jsx(NotionText, { text: e.description }), watermarkSrc: getEraAssetUrl(e) }) }, e.id))) })] }));
}
