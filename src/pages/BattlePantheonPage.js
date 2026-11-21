import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BattlePantheonCard } from "@/components/battle/BattlePantheonCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
export function BattlePantheonPage() {
    const { t } = useTranslation();
    const { panteoes, panteaoSlugById } = useCatalog();
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: t("pages.battle.pantheonTitle"), description: t("pages.battle.pantheonDescription") }), _jsx("ul", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: panteoes.map((p) => {
                    const slug = panteaoSlugById.get(p.id) ?? String(p.id);
                    return (_jsx("li", { children: _jsx(BattlePantheonCard, { to: `/battle/random/${slug}`, title: p.nome, subtitle: p.description, pantheonId: p.id, pantheonName: p.nome, heroBackground: p.hero_background, icon: p.icon }) }, p.id));
                }) })] }));
}
