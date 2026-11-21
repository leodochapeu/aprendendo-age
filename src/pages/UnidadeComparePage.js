import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UnidadeCombateCompare, UnidadeCustoCompare, UnidadeVisaoGeralCompare, } from "@/components/unidade/UnidadeCompareSections";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeaderBlock } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { entityDisplayDescription } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
const compareTitleClass = "text-xl leading-snug [overflow-wrap:anywhere] sm:text-2xl lg:text-3xl";
export function UnidadeComparePage() {
    const { t, locale } = useTranslation();
    const { unidadeBySlug } = useCatalog();
    const { slugA, slugB } = useParams();
    const u1 = slugA ? unidadeBySlug.get(slugA) : undefined;
    const u2 = slugB ? unidadeBySlug.get(slugB) : undefined;
    if (!u1 || !u2) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: "/unidades", children: t("nav.units") }), _jsx("p", { className: "text-zinc-400", children: t("common.entityCompareNotFound.unit") })] }));
    }
    const icon1 = getUnidadeAssetUrl(u1);
    const icon2 = getUnidadeAssetUrl(u2);
    const [compareHeaderScrolled, setCompareHeaderScrolled] = useState(false);
    useEffect(() => {
        const threshold = 10;
        const onScroll = () => setCompareHeaderScrolled(window.scrollY > threshold);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (_jsxs("div", { children: [_jsx(BackLink, { to: "/unidades", children: t("nav.units") }), _jsx("div", { className: cn("sticky top-16 z-20 mb-8 -mx-4 px-4 py-2.5 md:top-0 md:-mx-10 md:px-10", "border-b border-transparent transition-[background-color,box-shadow,backdrop-filter,border-color] duration-200 ease-out", compareHeaderScrolled
                    ? "border-zinc-800/90 bg-zinc-950/93 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.82)] backdrop-blur-md ring-1 ring-black/45"
                    : "bg-transparent shadow-none ring-0"), children: _jsxs("header", { className: "flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-x-8", children: [_jsx(PageHeaderBlock, { title: u1.nome, description: entityDisplayDescription(u1, locale, t), headerIconSrc: icon1, descriptionTag: true, titleClassName: compareTitleClass, className: "w-full max-w-none lg:max-w-[min(100%,28rem)] lg:flex-1" }), _jsx(PageHeaderBlock, { align: "end", title: u2.nome, description: entityDisplayDescription(u2, locale, t), headerIconSrc: icon2, descriptionTag: true, titleClassName: compareTitleClass, className: "w-full max-w-none lg:max-w-[min(100%,28rem)] lg:flex-1" })] }) }), _jsx(Section, { title: t("common.overview"), children: _jsx(UnidadeVisaoGeralCompare, { u1: u1, u2: u2 }) }), _jsx(Section, { title: t("common.combat"), className: "mt-6", children: _jsx(UnidadeCombateCompare, { u1: u1, u2: u2 }) }), _jsx(Section, { title: t("common.costAndTraining"), className: "mt-6", children: _jsx(UnidadeCustoCompare, { u1: u1, u2: u2 }) })] }));
}
