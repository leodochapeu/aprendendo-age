import { jsx as _jsx } from "react/jsx-runtime";
import { useCatalog } from "@/hooks/useCatalog";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
const imgClass = "notion-token-inline mr-0.5 inline-block h-[1em] max-h-[1.1em] w-auto shrink-0 align-[-0.12em] object-contain";
/** Ícone da civilização (`assets/pantheons`) antes do texto da meta — recebe o id numérico do panteão (ex. `firstNumId(unidade.panteao)` ou `firstNumId(tecnologia.panteoes)`). */
export function PantheonMetaIcon({ panteaoId }) {
    const { panteaoById } = useCatalog();
    const p = panteaoById.get(panteaoId);
    const src = p ? getPantheonWatermarkUrl(p) : undefined;
    if (!src)
        return null;
    const nome = panteaoById.get(panteaoId)?.nome;
    return _jsx("img", { src: src, alt: "", "aria-hidden": true, title: nome, className: imgClass });
}
